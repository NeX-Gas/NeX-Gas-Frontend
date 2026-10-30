import { initialSystem, THRESHOLDS } from "./system";
import type {
  AppNotification,
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
  | { type: "telemetry"; payload: Record<string, unknown>; deviceId?: string }
  | { type: "state"; payload: Record<string, unknown>; deviceId?: string }
  | { type: "event"; payload: FirmwareEvent; deviceId?: string }
  | { type: "status"; payload: "online" | "offline"; deviceId?: string }
  | {
      type: "snapshot";
      payload: { state?: FirmwareState; telemetry?: unknown };
      deviceId?: string;
    };

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
          ...(message.deviceId ? { deviceId: message.deviceId } : null),
          telemetry,
          filterWarning,
          leakWarning,
          deviceOnline: true,
          lastSeen: Date.now(),
        },
      };
    }
    case "state": {
      const next = normalizeState(message.payload, prev);
      return {
        state: message.deviceId ? { ...next, deviceId: message.deviceId } : next,
      };
    }
    case "snapshot": {
      const base = message.payload.state
        ? normalizeState(message.payload.state, prev)
        : prev;
      const withId = message.deviceId ? { ...base, deviceId: message.deviceId } : base;
      if (message.payload.telemetry === undefined) return { state: withId };
      const telemetry = normalizeTelemetry(
        message.payload.telemetry,
        withId.telemetry,
      );
      return { state: { ...withId, telemetry, lastSeen: Date.now() } };
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

/** Nilai `null` dari backend (sensor tidak ada) -> sentinel `-1` ala firmware. */
const nullToUnavailable = (value: unknown): unknown =>
  value === null || value === undefined ? -1 : value;

/**
 * Ubah objek `data` (normalized backend) menjadi payload bergaya firmware
 * yang dipahami `normalizeTelemetry()`. Backend memakai nama panjang
 * (`temperatureC`, `h2sAfter`, ...), firmware memakai nama pendek.
 */
function telemetryFromBackend(envelope: Record<string, unknown>): Record<string, unknown> {
  const data = (envelope.data ?? {}) as Record<string, unknown>;
  const frontend = (envelope.frontend ?? {}) as Record<string, unknown>;
  const source = (data.telemetry ?? frontend.telemetry ?? null) as Record<string, unknown> | null;

  // `data` = payload ternormalisasi backend (NULL dipertahankan), `frontend` = subset siap pakai.
  if (Object.keys(data).length > 0) {
    return {
      ts: typeof data.deviceTimestamp === "string" ? Math.floor(new Date(data.deviceTimestamp).getTime() / 1000) : 0,
      uptimeMs: nullToUnavailable(data.uptimeMs),
      h2sBefore: nullToUnavailable(data.h2sBefore),
      h2sAfter: nullToUnavailable(data.h2sAfter),
      ch4: nullToUnavailable(data.ch4Estimate ?? data.ch4),
      leak: nullToUnavailable(data.leakPpm ?? data.leak),
      pressureDigester: nullToUnavailable(data.pressureDigesterKpa ?? data.pressureDigester),
      pressureCollector: nullToUnavailable(data.pressureCollectorKpa ?? data.pressureCollector),
      temperature: nullToUnavailable(data.temperatureC ?? data.temperature),
      humidity: nullToUnavailable(data.humidityPct ?? data.humidity),
      gasLineTemperature: nullToUnavailable(data.gasLineTemperatureC ?? data.gasLineTemperature),
      gasLineHumidity: nullToUnavailable(data.gasLineHumidityPct ?? data.gasLineHumidity),
      ph: nullToUnavailable(data.ph),
      flow: nullToUnavailable(data.flowEstimateLpm ?? data.flow),
      gasSinceStartL: nullToUnavailable(data.gasSinceStartTotalL ?? data.gasSinceStartL),
      sensorsReady: typeof data.sensorsReady === "boolean" ? data.sensorsReady : undefined,
      rssi: nullToUnavailable(data.rssi),
    };
  }

  if (!source) return {};
  return {
    ts: 0,
    h2sBefore: nullToUnavailable(source.h2sBefore),
    h2sAfter: nullToUnavailable(source.h2sAfter),
    ch4: nullToUnavailable(source.ch4),
    leak: nullToUnavailable(source.leak),
    pressureDigester: nullToUnavailable(source.pressureDigester),
    pressureCollector: nullToUnavailable(source.pressureCollector),
    temperature: nullToUnavailable(source.temperature),
    humidity: nullToUnavailable(source.humidity),
    gasLineTemperature: nullToUnavailable(source.gasLineTemperature),
    gasLineHumidity: nullToUnavailable(source.gasLineHumidity),
    ph: nullToUnavailable(source.ph),
    flow: nullToUnavailable(source.flow),
    gasSinceStartL: nullToUnavailable(source.gasSinceStartL),
    sensorsReady: typeof source.sensorsReady === "boolean" ? source.sensorsReady : undefined,
    rssi: nullToUnavailable(source.rssi),
  };
}

function stateFromBackend(envelope: Record<string, unknown>): Record<string, unknown> | null {
  const data = (envelope.data ?? {}) as Record<string, unknown>;
  const frontend = (envelope.frontend ?? {}) as Record<string, unknown>;
  const source = Object.keys(data).length > 0 ? data : frontend;
  if (!source || Object.keys(source).length === 0) return null;

  const state: Record<string, unknown> = {
    valveOpen: source.valveOpen,
    valveMode: source.valveMode,
    filterWarning: source.filterWarning,
    leakWarning: source.leakWarning,
    filterHealth: source.filterHealth,
    pressureCalibrated: source.pressureCalibrated,
    phCalibrated: source.phCalibrated,
    sensorsReady: source.sensorsReady,
    buffered: source.buffered,
    firmware: source.firmware,
    uptimeMs: source.uptimeMs,
  };

  const telemetry = (frontend.telemetry ?? null) as Record<string, unknown> | null;
  if (telemetry) {
    state.telemetry = {
      h2sBefore: nullToUnavailable(telemetry.h2sBefore),
      h2sAfter: nullToUnavailable(telemetry.h2sAfter),
      ch4: nullToUnavailable(telemetry.ch4),
      leak: nullToUnavailable(telemetry.leak),
      pressureDigester: nullToUnavailable(telemetry.pressureDigester),
      pressureCollector: nullToUnavailable(telemetry.pressureCollector),
      temperature: nullToUnavailable(telemetry.temperature),
      humidity: nullToUnavailable(telemetry.humidity),
      flow: nullToUnavailable(telemetry.flow),
    };
  }

  return state;
}

const SEVERITIES = ["info", "waspada", "bahaya"] as const;
type Severity = (typeof SEVERITIES)[number];

function severityOf(value: unknown): Severity {
  return typeof value === "string" && (SEVERITIES as readonly string[]).includes(value)
    ? (value as Severity)
    : "info";
}

/** Notifikasi dari backend (`notification`) dirapikan agar cocok `AppNotification`. */
function notificationFromBackend(value: unknown): AppNotification | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  if (typeof raw.title !== "string") return null;

  const severity = severityOf(raw.severity);
  return {
    id: typeof raw.id === "string" ? raw.id : `evt-${raw.title}-${raw.time ?? Date.now()}`,
    category: raw.category === "info" ? "info" : "peringatan",
    severity,
    badge: typeof raw.badge === "string" ? raw.badge : severity.toUpperCase(),
    time: typeof raw.time === "string" ? raw.time : new Date().toISOString(),
    title: raw.title,
    body: typeof raw.body === "string" ? raw.body : "",
    action: typeof raw.action === "string" ? raw.action : "",
    unread: true,
  };
}

