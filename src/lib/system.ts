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

export const initialSystem: SystemState = {
  telemetry: {
    h2sBefore: 46,
    h2sAfter: 3.2,
    ch4: 68,
    leak: 30,
    pressureDigester: 0.72,
    pressureCollector: 0.85,
    temperature: 33.4,
    humidity: 91,
    flow: 0,
  },
  valveOpen: false,
  valveMode: "auto",
  filterHealth: 72,
  filterWarning: false,
  leakWarning: false,
};

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));
const rand = (a: number, b: number) => a + Math.random() * (b - a);

export function computeNext(prev: SystemState): SystemState {
  const t: Telemetry = { ...prev.telemetry };

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
    t.flow = rand(12, 20);
  } else {
    t.pressureDigester = clamp(t.pressureDigester + rand(0.02, 0.05), 0, 3);
    t.flow = rand(0, 0.4);
  }

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
  };
}

export function h2sTone(ppm: number): "good" | "warn" | "danger" {
  if (ppm >= THRESHOLDS.h2sDanger) return "danger";
  if (ppm >= THRESHOLDS.h2sWarn) return "warn";
  return "good";
}
