"use client";

import {
  Cpu,
  Filter,
  Hand,
  Lock,
  Unlock,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/button";
import {
  MetricRow,
  Panel,
  PanelHead,
  ProgressBar,
  Readout,
  SectionLabel,
  StatusPill,
} from "@/components/ui";
import { useAppStore } from "@/components/app-store";
import { fmtValue, hasValue } from "@/lib/format";
import { h2sTone, THRESHOLDS } from "@/lib/system";
import type { ValveMode } from "@/lib/types";
import { cn } from "@/lib/cn";

/** Skala atas instrumen tekanan. Firmware menutup penampung di 2.0 kPa. */
const PRESSURE_MAX = 2.5;

function PressureBar({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "brand" | "deep";
}) {
  const pct = hasValue(value)
    ? Math.max(0, Math.min(100, (value / PRESSURE_MAX) * 100))
    : 0;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-32 w-12 overflow-hidden rounded-[2px] bg-info-100 sm:h-44 sm:w-14">
        {/* garis skala 0.3 / 1.0 / 2.0 kPa dari firmware */}
        {[
          { kpa: THRESHOLDS.valveCloseAt, tone: "bg-ink/20" },
          { kpa: THRESHOLDS.valveOpenAt, tone: "bg-brand/60" },
          { kpa: THRESHOLDS.collectorFullAt, tone: "bg-danger/50" },
        ].map((tick) => (
          <span
            key={tick.kpa}
            className={cn("absolute inset-x-0 h-px", tick.tone)}
            style={{ bottom: `${(tick.kpa / PRESSURE_MAX) * 100}%` }}
          />
        ))}
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 transition-[height] duration-700 ease-out",
            tone === "deep" ? "bg-brand" : "bg-brand-400",
          )}
          style={{ height: `${pct}%` }}
        />
      </div>
      <div className="text-center">
        <Readout value={fmtValue(value, 2)} unit="kPa" size="sm" />
        <p className="mt-0.5 text-[10.5px] leading-3.5 text-muted">{label}</p>
      </div>
    </div>
  );
}

export function PressureInstrument({ className }: { className?: string }) {
  const {
    telemetry,
    valveOpen,
    leakWarning,
    filterWarning,
    pressureCalibrated,
  } = useAppStore();
  const { pressureDigester, pressureCollector, flow, gasSinceStartL } = telemetry;
  const delta =
    hasValue(pressureDigester) && hasValue(pressureCollector)
      ? pressureDigester - pressureCollector
      : null;
  const collectorFull = pressureCollector >= THRESHOLDS.collectorFullAt;

  const state = leakWarning
    ? { text: "Aliran dihentikan — kebocoran", tone: "danger" as const }
    : collectorFull
      ? { text: "Penampung penuh", tone: "warn" as const }
      : valveOpen
        ? { text: "Gas mengalir", tone: "good" as const }
        : pressureDigester >= THRESHOLDS.valveOpenAt
          ? { text: "Siap — menunggu valve", tone: "good" as const }
          : { text: "Menunggu tekanan", tone: "neutral" as const };

  return (
    <Panel className={cn("flex flex-col", className)}>
      <PanelHead
        label="Instrumen Tekanan"
        title="Digester vs Penampung"
        right={
          <StatusPill tone={state.tone}>{state.text}</StatusPill>
        }
      />

      <div className="flex flex-1 flex-col gap-5 p-4 sm:flex-row sm:gap-6">
        {/* kolom instrumen */}
        <div className="flex items-start justify-center gap-3 sm:justify-start sm:gap-4">
          <div className="relative h-32 w-6 shrink-0 sm:h-44 sm:w-7">
            {[
              { v: PRESSURE_MAX, tone: "text-muted" },
              { v: THRESHOLDS.collectorFullAt, tone: "text-danger" },
              { v: THRESHOLDS.valveOpenAt, tone: "text-brand" },
              { v: 0, tone: "text-muted" },
            ].map(({ v, tone }) => (
              <span
                key={v}
                className={cn(
                  "absolute right-0 translate-y-1/2 font-mono text-[9.5px] leading-none tnum",
                  tone,
                )}
                style={{ bottom: `${(v / PRESSURE_MAX) * 100}%` }}
              >
                {v === 0 ? "0" : v.toFixed(1)}
              </span>
            ))}
          </div>

          <div className="flex gap-3 sm:gap-4">
            <PressureBar
              label="Digester"
              value={pressureDigester}
              tone="brand"
            />
            <PressureBar
              label="Penampung"
              value={pressureCollector}
              tone="deep"
            />
          </div>
        </div>

        {/* pembacaan pendukung */}
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 sm:border-l sm:border-line/35 sm:pl-6">
          <MetricRow
            label="Δ tekanan"
            hint="digester − penampung"
            value={
              delta === null
                ? "—"
                : `${delta >= 0 ? "+" : ""}${delta.toFixed(2)}`
            }
            unit="kPa"
            tone={delta !== null && delta < 0 ? "danger" : "ink"}
          />
          <MetricRow
            label="Aliran gas"
            value={fmtValue(flow, 1)}
            unit="L/jam"
            tone="ink"
          />
          <MetricRow
            label="Gas terkumpul"
            value={fmtValue(gasSinceStartL, 1)}
            unit="L"
            tone="ink"
          />
          <MetricRow
            label="Ambang valve"
            hint="buka / tutup"
            value={`${THRESHOLDS.valveOpenAt.toFixed(1)} / ${THRESHOLDS.valveCloseAt.toFixed(1)}`}
            unit="kPa"
            tone="muted"
          />
        </div>
      </div>

      <div className="flex items-start gap-2 border-t border-line/35 px-4 py-2.5">
        <p className="text-[11.5px] leading-4 text-muted">
          {!pressureCalibrated
            ? "Mode otomatis terkunci: sensor tekanan belum dikalibrasi 2 titik (Pengaturan → Kalibrasi)."
            : filterWarning
              ? "Filter H₂S jenuh — ganti media sebelum aliran berlanjut."
              : "Valve fail-safe N/C. Garis hijau = ambang buka, garis merah = penampung penuh."}
        </p>
      </div>
    </Panel>
  );
}

