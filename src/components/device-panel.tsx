"use client";

import { useState } from "react";
import {
  Activity,
  Cpu,
  FlaskConical,
  Gauge,
  Radio,
  RotateCcw,
  ShieldQuestion,
  Wifi,
} from "lucide-react";
import { Button } from "@/components/button";
import { Card, SectionLabel, StatusPill } from "@/components/ui";
import { useAppStore } from "@/components/app-store";
import { relativeTime } from "@/lib/format";
import { cn } from "@/lib/cn";

const linkLabel = {
  live: "Live (alat)",
  demo: "Mode demo",
  connecting: "Menghubungkan…",
  offline: "Backend offline",
} as const;

function Row({
  label,
  value,
  tone,
}: {
  label: string;
  value: React.ReactNode;
  tone?: "good" | "warn" | "neutral";
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[12px] text-ink-2">{label}</span>
      <span
        className={cn(
          "text-[12px] font-semibold",
          tone === "warn"
            ? "text-danger"
            : tone === "good"
              ? "text-brand"
              : "text-ink",
        )}
      >
        {value}
      </span>
    </div>
  );
}

export function DeviceStatusCard({ className }: { className?: string }) {
  const {
    link,
    deviceOnline,
    deviceId,
    firmware,
    rssi,
    buffered,
    lastSeen,
    sensorsReady,
    pressureCalibrated,
    phCalibrated,
  } = useAppStore();

  const linkTone =
    link === "live" && deviceOnline
      ? "good"
      : link === "demo"
        ? "neutral"
        : "warn";

  return (
    <Card className={cn("flex flex-col gap-4 p-4", className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <SectionLabel>Status Alat</SectionLabel>
          <h3 className="mt-1 text-lg font-semibold text-ink">{deviceId}</h3>
        </div>
        <StatusPill tone={linkTone}>{linkLabel[link]}</StatusPill>
      </div>

      <div className="flex flex-col gap-1.5 rounded-lg bg-info-50 p-3">
        <Row
          label="Sinyal WiFi"
          value={rssi === 0 ? "tidak tersedia" : `${rssi} dBm`}
          tone={rssi === 0 ? "warn" : rssi > -70 ? "good" : "warn"}
        />
        <Row
          label="Sensor siap"
          value={sensorsReady ? "ya" : "pemanasan / gagal baca"}
          tone={sensorsReady ? "good" : "warn"}
        />
        <Row
          label="Kalibrasi tekanan"
          value={pressureCalibrated ? "terkalibrasi" : "belum"}
          tone={pressureCalibrated ? "good" : "warn"}
        />
        <Row
          label="Kalibrasi pH"
          value={phCalibrated ? "terkalibrasi" : "belum"}
          tone={phCalibrated ? "good" : "warn"}
        />
        <Row
          label="Buffer offline"
          value={buffered > 0 ? `${buffered} sampel` : "kosong"}
          tone={buffered > 0 ? "warn" : "good"}
        />
        <Row label="Firmware" value={firmware} />
        <Row label="Data terakhir" value={relativeTime(lastSeen)} />
      </div>
    </Card>
  );
}

const pressureSensors = [
  { key: "digester", label: "Digester" },
  { key: "collector", label: "Penampung" },
] as const;

const mqGases = [
  { key: "h2s", label: "MQ-136 (H₂S)" },
  { key: "ch4", label: "MQ-4 (CH₄)" },
  { key: "leak", label: "MQ-4 udara" },
] as const;

export function CalibrationPanel({ className }: { className?: string }) {
  const {
    canCommand,
    pressureCalibrated,
    phCalibrated,
    tare,
    calibratePressure,
    calibratePh,
    calibrateMq,
  } = useAppStore();

  const [sensor, setSensor] =
    useState<(typeof pressureSensors)[number]["key"]>("digester");
  const [kpa, setKpa] = useState("1.0");
  const [gas, setGas] = useState<(typeof mqGases)[number]["key"]>("h2s");
  const [refPpm, setRefPpm] = useState("0");

  const inputClass =
    "h-10 w-full rounded-lg border border-info-300 bg-info-50 px-3 text-[13px] font-semibold text-ink focus:border-brand focus:outline-none disabled:opacity-50";

  return (
    <Card className={cn("flex flex-col gap-4 p-4", className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <SectionLabel>Kalibrasi</SectionLabel>
          <h3 className="mt-1 text-lg font-semibold text-ink">
            Sensor &amp; Aktuator
          </h3>
        </div>
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-info-100 text-brand">
          <FlaskConical className="size-5" />
        </span>
      </div>

      {!canCommand ? (
        <p className="flex items-start gap-2 rounded-lg bg-danger-200 p-3 text-[12px] font-medium text-danger-800">
          <ShieldQuestion className="mt-0.5 size-4 shrink-0" />
          Perintah belum bisa dikirim: dashboard masih mode demo atau backend
          belum tersambung. Nilai di bawah tidak akan sampai ke alat.
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <StatusPill tone={pressureCalibrated ? "good" : "warn"}>
          <Gauge className="size-3.5" /> Tekanan{" "}
          {pressureCalibrated ? "siap" : "belum"}
        </StatusPill>
        <StatusPill tone={phCalibrated ? "good" : "warn"}>
          <FlaskConical className="size-3.5" /> pH{" "}
          {phCalibrated ? "siap" : "belum"}
        </StatusPill>
        <Button
          variant="soft"
          size="sm"
          icon={RotateCcw}
          disabled={!canCommand}
          onClick={() => tare()}
        >
          Tare tekanan
        </Button>
      </div>

      <div className="flex flex-col gap-2 rounded-lg bg-info-50 p-3">
        <p className="text-[12px] font-semibold text-ink">
          Kalibrasi tekanan (2 titik)
        </p>
        <div className="grid grid-cols-2 gap-2">
          <select
            value={sensor}
            onChange={(e) =>
              setSensor(e.target.value as (typeof pressureSensors)[number]["key"])
            }
            disabled={!canCommand}
            className={inputClass}
            aria-label="Sensor tekanan"
          >
            {pressureSensors.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
          <input
            type="number"
            step="0.1"
            min="0"
            value={kpa}
            onChange={(e) => setKpa(e.target.value)}
            disabled={!canCommand}
            className={inputClass}
            aria-label="Tekanan referensi kPa"
          />
        </div>
        <Button
          size="sm"
          icon={Gauge}
          disabled={!canCommand || !Number.isFinite(Number(kpa))}
          onClick={() => calibratePressure(sensor, Number(kpa))}
        >
          Kirim titik {Number(kpa).toFixed(1)} kPa
        </Button>
        <p className="text-[11px] text-muted">
          Lakukan dua kali dengan tekanan berbeda (mis. 1.0 lalu 2.5 kPa). Mode
          otomatis terkunci sampai kedua sensor selesai.
        </p>
      </div>

      <div className="flex flex-col gap-2 rounded-lg bg-info-50 p-3">
        <p className="text-[12px] font-semibold text-ink">
          Kalibrasi pH (buffer 6.86 → 4.01)
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Button
            size="sm"
            variant="secondary"
            disabled={!canCommand}
            onClick={() => calibratePh(6.86)}
          >
            6.86
          </Button>
          <Button
            size="sm"
            variant="secondary"
            disabled={!canCommand}
            onClick={() => calibratePh(4.01)}
          >
            4.01
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2 rounded-lg bg-info-50 p-3">
        <p className="text-[12px] font-semibold text-ink">
          Kalibrasi MQ (R0)
        </p>
        <div className="grid grid-cols-2 gap-2">
          <select
            value={gas}
            onChange={(e) =>
              setGas(e.target.value as (typeof mqGases)[number]["key"])
            }
            disabled={!canCommand}
            className={inputClass}
            aria-label="Sensor MQ"
          >
            {mqGases.map((g) => (
              <option key={g.key} value={g.key}>
                {g.label}
              </option>
            ))}
          </select>
          <input
            type="number"
            min="0"
            value={refPpm}
            onChange={(e) => setRefPpm(e.target.value)}
            disabled={!canCommand}
            className={inputClass}
            aria-label="Konsentrasi referensi ppm"
          />
        </div>
        <Button
          size="sm"
          icon={Activity}
          disabled={!canCommand || !Number.isFinite(Number(refPpm))}
          onClick={() => calibrateMq(gas, Number(refPpm))}
        >
          Set R0 ({Number(refPpm) === 0 ? "udara bersih" : `${refPpm} ppm`})
        </Button>
      </div>

      <p className="flex items-center gap-1.5 text-[11px] text-muted">
        <Radio className="size-3.5" /> Perintah dikirim ke topik{" "}
        <code>nexgas/&lt;id&gt;/cmd</code> lewat backend.
        <Wifi className="size-3.5" />
        <Cpu className="size-3.5" />
      </p>
    </Card>
  );
}