export type BackendIncoming = {
  message: DeviceMessage;
  notification?: AppNotification;
};

/**
 * Baca satu pesan WebSocket backend NeX-Gas.
 *
 * Backend mengirim amplop:
 *   { type: "telemetry", deviceId, data, frontend, ... }
 *   { type: "state",     deviceId, data, frontend, ... }
 *   { type: "status",    deviceId, data: { status } | "online" }
 *   { type: "event",     deviceId, data, notification }
 *
 * Format lama `{ type, payload }` tetap diterima supaya kompatibel.
 */
export function parseBackendMessage(input: unknown): BackendIncoming | null {
  if (!input || typeof input !== "object") return null;
  const envelope = input as Record<string, unknown>;
  const type = envelope.type;
  if (typeof type !== "string") return null;

  // Pesan ping/pong gateway tidak perlu diteruskan ke UI.
  if (type === "pong" || type === "ping") return null;

  const deviceId = typeof envelope.deviceId === "string" ? envelope.deviceId : undefined;

  // Kompatibilitas bentuk lama { type, payload }.
  if ("payload" in envelope && !("data" in envelope) && !("frontend" in envelope)) {
    return { message: envelope as unknown as DeviceMessage };
  }

  if (type === "telemetry") {
    return {
      message: { type: "telemetry", payload: telemetryFromBackend(envelope), deviceId },
    };
  }

  if (type === "state") {
    const payload = stateFromBackend(envelope);
    return payload ? { message: { type: "state", payload, deviceId } } : null;
  }

  if (type === "status") {
    const data = envelope.data;
    const nested =
      data && typeof data === "object" ? (data as Record<string, unknown>).status : undefined;
    const status = typeof nested === "string" ? nested : typeof data === "string" ? data : undefined;
    if (!status) return null;
    return {
      message: { type: "status", payload: status === "online" ? "online" : "offline", deviceId },
    };
  }

  if (type === "event") {
    const data = (envelope.data ?? {}) as Record<string, unknown>;
    const event: FirmwareEvent = {
      type: typeof data.type === "string" ? data.type : "device_event",
      severity: severityOf(data.severity),
      message: typeof data.message === "string" ? data.message : undefined,
      uptimeMs: typeof data.uptimeMs === "number" ? data.uptimeMs : undefined,
    };
    const notification = notificationFromBackend(envelope.notification) ?? undefined;
    return { message: { type: "event", payload: event, deviceId }, notification };
  }

  if (type === "snapshot") {
    return { message: envelope as unknown as DeviceMessage };
  }

  return null;
}

