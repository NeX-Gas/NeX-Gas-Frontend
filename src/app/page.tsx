"use client";

import { useState } from "react";
import { ClipboardPlus, History } from "lucide-react";
import { Button, ButtonLink } from "@/components/button";
import { LogInputModal } from "@/components/log-modal";
import {
  FilterPanel,
  GasQuality,
  PressureInstrument,
  ValveControl,
} from "@/components/monitoring";
import {
  MetricRow,
  Panel,
  Readout,
  RuleLabel,
  ScreenTitle,
  SectionLabel,
  StatusBadge,
  StatusPill,
} from "@/components/ui";
import { useAppStore } from "@/components/app-store";
import { digester } from "@/lib/mock";
import { fmtValue } from "@/lib/format";
import { BURN_RATE_LPH, THRESHOLDS } from "@/lib/system";
import { cn } from "@/lib/cn";

/* ------------------------------------------------------------------ *
 * Header unit
 * ------------------------------------------------------------------ */

function UnitHeader() {
  const { link, deviceOnline, lastSeen } = useAppStore();
  const live = link === "live" && deviceOnline;

  const badge =
    link === "demo"
      ? { text: "Mode demo", tone: "info" as const }
      : live
        ? { text: "Live", tone: "good" as const }
        : link === "connecting"
          ? { text: "Menyambung", tone: "warn" as const }
          : { text: "Offline", tone: "danger" as const };

  return (
    <ScreenTitle
      title={digester.name}
      subtitle="Kandang Sapi Barat · Unit #01"
      actions={
        <>
          <span className="font-mono text-[11px] text-muted">
            {lastSeen
              ? `data ${new Date(lastSeen).toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}`
              : "menunggu data"}
          </span>
          <StatusBadge tone={badge.tone}>{badge.text}</StatusBadge>
        </>
      }
      className="lg:items-center"
    />
  );
}

/* ------------------------------------------------------------------ *
 * Deretan sensor
 * ------------------------------------------------------------------ */

function SensorCell({
  label,
  value,
  unit,
  status,
  tone,
  hint,
}: {
  label: string;
  value: string;
  unit: string;
  status: string;
  tone: "good" | "warn" | "neutral" | "danger";
  hint: string;
}) {
  return (
    <div className="bg-surface px-4 py-3">
      <SectionLabel className="truncate">{label}</SectionLabel>
      <div className="mt-1.5">
        <Readout value={value} unit={unit} size="lg" />
      </div>
      <div className="mt-1.5 flex items-center gap-1.5">
        <StatusPill tone={tone}>{status}</StatusPill>
      </div>
      <p className="mt-1 text-[10.5px] leading-3.5 text-muted">{hint}</p>
    </div>
  );
}

function SensorStrip({ className }: { className?: string }) {
  const { telemetry, phCalibrated } = useAppStore();
  const tempOptimal =
    telemetry.temperature >= THRESHOLDS.tempMin &&
    telemetry.temperature <= THRESHOLDS.tempMax;
  const humidityOk = telemetry.humidity <= THRESHOLDS.humidityMax;
  const lineOk = telemetry.gasLineHumidity <= THRESHOLDS.humidityMax;
  const ph = telemetry.ph;
  const phAvailable = ph >= 0;
  const phInRange = ph >= 6.5 && ph <= 7.5;

  const cells = [
    {
      label: "Suhu Digester",
      value: fmtValue(telemetry.temperature, 1),
      unit: "°C",
      status: tempOptimal ? "Optimal" : "Di luar rentang",
      tone: tempOptimal ? ("good" as const) : ("warn" as const),
      hint: `Mesofilik ${THRESHOLDS.tempMin}–${THRESHOLDS.tempMax} °C`,
    },
    {
      label: "RH Digester",
      value: fmtValue(telemetry.humidity, 0),
      unit: "%",
      status: humidityOk ? "Kering" : "Lembap",
      tone: humidityOk ? ("good" as const) : ("warn" as const),
      hint: "DHT22 #1 · headspace",
    },
    {
      label: "Suhu Jalur Gas",
      value: fmtValue(telemetry.gasLineTemperature, 1),
      unit: "°C",
      // Firmware tidak menetapkan ambang suhu jalur gas — jangan karang status.
      status: "Terbaca",
      tone: "neutral" as const,
      hint: "DHT22 #2 · tanpa ambang",
    },
    {
      label: "RH Jalur Gas",
      value: fmtValue(telemetry.gasLineHumidity, 0),
      unit: "%",
      status: lineOk ? "Kering" : "Lembap",
      tone: lineOk ? ("good" as const) : ("warn" as const),
      hint: `Ambang < ${THRESHOLDS.humidityMax}%`,
    },
    {
      label: "pH Digester",
      value: fmtValue(ph, 1),
      unit: "pH",
      status: !phAvailable
        ? "Tidak ada sensor"
        : !phInRange
          ? "Di luar rentang"
          : phCalibrated
            ? "Stabil"
            : "Belum dikalibrasi",
      tone:
        phAvailable && phInRange && phCalibrated
          ? ("good" as const)
          : ("warn" as const),
      hint: phCalibrated ? "Ideal 6.5–7.5" : "Kalibrasi 2 titik",
    },
  ];

  return (
    <Panel className={cn("overflow-hidden", className)}>
      <div className="border-b border-line/35 px-4 py-2.5">
        <RuleLabel right={<span className="font-mono text-[10.5px] text-muted">5 kanal</span>}>
          Sensor Lapangan
        </RuleLabel>
      </div>
      <div className="grid grid-cols-2 gap-px bg-line/30 lg:grid-cols-5">
        {cells.map((cell) => (
          <div
            key={cell.label}
            className="bg-surface last:col-span-2 lg:last:col-span-1"
          >
            <SensorCell {...cell} />
          </div>
        ))}
      </div>
    </Panel>
  );
}

