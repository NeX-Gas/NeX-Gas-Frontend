import { initialSystem, THRESHOLDS } from "./system";
import type {
  FirmwareEvent,
  FirmwareState,
  SystemState,
  Telemetry,
  ValveMode,
} from "./types";

/**
 * Adapter payload firmware -> state dashboard.
 *
 * Firmware (`NeX-Gas-Firmware.ino`) mengirim JSON apa adanya:
 *   telemetry : ts, uptimeMs, h2sBefore, h2sAfter, ch4, leak, pressure*,
 *               temperature, humidity, gasLine*, ph, flow, gasSinceStartL,
 *               sensorsReady, rssi
 *   state     : valveOpen, valveMode, filterWarning, leakWarning, filterHealth,
 *               pressureCalibrated, phCalibrated, sensorsReady, buffered,
 *               uptimeMs, firmware
 *   event     : ts, uptimeMs, type, severity, message
 *
 * Tidak ada angka karangan di sini: field yang hilang memakai nilai terakhir,
 * dan nilai -1 tetap -1 supaya UI bisa menandai sensor belum tersedia.
 */

/** `true` kalau nilainya benar-benar dari sensor (bukan -1 / NaN). */
export function isSensorValue(value: unknown): value is number {
  return (
    typeof value === "number" && Number.isFinite(value) && value >= 0
  );
}

/** Ubah -1 (tidak tersedia) menjadi `null` untuk kebutuhan tampilan. */
export function sensorValue(value: number): number | null {
  return isSensorValue(value) ? value : null;
}

const num = (value: unknown, fallback: number) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const bool = (value: unknown, fallback: boolean) =>
  typeof value === "boolean" ? value : fallback;

const text = (value: unknown, fallback: string) =>
  typeof value === "string" && value.length > 0 ? value : fallback;

const valveMode = (value: unknown, fallback: ValveMode): ValveMode =>
  value === "auto" || value === "manual" ? value : fallback;

/** L/menit (firmware) -> L/jam (satuan yang dipakai dashboard). */
const lpmToLph = (lpm: number) => lpm * 60;

export function normalizeTelemetry(
  raw: unknown,
  prev: Telemetry = initialSystem.telemetry,
): Telemetry {
  const src = (raw ?? {}) as Record<string, unknown>;
  return {
    ts: num(src.ts, prev.ts),
    uptimeMs: num(src.uptimeMs, prev.uptimeMs),
    // -1 = MQ-136 kedua belum dipasang; jangan diubah jadi 0.
    h2sBefore: num(src.h2sBefore, prev.h2sBefore),
    h2sAfter: num(src.h2sAfter, prev.h2sAfter),
    ch4: num(src.ch4, prev.ch4),
    leak: num(src.leak, prev.leak),
    pressureDigester: num(src.pressureDigester, prev.pressureDigester),
    pressureCollector: num(src.pressureCollector, prev.pressureCollector),
    temperature: num(src.temperature, prev.temperature),
    humidity: num(src.humidity, prev.humidity),
    gasLineTemperature: num(
      src.gasLineTemperature,
      prev.gasLineTemperature,
    ),
    gasLineHumidity: num(src.gasLineHumidity, prev.gasLineHumidity),
    ph: num(src.ph, prev.ph),
    // firmware: L/menit; dashboard: L/jam
    flow: isSensorValue(src.flow) ? lpmToLph(num(src.flow, prev.flow)) : prev.flow,
    gasSinceStartL: num(src.gasSinceStartL, prev.gasSinceStartL),
    sensorsReady: bool(src.sensorsReady, prev.sensorsReady),
    rssi: num(src.rssi, prev.rssi),
  };
}

export function normalizeState(
  raw: unknown,
  prev: SystemState = initialSystem,
): SystemState {
  const src = (raw ?? {}) as Record<string, unknown>;
  const sensorsReady = bool(src.sensorsReady, prev.telemetry.sensorsReady);

  return {
    ...prev,
    valveOpen: bool(src.valveOpen, prev.valveOpen),
    valveMode: valveMode(src.valveMode, prev.valveMode),
    filterWarning: bool(src.filterWarning, prev.filterWarning),
    leakWarning: bool(src.leakWarning, prev.leakWarning),
    filterHealth: num(src.filterHealth, prev.filterHealth),
    pressureCalibrated: bool(
      src.pressureCalibrated,
      prev.pressureCalibrated,
    ),
    phCalibrated: bool(src.phCalibrated, prev.phCalibrated),
    buffered: num(src.buffered, prev.buffered),
    firmware: text(src.firmware, prev.firmware),
    telemetry: { ...prev.telemetry, sensorsReady },
    deviceOnline: true,
    lastSeen: Date.now(),
  };
}

/** Pesan yang diharapkan dari backend (MQTT bridge) lewat WebSocket. */
export type DeviceMessage =
  | { type: "telemetry"; payload: Record<string, unknown> }
  | { type: "state"; payload: Record<string, unknown> }
  | { type: "event"; payload: FirmwareEvent }
  | { type: "status"; payload: "online" | "offline" }
  | { type: "snapshot"; payload: { state?: FirmwareState; telemetry?: unknown } };

export type AppliedMessage = {
  state: SystemState;
  /** event yang perlu ditampilkan sebagai notifikasi */
  event?: FirmwareEvent;
};

export function applyMessage(
  prev: SystemState,
  message: DeviceMessage,
): AppliedMessage {
  switch (message.type) {
    case "telemetry": {
      const telemetry = normalizeTelemetry(message.payload, prev.telemetry);
      const filterWarning =
        isSensorValue(telemetry.h2sAfter) &&
        telemetry.h2sAfter >= THRESHOLDS.h2sWarn;
      const leakWarning =
        isSensorValue(telemetry.leak) &&
        telemetry.leak >= THRESHOLDS.leakWarn;
      return {
        state: {
          ...prev,
          telemetry,
          filterWarning,
          leakWarning,
          deviceOnline: true,
          lastSeen: Date.now(),
        },
      };
    }
    case "state": {
      return { state: normalizeState(message.payload, prev) };
    }
    case "snapshot": {
      const base = message.payload.state
        ? normalizeState(message.payload.state, prev)
        : prev;
      if (message.payload.telemetry === undefined) return { state: base };
      const telemetry = normalizeTelemetry(
        message.payload.telemetry,
        base.telemetry,
      );
      return { state: { ...base, telemetry, lastSeen: Date.now() } };
    }
    case "event": {
      return {
        state: { ...prev, lastSeen: Date.now() },
        event: message.payload,
      };
    }
    case "status": {
      const online = message.payload === "online";
      return {
        state: {
          ...prev,
          deviceOnline: online,
          lastSeen: online ? Date.now() : prev.lastSeen,
        },
      };
    }
    default: {
      return { state: prev };
    }
  }
}

/** URL WebSocket backend; kosong = mode demo (simulator lokal). */
export const DEVICE_WS_URL = process.env.NEXT_PUBLIC_DEVICE_WS_URL ?? "";

/** Endpoint REST backend (aksi non-realtime). */
export const DEVICE_API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export const isDemoMode = DEVICE_WS_URL.length === 0;
