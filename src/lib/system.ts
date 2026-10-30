import type { SystemState, Telemetry } from "./types";

export const THRESHOLDS = {
  valveOpenAt: 1.0,
  valveCloseAt: 0.3,
  collectorFullAt: 2.0,
  minDeltaPressure: 0.15,
  h2sWarn: 5,
  h2sDanger: 12,
  leakWarn: 400,
  leakDanger: 1000,
  tempMin: 28,
  tempMax: 38,
  humidityMax: 80,
} as const;

/** Nilai pengganti saat firmware mengirim -1 (sensor tidak tersedia). */
export const SENSOR_UNAVAILABLE = -1;

export const initialSystem: SystemState = {
  telemetry: {
    ts: 0,
    uptimeMs: 0,
    h2sBefore: SENSOR_UNAVAILABLE,
    h2sAfter: 3.2,
    ch4: 68,
    leak: 30,
    pressureDigester: 0.72,
    pressureCollector: 0.85,
    temperature: 33.4,
    humidity: 91,
    gasLineTemperature: 32.1,
    gasLineHumidity: 88,
    ph: 6.8,
    flow: 0,
    gasSinceStartL: 12.5,
    sensorsReady: true,
    rssi: -54,
  },
  valveOpen: false,
  valveMode: "auto",
  filterHealth: 72,
  filterWarning: false,
  leakWarning: false,
  pressureCalibrated: true,
  phCalibrated: false,
  buffered: 0,
  firmware: "1.0.0",
  deviceId: "nexgas-001",
  deviceOnline: true,
  lastSeen: null,
};

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));
const rand = (a: number, b: number) => a + Math.random() * (b - a);

/**
 * Simulator lokal. Dipakai hanya kalau dashboard tidak tersambung ke backend
 * (env `NEXT_PUBLIC_DEVICE_WS_URL` kosong) atau saat demo tanpa alat.
 */
export function computeNext(prev: SystemState): SystemState {
  const t: Telemetry = { ...prev.telemetry };

  t.ts = Math.floor(Date.now() / 1000);
  t.uptimeMs = prev.telemetry.uptimeMs + 2500;
  t.h2sBefore = clamp(t.h2sBefore + rand(-1.8, 1.8), 20, 95);
  t.h2sAfter = clamp(
    t.h2sAfter + rand(-0.4, 0.5) + (prev.filterHealth < 40 ? 0.25 : 0.03),
    0.5,
    28,
  );
  t.ch4 = clamp(t.ch4 + rand(-1, 1), 45, 85);
  t.leak = clamp(t.leak + rand(-30, 32), 0, 1500);
  t.temperature = clamp(t.temperature + rand(-0.3, 0.3), 26, 40);
  t.humidity = clamp(t.humidity + rand(-1.5, 1.5), 55, 99);
  t.gasLineTemperature = clamp(
    t.gasLineTemperature + rand(-0.3, 0.3),
    24,
    38,
  );
  t.gasLineHumidity = clamp(t.gasLineHumidity + rand(-1.5, 1.5), 50, 99);
  t.ph = clamp(t.ph + rand(-0.05, 0.05), 6.2, 7.6);
  t.pressureCollector = clamp(t.pressureCollector - rand(0.004, 0.018), 0, 3);

  let valveOpen = prev.valveOpen;
  const leakDanger = t.leak >= THRESHOLDS.leakDanger;

  if (prev.valveMode === "auto") {
    if (leakDanger) {
      valveOpen = false;
    } else if (
      t.pressureDigester >= THRESHOLDS.valveOpenAt &&
      t.pressureDigester - t.pressureCollector >= THRESHOLDS.minDeltaPressure &&
      t.pressureCollector < THRESHOLDS.collectorFullAt
    ) {
      valveOpen = true;
    } else if (
      t.pressureDigester <= THRESHOLDS.valveCloseAt ||
      t.pressureCollector >= THRESHOLDS.collectorFullAt
    ) {
      valveOpen = false;
    }
  } else if (leakDanger) {
    valveOpen = false;
  }

  if (valveOpen) {
    t.pressureDigester = clamp(t.pressureDigester - rand(0.03, 0.06), 0, 3);
    t.pressureCollector = clamp(t.pressureCollector + rand(0.02, 0.045), 0, 3);
    // Satuan dashboard: L/jam (firmware mengirim L/menit, adapter mengalikan 60).
    t.flow = rand(42, 72);
  } else {
    t.pressureDigester = clamp(t.pressureDigester + rand(0.02, 0.05), 0, 3);
    t.flow = rand(0, 1.2);
  }

  t.gasSinceStartL = t.gasSinceStartL + t.flow * (2.5 / 3600);

  const filterHealth = clamp(
    prev.filterHealth - (t.h2sAfter > THRESHOLDS.h2sWarn ? 0.6 : 0.08),
    0,
    100,
  );

  return {
    ...prev,
    telemetry: t,
    valveOpen,
    filterHealth,
    filterWarning: t.h2sAfter >= THRESHOLDS.h2sWarn,
    leakWarning: t.leak >= THRESHOLDS.leakWarn,
    deviceOnline: true,
    lastSeen: Date.now(),
  };
}

export function h2sTone(ppm: number): "good" | "warn" | "danger" {
  if (ppm >= THRESHOLDS.h2sDanger) return "danger";
  if (ppm >= THRESHOLDS.h2sWarn) return "warn";
  return "good";
}
