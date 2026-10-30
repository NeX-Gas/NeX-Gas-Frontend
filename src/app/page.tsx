"use client";

import { useState } from "react";
import {
  Check,
  ClipboardPlus,
  Droplet,
  Droplets,
  Flame,
  Gauge,
  ShieldCheck,
  Thermometer,
  Wind,
} from "lucide-react";
import { Button } from "@/components/button";
import { LogInputModal } from "@/components/log-modal";
import {
  FilterMaintenanceCard,
  GasMonitor,
  PressureMonitor,
  ValveControl,
} from "@/components/monitoring";
import { RadialGauge } from "@/components/radial-gauge";
import {
  Card,
  IconTile,
  ProgressBar,
  SectionLabel,
  StatusPill,
} from "@/components/ui";
import { useAppStore } from "@/components/app-store";
import { digester } from "@/lib/mock";
import { fmtValue } from "@/lib/format";
import { BURN_RATE_LPH, h2sTone, THRESHOLDS } from "@/lib/system";
import { cn } from "@/lib/cn";

function TopStatus({ className }: { className?: string }) {
  const { link, deviceOnline, lastSeen } = useAppStore();
  const isLive = link === "live" && deviceOnline;
  const badge =
    link === "demo"
      ? { text: "Mode demo", tone: "bg-info-200 text-ink" }
      : isLive
        ? { text: "Online", tone: "bg-info-200 text-ink" }
        : link === "connecting"
          ? { text: "Menghubungkan…", tone: "bg-info-200 text-ink" }
          : { text: "Offline", tone: "bg-danger-200 text-danger-800" };

  return (
    <Card className={cn("flex items-center gap-4 p-4", className)}>
      <IconTile icon={Flame} size="md" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "size-2.5 rounded-full",
              isLive ? "bg-brand-400" : "bg-muted",
            )}
          />
          <h2 className="truncate text-lg font-semibold text-ink">
            {digester.name}
          </h2>
        </div>
        <p className="truncate text-sm text-ink-2">
          {lastSeen
            ? `Data terakhir ${new Date(lastSeen).toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
              })}`
            : "Menunggu data alat"}
        </p>
      </div>
      <span
        className={cn(
          "shrink-0 rounded-full px-3 py-1 text-[13px] font-semibold",
          badge.tone,
        )}
      >
        {badge.text}
      </span>
    </Card>
  );
}

function Telemetry({ className }: { className?: string }) {
  const { telemetry } = useAppStore();
  // Persentase dari tekanan penampung terhadap ambang penuh (2.0 kPa).
  const percent = Math.round(
    Math.min(100, (Math.max(0, telemetry.pressureCollector) / THRESHOLDS.collectorFullAt) * 100),
  );
  const ready = telemetry.pressureDigester >= THRESHOLDS.valveOpenAt;
  const tone = h2sTone(telemetry.h2sAfter);
  const h2sLabel =
    tone === "good"
      ? "Status H2S: AMAN"
      : tone === "warn"
        ? "Status H2S: WASPADA"
        : "Status H2S: BAHAYA";
  return (
    <Card className={cn("flex flex-col items-center gap-5 p-5", className)}>
      <RadialGauge value={percent}>
        <div className="flex flex-col items-center">
          <Gauge className="mb-1 size-5 text-brand" />
          <div className="flex items-start justify-center">
            <span className="text-[44px] leading-[52px] font-bold tracking-[-0.02em] text-ink">
              {percent}
            </span>
            <span className="mt-1 text-lg font-bold text-ink-2">%</span>
          </div>
          <span className="text-[15px] font-bold text-brand">
            {ready ? "Siap Pakai" : "Menunggu"}
          </span>
          <span className="mt-1 text-xs text-ink-2">
            {ready ? "Tekanan Gas Cukup" : "Tekanan Belum Cukup"}
          </span>
        </div>
      </RadialGauge>

      <div className="w-full rounded-lg bg-info-50 p-3">
        <div className="flex items-center justify-between gap-3">
          <SectionLabel>Gas Terkumpul (sejak alat hidup)</SectionLabel>
          <span className="text-[13px] font-semibold text-ink">
            {fmtValue(telemetry.gasSinceStartL, 1)} L
          </span>
        </div>
        <ProgressBar value={percent} className="mt-2 h-2.5" />
      </div>

      <div
        className={cn(
          "inline-flex items-center gap-2 rounded-full px-4 py-2",
          tone === "good" ? "bg-info-100" : "bg-danger-200",
        )}
      >
        <span
          className={cn(
            "grid size-5 place-items-center rounded-full text-white",
            tone === "good" ? "bg-brand" : "bg-danger",
          )}
        >
          {tone === "good" ? (
            <Check className="size-3" strokeWidth={3} />
          ) : (
            <Wind className="size-3" strokeWidth={3} />
          )}
        </span>
        <span className="text-[15px] font-semibold text-ink">
          {h2sLabel} ({fmtValue(telemetry.h2sAfter, 1)} ppm)
        </span>
      </div>
    </Card>
  );
}

function SensorCard({
  label,
  icon,
  value,
  unit,
  status,
  hint,
  tone = "good",
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  unit: string;
  status: string;
  hint: string;
  tone?: "good" | "warn" | "neutral" | "danger";
}) {
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13px] font-semibold text-ink-2">{label}</span>
        <span className="text-muted">{icon}</span>
      </div>
      <div className="flex items-start">
        <span className="text-[28px] leading-9 font-bold tracking-[-0.02em] text-ink">
          {value}
        </span>
        <span className="mt-1.5 ml-1 text-base font-semibold text-ink-2">
          {unit}
        </span>
      </div>
      <StatusPill tone={tone} className="w-fit">
        {status}
      </StatusPill>
      <p className="text-[11px] text-ink-2">{hint}</p>
    </Card>
  );
}

