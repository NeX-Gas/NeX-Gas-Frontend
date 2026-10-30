"use client";

import { useState } from "react";
import { Activity, FlaskConical, Gauge, RotateCcw, ShieldAlert } from "lucide-react";
import { Button } from "@/components/button";
import {
  MetricRow,
  Panel,
  PanelHead,
  Readout,
  SectionLabel,
  StatusBadge,
} from "@/components/ui";
import { useAppStore } from "@/components/app-store";
import { relativeTime } from "@/lib/format";
import { cn } from "@/lib/cn";

const linkLabel = {
  live: "Live",
  demo: "Demo",
  connecting: "Menyambung",
  offline: "Offline",
} as const;

const linkTone = {
  live: "good",
  demo: "info",
  connecting: "warn",
  offline: "danger",
} as const;

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

  return (
    <Panel className={cn("flex flex-col", className)}>
      <PanelHead
        label="Status Alat"
        title={deviceId}
        right={
          <StatusBadge tone={linkTone[link]}>
            {linkLabel[link]}
            {link === "live" && !deviceOnline ? " · offline" : ""}
          </StatusBadge>
        }
      />

      <div className="grid grid-cols-1 gap-x-8 px-4 py-1 sm:grid-cols-2">
        <div>
          <MetricRow
            label="Sinyal WiFi"
            value={rssi === 0 ? "—" : rssi}
            unit={rssi === 0 ? undefined : "dBm"}
            tone={rssi === 0 ? "muted" : rssi > -70 ? "ink" : "danger"}
          />
          <MetricRow
            label="Sensor siap"
            value={sensorsReady ? "ya" : "belum"}
            tone={sensorsReady ? "brand" : "danger"}
          />
          <MetricRow
            label="Kalibrasi tekanan"
            value={pressureCalibrated ? "selesai" : "belum"}
            tone={pressureCalibrated ? "brand" : "danger"}
          />
          <MetricRow
            label="Kalibrasi pH"
            value={phCalibrated ? "selesai" : "belum"}
            tone={phCalibrated ? "brand" : "danger"}
          />
        </div>
        <div>
          <MetricRow
            label="Buffer offline"
            value={buffered > 0 ? buffered : 0}
            unit="sampel"
            tone={buffered > 0 ? "danger" : "muted"}
          />
          <MetricRow label="Firmware" value={firmware} tone="muted" />
          <MetricRow
            label="Data terakhir"
            value={relativeTime(lastSeen)}
            tone="muted"
          />
          <MetricRow
            label="Kanal"
            value={link === "live" ? "backend" : "simulator"}
            tone="muted"
          />
        </div>
      </div>
    </Panel>
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

const inputClass =
  "h-9 w-full rounded-[4px] border border-line/60 bg-surface px-2.5 font-mono text-[12.5px] text-ink transition-colors focus:border-brand focus:outline-none disabled:bg-info-50 disabled:text-muted";

function Step({
  index,
  title,
  hint,
  children,
  last,
}: {
  index: string;
  title: string;
  hint?: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2.5 px-4 py-3.5",
        last ? "flex-1" : "border-b border-line/30",
      )}
    >
      <div className="flex items-baseline justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-[10px] text-muted">{index}</span>
          <SectionLabel className="tracking-[0.06em] text-ink-2">
            {title}
          </SectionLabel>
        </div>
        {hint ? (
          <span className="font-mono text-[10px] text-muted">{hint}</span>
        ) : null}
      </div>
      {children}
    </div>
  );
}

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

  return (
    <Panel className={cn("flex flex-col", className)}>
      <PanelHead
        label="Kalibrasi"
        title="Sensor & Aktuator"
        right={
          <div className="flex items-center gap-1.5">
            <StatusBadge tone={pressureCalibrated ? "good" : "warn"}>
              Tekanan {pressureCalibrated ? "siap" : "belum"}
            </StatusBadge>
            <StatusBadge tone={phCalibrated ? "good" : "warn"}>
              pH {phCalibrated ? "siap" : "belum"}
            </StatusBadge>
          </div>
        }
      />

      {!canCommand ? (
        <div className="flex items-start gap-2 border-b border-line/30 bg-info-50 px-4 py-2.5">
          <ShieldAlert className="mt-px size-3.5 shrink-0 text-danger" strokeWidth={1.75} />
          <p className="text-[11px] leading-4 text-ink-2">
            Perintah belum bisa dikirim: dashboard masih mode demo atau backend
            belum tersambung. Nilai di bawah tidak sampai ke alat.
          </p>
        </div>
      ) : null}

      <Step index="01" title="Tare tekanan" hint="nolkan kedua sensor">
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={RotateCcw}
            disabled={!canCommand}
            onClick={() => tare()}
          >
            Tare
          </Button>
          <p className="text-[10.5px] leading-4 text-muted">
            Lakukan tanpa tekanan, sebelum 2 titik.
          </p>
        </div>
      </Step>

      <Step index="02" title="Tekanan · 2 titik" hint="kPa">
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
      </Step>

      <Step index="03" title="pH · buffer 6.86 → 4.01" hint="2 titik">
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
        <p className="text-[10.5px] leading-4 text-muted">
          Bilas probe di air bersih sebelum titik kedua.
        </p>
      </Step>

      <Step index="04" title="MQ · R0" hint="referensi" last>
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
          Set R0 · {Number(refPpm) === 0 ? "udara bersih" : `${refPpm} ppm`}
        </Button>
      </Step>

      <div className="flex items-center gap-2 border-t border-line/35 px-4 py-2.5">
        <FlaskConical className="size-3.5 text-muted" strokeWidth={1.75} />
        <p className="font-mono text-[10px] leading-4 text-muted">
          nexgas/&lt;id&gt;/cmd · lewat backend
        </p>
        <Readout
          value={pressureCalibrated && phCalibrated ? "siap" : "terkunci"}
          size="sm"
          tone={pressureCalibrated && phCalibrated ? "brand" : "muted"}
          className="ml-auto"
        />
      </div>
    </Panel>
  );
}