export function GasQuality({ className }: { className?: string }) {
  const { telemetry, filterWarning, leakWarning, filterHealth } = useAppStore();
  const { h2sBefore, h2sAfter, ch4, leak } = telemetry;

  const effectiveness =
    hasValue(h2sBefore) && hasValue(h2sAfter) && h2sBefore > 0
      ? Math.max(0, Math.min(100, Math.round((1 - h2sAfter / h2sBefore) * 100)))
      : null;
  const afterTone = h2sTone(h2sAfter);
  const status = leakWarning
    ? { text: "Bahaya — bocor", tone: "danger" as const }
    : filterWarning
      ? { text: "Perlu perhatian", tone: "warn" as const }
      : { text: "Aman", tone: "good" as const };

  return (
    <Panel className={cn("flex flex-col", className)}>
      <PanelHead
        label="Kualitas Gas"
        title="H₂S & Metana"
        right={<StatusPill tone={status.tone}>{status.text}</StatusPill>}
      />

      <div className="flex flex-col gap-4 p-4">
        <div>
          <div className="flex items-baseline justify-between">
            <SectionLabel>H₂S sesudah filter</SectionLabel>
            <span className="font-mono text-[10.5px] text-muted">
              &lt; {THRESHOLDS.h2sWarn} ppm
            </span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <Readout
              value={fmtValue(h2sAfter, 1)}
              unit="ppm"
              size="xl"
              tone={afterTone === "good" ? "ink" : "danger"}
            />
            <StatusPill tone={afterTone}>
              {afterTone === "good"
                ? "di bawah ambang"
                : afterTone === "warn"
                  ? "mendekati ambang"
                  : "tembus filter"}
            </StatusPill>
          </div>
        </div>

        <div className="inset px-3">
          <MetricRow
            label="H₂S sebelum filter"
            value={hasValue(h2sBefore) ? fmtValue(h2sBefore, 1) : "—"}
            unit={hasValue(h2sBefore) ? "ppm" : undefined}
            tone={hasValue(h2sBefore) ? "ink" : "muted"}
          />
          <MetricRow
            label="Metana"
            hint="relatif"
            value={fmtValue(ch4, 0)}
            unit="%"
          />
          <MetricRow
            label="Kebocoran metana"
            value={fmtValue(leak, 0)}
            unit="ppm"
            tone={leakWarning ? "danger" : "ink"}
          />
          <MetricRow
            label="Efektivitas purifikasi"
            value={effectiveness === null ? "—" : effectiveness}
            unit={effectiveness === null ? undefined : "%"}
            tone={effectiveness === null ? "muted" : "ink"}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between">
            <span className="text-[12px] text-ink-2">Kesehatan media</span>
            <Readout value={Math.round(filterHealth)} unit="%" size="sm" />
          </div>
          <ProgressBar
            value={filterHealth}
            tone={filterHealth < 40 ? "warn" : "good"}
          />
          {!hasValue(h2sBefore) ? (
            <p className="text-[10.5px] leading-4 text-muted">
              MQ-136 inlet belum terpasang — efektivitas tidak dihitung.
            </p>
          ) : null}
        </div>
      </div>
    </Panel>
  );
}