function Sensors({ className }: { className?: string }) {
  const { telemetry, phCalibrated } = useAppStore();
  const tempOptimal =
    telemetry.temperature >= THRESHOLDS.tempMin &&
    telemetry.temperature <= THRESHOLDS.tempMax;
  const humidityOk = telemetry.humidity <= THRESHOLDS.humidityMax;
  const gasLineOk = telemetry.gasLineHumidity <= THRESHOLDS.humidityMax;
  const phValue = fmtValue(telemetry.ph, 1);
  const ph = telemetry.ph;
  const phStatus =
    phValue === "—"
      ? "Sensor belum ada"
      : ph < 6.5
        ? "Terlalu asam"
        : ph > 7.5
          ? "Terlalu basa"
          : phCalibrated
            ? "Stabil"
            : "Belum dikalibrasi";
  const phTone =
    phValue === "—" || !phCalibrated
      ? "warn"
      : ph < 6.5 || ph > 7.5
        ? "warn"
        : "good";

  return (
    <div className={cn("grid grid-cols-2 gap-4 lg:gap-6", className)}>
      <SensorCard
        label="Suhu Digester"
        icon={<Thermometer className="size-4" />}
        value={fmtValue(telemetry.temperature, 1)}
        unit="°C"
        status={tempOptimal ? "Optimal" : "Di luar rentang"}
        hint="Mesofilik ideal 28° - 38°C"
        tone={tempOptimal ? "good" : "warn"}
      />
      <SensorCard
        label="Kelembapan Digester"
        icon={<Droplets className="size-4" />}
        value={fmtValue(telemetry.humidity, 0)}
        unit="%"
        status={humidityOk ? "Kering" : "Lembap"}
        hint="DHT22 #1 headspace"
        tone={humidityOk ? "good" : "warn"}
      />
      <SensorCard
        label="Suhu Jalur Gas"
        icon={<Thermometer className="size-4" />}
        value={fmtValue(telemetry.gasLineTemperature, 1)}
        unit="°C"
        status={gasLineOk ? "Normal" : "Periksa silika"}
        hint="DHT22 #2 setelah silika gel"
        tone="good"
      />
      <SensorCard
        label="Kelembapan Jalur Gas"
        icon={<Droplets className="size-4" />}
        value={fmtValue(telemetry.gasLineHumidity, 0)}
        unit="%"
        status={gasLineOk ? "Kering" : "Lembap"}
        hint={`Ambang < ${THRESHOLDS.humidityMax}%`}
        tone={gasLineOk ? "good" : "warn"}
      />
      <SensorCard
        label="Tingkat pH"
        icon={<Droplet className="size-4" />}
        value={phValue}
        unit="pH"
        status={phStatus}
        hint={
          phCalibrated
            ? "Rentang ideal 6.5 - 7.5"
            : "Kalibrasi 2 titik di Pengaturan"
        }
        tone={phTone}
      />
    </div>
  );
}

function BurnCard() {
  const { notify, telemetry } = useAppStore();
  const litres = Math.max(0, telemetry.gasSinceStartL);
  const hours = litres / BURN_RATE_LPH;
  const estimate = `${hours.toFixed(1)} jam api nyala`;
  return (
    <Card className="flex items-center gap-3 bg-info-200 p-4">
      <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-surface text-brand">
        <Wind className="size-6" />
      </span>
      <div className="min-w-0 flex-1">
        <SectionLabel>Estimasi Penggunaan</SectionLabel>
        <p className="mt-0.5 text-lg font-semibold text-ink">{estimate}</p>
        <p className="text-xs text-ink-2">
          Dari {litres.toFixed(1)} L gas sejak alat hidup · asumsi{" "}
          {BURN_RATE_LPH} L/jam
        </p>
      </div>
      <button
        type="button"
        onClick={() => notify("Pemeriksaan katup gas dimulai")}
        aria-label="Cek katup"
        className="grid size-12 shrink-0 place-items-center rounded-xl bg-surface text-ink card-shadow hover:bg-info-50"
      >
        <Gauge className="size-[18px]" />
      </button>
    </Card>
  );
}

function CtaPanel({
  onLog,
  className,
}: {
  onLog: () => void;
  className?: string;
}) {
  const { notify } = useAppStore();
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4",
        className,
      )}
    >
      <Button icon={ClipboardPlus} onClick={onLog}>
        Catat Pengisian Kotoran
      </Button>
      <Button
        variant="secondary"
        icon={ShieldCheck}
        onClick={() => notify("Panduan pemeriksaan katup solenoid dibuka")}
      >
        Pemeriksaan Katup Solenoid
      </Button>
    </div>
  );
}

export default function DashboardPage() {
  const { addLog } = useAppStore();
  const [open, setOpen] = useState(false);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-6">
      <TopStatus className="lg:col-span-12" />
      <Telemetry className="lg:col-span-7" />
      <div className="flex flex-col gap-4 lg:col-span-5 lg:gap-6">
        <Sensors />
        <BurnCard />
      </div>

      <GasMonitor className="lg:col-span-7" />
      <ValveControl className="lg:col-span-5" />

      <PressureMonitor className="lg:col-span-7" />
      <FilterMaintenanceCard className="lg:col-span-5" />

      <CtaPanel className="lg:col-span-12" onLog={() => setOpen(true)} />

      {open ? (
        <LogInputModal
          onClose={() => setOpen(false)}
          onSave={(kg) => addLog(kg, `${(kg * 0.072).toFixed(1)} m³`)}
        />
      ) : null}
    </div>
  );
}
