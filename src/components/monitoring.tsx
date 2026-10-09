"use client";

import {
  Activity,
  Cpu,
  Droplets,
  Filter,
  Flame,
  Gauge,
  Hand,
  Lock,
  Siren,
  Unlock,
  Wind,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/button";
import {
  Card,
  IconTile,
  ProgressBar,
  SectionLabel,
  StatusPill,
} from "@/components/ui";
import { useAppStore } from "@/components/app-store";
import { h2sTone, THRESHOLDS } from "@/lib/system";
import type { Tone, ValveMode } from "@/lib/types";
import { cn } from "@/lib/cn";

function StatTile({
  label,
  value,
  unit,
  icon: Icon,
  tone = "neutral",
  status,
  hint,
}: {
  label: string;
  value: string;
  unit: string;
  icon: LucideIcon;
  tone?: Tone;
  status: string;
  hint: string;
}) {
  const dot: Record<Tone, string> = {
    good: "bg-brand-400",
    neutral: "bg-muted",
    warn: "bg-danger",
    danger: "bg-danger-800",
  };
  return (
    <div className="flex flex-col gap-1.5 rounded-lg bg-info-50 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold tracking-[0.04em] text-muted uppercase">
          {label}
        </span>
        <Icon className="size-4 shrink-0 text-muted" />
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-[26px] leading-8 font-bold tracking-[-0.02em] text-ink">
          {value}
        </span>
        <span className="text-xs font-semibold text-ink-2">{unit}</span>
      </div>
      <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-ink-2">
        <span className={cn("size-2 rounded-full", dot[tone])} />
        {status}
      </span>
      <p className="text-[11px] text-muted">{hint}</p>
    </div>
  );
}

export function GasMonitor({ className }: { className?: string }) {
  const { telemetry, filterWarning, leakWarning, filterHealth } = useAppStore();
  const { h2sBefore, h2sAfter, ch4, leak } = telemetry;

  const effectiveness = Math.max(
    0,
    Math.min(100, Math.round((1 - h2sAfter / h2sBefore) * 100)),
  );
  const afterTone = h2sTone(h2sAfter);
  const overall: Tone = leakWarning
    ? "danger"
    : filterWarning
      ? "warn"
      : "good";
  const overallText = leakWarning
    ? "Bahaya"
    : filterWarning
      ? "Perlu Perhatian"
      : "Aman";

  return (
    <Card className={cn("flex flex-col gap-4 p-4", className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <SectionLabel>Monitoring Gas</SectionLabel>
          <h3 className="mt-1 text-lg font-semibold text-ink">
            Kualitas Biogas
          </h3>
        </div>
        <StatusPill tone={overall}>{overallText}</StatusPill>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatTile
          label="H₂S Sebelum Filter"
          value={h2sBefore.toFixed(1)}
          unit="ppm"
          icon={Wind}
          tone="neutral"
          status="Dari digester"
          hint="Sensor MQ-136 inlet"
        />
        <StatTile
          label="H₂S Sesudah Filter"
          value={h2sAfter.toFixed(1)}
          unit="ppm"
          icon={Filter}
          tone={afterTone}
          status={
            afterTone === "good"
              ? "Di bawah ambang"
              : afterTone === "warn"
                ? "Mendekati ambang"
                : "Tembus filter!"
          }
          hint={`Ambang aman < ${THRESHOLDS.h2sWarn} ppm`}
        />
        <StatTile
          label="Metana (CH₄)"
          value={ch4.toFixed(0)}
          unit="%"
          icon={Flame}
          tone="good"
          status="Kandungan baik"
          hint="Relatif • sensor MQ-4"
        />
        <StatTile
          label="Kebocoran Metana"
          value={leak.toFixed(0)}
          unit="ppm"
          icon={Siren}
          tone={leakWarning ? "danger" : "good"}
          status={leakWarning ? "Bocor terdeteksi" : "Normal"}
          hint="MQ-4 udara sekitar"
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-[13px] font-semibold text-ink-2">
          <span>Efektivitas Purifikasi H₂S</span>
          <span className="text-ink">{effectiveness}%</span>
        </div>
        <ProgressBar
          value={effectiveness}
          tone={effectiveness < 70 ? "warn" : "good"}
          className="h-2.5"
        />
        <div className="mt-1 flex items-center justify-between text-[13px] font-semibold text-ink-2">
          <span>Kesehatan Media Filter</span>
          <span className="text-ink">{Math.round(filterHealth)}%</span>
        </div>
        <ProgressBar
          value={filterHealth}
          tone={filterHealth < 40 ? "warn" : "good"}
          className="h-2.5"
        />
      </div>
    </Card>
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
  } = useAppStore();
  const delta = telemetry.pressureDigester - telemetry.pressureCollector;
  const modes: { key: ValveMode; label: string; icon: LucideIcon }[] = [
    { key: "auto", label: "Otomatis", icon: Cpu },
    { key: "manual", label: "Manual", icon: Hand },
  ];

  return (
    <Card className={cn("flex flex-col gap-4 p-4", className)}>
      <div>
        <SectionLabel>Kontrol Aktuator</SectionLabel>
        <h3 className="mt-1 text-lg font-semibold text-ink">
          Solenoid Valve 12V
        </h3>
      </div>

      <div className="flex gap-1 rounded-xl bg-info-50 p-1">
        {modes.map((m) => {
          const active = valveMode === m.key;
          return (
            <button
              key={m.key}
              type="button"
              onClick={() => setValveMode(m.key)}
              className={cn(
                "inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg text-[13px] font-semibold transition-colors",
                active
                  ? "bg-surface text-brand card-shadow"
                  : "text-ink-2 hover:bg-info-100",
              )}
            >
              <m.icon className="size-4" />
              {m.label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col items-center gap-2 py-1">
        <span
          className={cn(
            "grid size-16 place-items-center rounded-full transition-colors",
            valveOpen ? "bg-brand text-white" : "bg-info-200 text-ink-2",
          )}
        >
          {valveOpen ? (
            <Unlock className="size-8" />
          ) : (
            <Lock className="size-8" />
          )}
        </span>
        <p
          className={cn(
            "text-lg font-bold",
            valveOpen ? "text-brand" : "text-ink",
          )}
        >
          {valveOpen ? "TERBUKA" : "TERTUTUP"}
        </p>
        <p className="text-center text-sm text-ink-2">
          {valveOpen
            ? "Gas mengalir lewat filter ke penampung"
            : "Gas terkumpul di digester"}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button
          icon={Unlock}
          disabled={valveMode !== "manual" || valveOpen}
          onClick={openValve}
        >
          Buka Valve
        </Button>
        <Button
          variant="secondary"
          icon={Lock}
          disabled={valveMode !== "manual" || !valveOpen}
          onClick={closeValve}
        >
          Tutup Valve
        </Button>
      </div>

      <div className="flex flex-col gap-1 rounded-lg bg-info-50 p-3 text-[12px] text-ink-2">
        <div className="flex items-center justify-between">
          <span>Aliran gas</span>
          <span className="font-semibold text-ink">
            {telemetry.flow.toFixed(1)} L/h
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>Δ tekanan (digester − penampung)</span>
          <span className="font-semibold text-ink">
            {delta >= 0 ? "+" : ""}
            {delta.toFixed(2)} kPa
          </span>
        </div>
        {leakWarning ? (
          <p className="mt-1 font-semibold text-danger">
            Kebocoran metana — valve dipaksa tertutup (fail-safe).
          </p>
        ) : (
          <p className="mt-1 text-muted">
            Buka ≥ {THRESHOLDS.valveOpenAt.toFixed(1)} kPa · Tutup ≤{" "}
            {THRESHOLDS.valveCloseAt.toFixed(1)} kPa · Fail-safe N/C
          </p>
        )}
      </div>
    </Card>
  );
}

export function PressureMonitor({ className }: { className?: string }) {
  const { telemetry, valveOpen, leakWarning, filterWarning } = useAppStore();
  const { pressureDigester, pressureCollector } = telemetry;

  const digesterPct = Math.min(100, (pressureDigester / 2) * 100);
  const collectorPct = Math.min(100, (pressureCollector / 2) * 100);
  const collectorFull = pressureCollector >= THRESHOLDS.collectorFullAt;

  const status = leakWarning
    ? "Kebocoran terdeteksi — aliran dihentikan"
    : collectorFull
      ? "Penampung penuh — valve tertutup"
      : valveOpen
        ? "Gas mengalir ke kantung penampung"
        : pressureDigester >= THRESHOLDS.valveOpenAt
          ? "Tekanan siap — menunggu pembukaan valve"
          : "Menunggu akumulasi tekanan gas";

  return (
    <Card className={cn("flex flex-col gap-4 p-4", className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <SectionLabel>Tekanan Sistem</SectionLabel>
          <h3 className="mt-1 text-lg font-semibold text-ink">
            Digester vs Penampung
          </h3>
        </div>
        {filterWarning ? (
          <StatusPill tone="warn">Filter jenuh</StatusPill>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-[13px] font-semibold text-ink-2">
          <span className="flex items-center gap-1.5">
            <Gauge className="size-4 text-brand" />
            Tekanan Digester
          </span>
          <span className="text-ink">{pressureDigester.toFixed(2)} kPa</span>
        </div>
        <ProgressBar
          value={digesterPct}
          tone="good"
          thresholds={[
            { at: 15, tone: "normal" },
            { at: 50, tone: "warn" },
          ]}
          className="h-3"
        />
        <p className="text-[11px] text-muted">
          Ambang buka {THRESHOLDS.valveOpenAt.toFixed(1)} kPa · histeresis tutup{" "}
          {THRESHOLDS.valveCloseAt.toFixed(1)} kPa
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-[13px] font-semibold text-ink-2">
          <span className="flex items-center gap-1.5">
            <Activity className="size-4 text-brand" />
            Tekanan Penampung
          </span>
          <span className="text-ink">{pressureCollector.toFixed(2)} kPa</span>
        </div>
        <ProgressBar
          value={collectorPct}
          tone={collectorFull ? "warn" : "good"}
          thresholds={[{ at: 100, tone: "warn" }]}
          className="h-3"
        />
        <p className="text-[11px] text-muted">
          Batas penampung penuh {THRESHOLDS.collectorFullAt.toFixed(1)} kPa
        </p>
      </div>

      <div className="flex items-center gap-2 rounded-lg bg-info-50 p-3">
        <Droplets className="size-4 shrink-0 text-brand" />
        <p className="text-[13px] font-semibold text-ink">{status}</p>
      </div>
    </Card>
  );
}

export function FilterMaintenanceCard({ className }: { className?: string }) {
  const { filterHealth, telemetry, leakWarning, resetFilterMaintenance } =
    useAppStore();
  const remaining = Math.max(0, Math.round(filterHealth * 0.45));

  return (
    <Card className={cn("flex flex-col gap-4 p-4", className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <SectionLabel>Perawatan Filter</SectionLabel>
          <h3 className="mt-1 text-lg font-semibold text-ink">
            Kesehatan Media
          </h3>
        </div>
        <IconTile
          icon={Filter}
          tone={filterHealth < 40 ? "danger" : "info"}
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-[13px] font-semibold text-ink-2">
          <span>Sisa umur efektif</span>
          <span className="text-ink">{remaining} hari</span>
        </div>
        <ProgressBar
          value={filterHealth}
          tone={filterHealth < 40 ? "warn" : "good"}
          className="h-3"
        />
      </div>

      <div className="flex flex-col gap-1 rounded-lg bg-info-50 p-3 text-[12px] text-ink-2">
        <div className="flex items-center justify-between">
          <span>H₂S sesudah filter</span>
          <span className="font-semibold text-ink">
            {telemetry.h2sAfter.toFixed(1)} ppm
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>Status sensor</span>
          <span className="font-semibold text-ink">
            {leakWarning ? "Peringatan bocor" : "Normal"}
          </span>
        </div>
      </div>

      <Button
        variant="soft"
        icon={Filter}
        onClick={resetFilterMaintenance}
        className="w-full"
      >
        Tandai Filter Sudah Diganti
      </Button>
    </Card>
  );
}