/**
 * Ubah hasil `fetchSnapshot()` (REST) menjadi pesan-pesan yang sama seperti
 * yang dikirim lewat WebSocket, supaya UI langsung terisi saat halaman dibuka.
 */
export function messagesFromSnapshot(snapshot: {
  telemetry: Record<string, unknown> | null;
  state: Record<string, unknown> | null;
  online: boolean | null;
}): DeviceMessage[] {
  const messages: DeviceMessage[] = [];
  if (snapshot.state) {
    const payload = stateFromBackend({ data: snapshot.state });
    if (payload) messages.push({ type: "state", payload });
  }
  if (snapshot.telemetry) {
    messages.push({
      type: "telemetry",
      payload: telemetryFromBackend({ data: snapshot.telemetry }),
    });
  }
  if (snapshot.online !== null) {
    messages.push({ type: "status", payload: snapshot.online ? "online" : "offline" });
  }
  return messages;
}

/**
 * URL WebSocket backend; kosong = mode demo (simulator lokal).
 * `NEXT_PUBLIC_WS_URL` mengikuti dokumentasi backend, `NEXT_PUBLIC_DEVICE_WS_URL`
 * dipertahankan supaya .env lama tetap jalan.
 */
export const DEVICE_WS_URL =
  process.env.NEXT_PUBLIC_WS_URL ?? process.env.NEXT_PUBLIC_DEVICE_WS_URL ?? "";

/** Endpoint REST backend (aksi non-realtime). */
export const DEVICE_API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export const isDemoMode = DEVICE_WS_URL.length === 0;