/* ------------------------------------------------------------------ *
 * Estimasi pemanfaatan
 * ------------------------------------------------------------------ */

function UtilizationPanel({ className }: { className?: string }) {
  const { telemetry } = useAppStore();
  const litres = Math.max(0, telemetry.gasSinceStartL);
  const hours = litres / BURN_RATE_LPH;
  const duration =
    hours < 1
      ? `${Math.max(0, Math.round(hours * 60))} menit`
      : `${hours.toFixed(1)} jam`;

  return (
    <Panel className={cn("flex flex-col", className)}>
      <div className="border-b border-line/35 px-4 py-3">
        <SectionLabel>Pemanfaatan</SectionLabel>
        <h3 className="mt-0.5 text-[15px] leading-5 font-semibold tracking-[-0.01em] text-ink">
          Estimasi Api Menyala
        </h3>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-baseline gap-2">
          <Readout value={duration.split(" ")[0]} size="xl" />
          <span className="text-[12px] font-medium text-muted">
            {duration.split(" ")[1] ?? ""}
          </span>
        </div>

        <div className="inset px-3">
          <MetricRow label="Gas terkumpul" value={fmtValue(litres, 1)} unit="L" />
          <MetricRow
            label="Laju asumsi"
            hint="kompor biogas"
            value={BURN_RATE_LPH}
            unit="L/jam"
            tone="muted"
          />
        </div>

        <p className="mt-auto text-[10.5px] leading-4 text-muted">
          Dihitung dari volume sejak alat hidup. Laju {BURN_RATE_LPH} L/jam
          adalah asumsi, bukan pembacaan sensor.
        </p>
      </div>
    </Panel>
  );
}

/* ------------------------------------------------------------------ *
 * Halaman
 * ------------------------------------------------------------------ */

export default function DashboardPage() {
  const { addLog, notify } = useAppStore();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-4 lg:gap-5">
      <UnitHeader />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-5">
        <PressureInstrument className="lg:col-span-8" />
        <GasQuality className="lg:col-span-4" />

        <SensorStrip className="lg:col-span-12" />

        <ValveControl className="lg:col-span-4" />
        <FilterPanel className="lg:col-span-4" />
        <UtilizationPanel className="lg:col-span-4" />

        <div className="flex flex-col gap-2 lg:col-span-12 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button icon={ClipboardPlus} onClick={() => setOpen(true)}>
              Catat Pengisian Kotoran
            </Button>
            <ButtonLink variant="secondary" icon={History} href="/riwayat">
              Lihat Riwayat Produksi
            </ButtonLink>
          </div>
          <button
            type="button"
            onClick={() =>
              notify("Panduan pemeriksaan katup solenoid dibuka")
            }
            className="text-left text-[11.5px] text-muted underline decoration-line underline-offset-4 transition-colors hover:text-ink-2 lg:text-right"
          >
            Panduan pemeriksaan katup
          </button>
        </div>
      </div>

      {open ? (
        <LogInputModal
          onClose={() => setOpen(false)}
          onSave={(kg) => addLog(kg, `${(kg * 0.072).toFixed(1)} m³`)}
        />
      ) : null}
    </div>
  );
}