export function ValveControl({ className }: { className?: string }) {
  const {
    valveOpen,
    valveMode,
    setValveMode,
    openValve,
    closeValve,
    telemetry,
    leakWarning,
    pressureCalibrated,
    canCommand,
  } = useAppStore();

  const modes: { key: ValveMode; label: string; icon: LucideIcon }[] = [
    { key: "auto", label: "Otomatis", icon: Cpu },
    { key: "manual", label: "Manual", icon: Hand },
  ];

  return (
    <Panel className={cn("flex flex-col", className)}>
      <PanelHead
        label="Aktuator"
        title="Solenoid Valve 12V"
        right={
          <StatusPill tone={valveOpen ? "good" : "neutral"}>
            {valveOpen ? "Terbuka" : "Tertutup"}
          </StatusPill>
        }
      />

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div
          role="group"
          aria-label="Mode valve"
          className="flex gap-0.5 rounded-[4px] bg-info-100 p-0.5"
        >
          {modes.map((m) => {
            const active = valveMode === m.key;
            const locked = m.key === "auto" && !pressureCalibrated;
            return (
              <button
                key={m.key}
                type="button"
                onClick={() => setValveMode(m.key)}
                disabled={locked}
                aria-pressed={active}
                title={locked ? "Kalibrasi tekanan 2 titik dulu" : undefined}
                className={cn(
                  "inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-[3px] text-[12px] font-medium transition-colors",
                  active
                    ? "border border-line/50 bg-surface text-brand-deep"
                    : "text-ink-2 hover:text-ink",
                  locked && "cursor-not-allowed opacity-40",
                )}
              >
                <m.icon className="size-3.5" strokeWidth={1.75} />
                {m.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <span
            className={cn(
              "grid size-9 place-items-center rounded-[4px]",
              valveOpen
                ? "bg-brand text-white"
                : "border border-line/50 bg-surface text-ink-2",
            )}
          >
            {valveOpen ? (
              <Unlock className="size-4" strokeWidth={1.75} />
            ) : (
              <Lock className="size-4" strokeWidth={1.75} />
            )}
          </span>
          <div className="min-w-0">
            <p className="text-[13px] leading-4 font-semibold text-ink">
              {valveOpen ? "Gas mengalir" : "Gas tertahan di digester"}
            </p>
            <p className="mt-0.5 text-[11px] leading-4 text-muted">
              {valveOpen ? "Ke filter → penampung" : "Menunggu ambang tekanan"}
            </p>
          </div>
        </div>

        <div className="inset px-3">
          <MetricRow
            label="Aliran"
            value={fmtValue(telemetry.flow, 1)}
            unit="L/jam"
          />
          <MetricRow
            label="Δ tekanan"
            value={hasValue(telemetry.pressureDigester) && hasValue(telemetry.pressureCollector)
              ? `${(telemetry.pressureDigester - telemetry.pressureCollector).toFixed(2)}`
              : "—"}
            unit="kPa"
          />
        </div>

        {leakWarning ? (
          <p className="text-[11px] leading-4 font-medium text-danger">
            Kebocoran metana — valve dipaksa tertutup (fail-safe).
          </p>
        ) : !canCommand ? (
          <p className="text-[11px] leading-4 text-muted">
            Perintah belum tersambung ke alat (mode demo / backend offline).
          </p>
        ) : null}

        <div className="mt-auto grid grid-cols-2 gap-2">
          <Button
            size="sm"
            icon={Unlock}
            disabled={valveMode !== "manual" || valveOpen}
            onClick={openValve}
          >
            Buka
          </Button>
          <Button
            size="sm"
            variant="secondary"
            icon={Lock}
            disabled={valveMode !== "manual" || !valveOpen}
            onClick={closeValve}
          >
            Tutup
          </Button>
        </div>
      </div>
    </Panel>
  );
}

export function FilterPanel({ className }: { className?: string }) {
  const { filterHealth, telemetry, leakWarning, resetFilterMaintenance } =
    useAppStore();
  const remaining = Math.max(0, Math.round(filterHealth * 0.45));

  return (
    <Panel className={cn("flex flex-col", className)}>
      <PanelHead
        label="Perawatan"
        title="Media Filter"
        right={
          <StatusPill tone={filterHealth < 40 ? "warn" : "good"}>
            {filterHealth < 40 ? "Segera ganti" : "Aktif"}
          </StatusPill>
        }
      />

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-baseline justify-between">
          <Readout value={remaining} unit="hari" size="lg" />
          <Readout
            value={Math.round(filterHealth)}
            unit="% sisa"
            size="sm"
            tone="muted"
          />
        </div>
        <ProgressBar
          value={filterHealth}
          tone={filterHealth < 40 ? "warn" : "good"}
        />
        <p className="text-[11px] leading-4 text-muted">
          Estimasi dari laju penyerapan H₂S saat ini.
        </p>

        <div className="inset mt-1 px-3">
          <MetricRow
            label="H₂S sesudah filter"
            value={fmtValue(telemetry.h2sAfter, 1)}
            unit="ppm"
          />
          <MetricRow
            label="Sensor kebocoran"
            value={leakWarning ? "Peringatan" : "Normal"}
            tone={leakWarning ? "danger" : "ink"}
          />
        </div>

        <Button
          size="sm"
          variant="secondary"
          icon={Filter}
          onClick={resetFilterMaintenance}
          className="mt-auto w-full"
        >
          Tandai filter diganti
        </Button>
      </div>
    </Panel>
  );
}
