"use client";

import { useState } from "react";
import {
  Activity,
  FlaskConical,
  Power,
  RefreshCw,
  ShieldCheck,
  Wind,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/button";
import { Card, ScreenTitle, SectionLabel, StatusPill } from "@/components/ui";
import { useAppStore } from "@/components/app-store";
import type { CalibrationReadback } from "@/lib/types";

const inputClass =
  "h-10 w-full rounded-lg border border-info-300 bg-info-50 px-3 font-mono text-[13px] font-semibold text-ink focus:border-brand focus:outline-none disabled:opacity-50";

function fmt(value: number | null | undefined, digits = 2): string {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value.toFixed(digits)
    : "—";
}

function fmtSigned(value: number | null | undefined, digits = 0): string {
  return typeof value === "number" && Number.isFinite(value) && value !== 0
    ? value.toFixed(digits)
    : "—";
}

function Reading({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-[13px]">
      <span className="text-ink-2">{label}</span>
      <span className="font-mono font-semibold text-ink">
        {value}
        {unit ? <span className="ml-1 text-[11px] text-muted">{unit}</span> : null}
      </span>
    </div>
  );
}

function BusyButton({
  children,
  onClick,
  disabled,
  variant = "primary",
  icon,
}: {
  children: React.ReactNode;
  onClick: () => Promise<void> | void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "soft" | "ghost";
  icon?: LucideIcon;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <Button
      size="sm"
      variant={variant}
      icon={icon}
      disabled={disabled || busy}
      onClick={() => {
        setBusy(true);
        void Promise.resolve(onClick()).finally(() => setBusy(false));
      }}
    >
      {busy ? "Mengirim…" : children}
    </Button>
  );
}

function PressureCard({
  title,
  sensor,
  telemetry,
  stored,
}: {
  title: string;
  sensor: "pressure_digester" | "pressure_collector";
  telemetry: { kpa: number; raw: number };
  stored?: { ok?: boolean; scale?: number; offset?: number };
}) {
  const { calibrate, calSensor, canCommand } = useAppStore();
  const [kpa, setKpa] = useState("1.0");
  const active = calSensor === sensor;
  const reference = Number(kpa);
  const valid = Number.isFinite(reference);

  return (
    <Card className="flex flex-col gap-4 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <SectionLabel>Tekanan</SectionLabel>
          <h3 className="mt-1 text-lg font-semibold text-ink">{title}</h3>
        </div>
        <StatusPill tone={stored?.ok ? "good" : "warn"}>
          {stored?.ok ? "terkalibrasi" : "belum"}
        </StatusPill>
      </div>

      <div className="rounded-lg bg-info-50 p-3">
        <Reading label="Nilai mentah" value={fmtSigned(telemetry.raw)} />
        <Reading label="Tekanan terbaca" value={fmt(telemetry.kpa)} unit="kPa" />
        <Reading label="Scale tersimpan" value={stored?.scale ? stored.scale.toExponential(3) : "—"} />
        <Reading label="Offset tersimpan" value={fmtSigned(stored?.offset)} />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="number"
          step="0.1"
          min="-10"
          max="20"
          value={kpa}
          onChange={(event) => setKpa(event.target.value)}
          disabled={!canCommand}
          className={inputClass}
          aria-label={`Tekanan referensi ${title}`}
        />
        <span className="shrink-0 text-[11px] font-semibold text-muted">kPa</span>
      </div>

      <div className="flex flex-wrap gap-2">
        <BusyButton
          variant="soft"
          disabled={!canCommand || active}
          onClick={async () => {
            await calibrate({ action: "begin", sensor });
          }}
        >
          Mulai
        </BusyButton>
        <BusyButton
          disabled={!canCommand || !valid || !active}
          onClick={async () => {
            await calibrate({ action: "point", sensor, kpa: reference });
          }}
        >
          Kirim titik {kpa || "—"}
        </BusyButton>
        <BusyButton
          variant="secondary"
          disabled={!canCommand || !stored?.ok}
          onClick={async () => {
            await calibrate({ action: "tare", sensor });
          }}
        >
          Tare
        </BusyButton>
        <BusyButton
          variant="ghost"
          disabled={!canCommand}
          onClick={async () => {
            await calibrate({ action: "reset", sensor });
          }}
        >
          Reset
        </BusyButton>
      </div>

      <p className="text-[11px] leading-4 text-muted">
        Alat menangkap 8 sampel baru dan menolak sebaran &gt;5%. Lakukan dua titik
        dengan tekanan berbeda. Mode auto tetap terkunci sampai kedua sensor selesai.
      </p>
    </Card>
  );
}

function PhCard({
  telemetry,
  stored,
}: {
  telemetry: { volts: number; ph: number };
  stored?: { ok?: boolean; v686?: number; v401?: number };
}) {
  const { calibrate, calSensor, canCommand } = useAppStore();
  const active = calSensor === "ph";

  return (
    <Card className="flex flex-col gap-4 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <SectionLabel>pH</SectionLabel>
          <h3 className="mt-1 text-lg font-semibold text-ink">Probe PH-4502C</h3>
        </div>
        <StatusPill tone={stored?.ok ? "good" : "warn"}>
          {stored?.ok ? "terkalibrasi" : "belum"}
        </StatusPill>
      </div>

      <div className="rounded-lg bg-info-50 p-3">
        <Reading label="Tegangan" value={fmt(telemetry.volts, 3)} unit="V" />
        <Reading label="pH terbaca" value={fmt(telemetry.ph, 2)} />
        <Reading label="V buffer 6.86" value={fmt(stored?.v686, 3)} unit="V" />
        <Reading label="V buffer 4.01" value={fmt(stored?.v401, 3)} unit="V" />
      </div>

      <div className="flex flex-wrap gap-2">
        <BusyButton
          variant="soft"
          disabled={!canCommand || active}
          onClick={async () => {
            await calibrate({ action: "begin", sensor: "ph" });
          }}
        >
          Mulai
        </BusyButton>
        <BusyButton
          disabled={!canCommand || !active}
          icon={FlaskConical}
          onClick={async () => {
            await calibrate({ action: "ph", buffer: 6.86 });
          }}
        >
          6.86
        </BusyButton>
        <BusyButton
          disabled={!canCommand || !active}
          icon={FlaskConical}
          onClick={async () => {
            await calibrate({ action: "ph", buffer: 4.01 });
          }}
        >
          4.01
        </BusyButton>
        <BusyButton
          variant="ghost"
          disabled={!canCommand}
          onClick={async () => {
            await calibrate({ action: "reset", sensor: "ph" });
          }}
        >
          Reset
        </BusyButton>
      </div>

      <p className="text-[11px] leading-4 text-muted">
        Dua buffer wajib dalam satu sesi. Satu titik tidak lagi dianggap selesai.
        Bilas probe di antara buffer.
      </p>
    </Card>
  );
}

function MqCard({
  sensor,
  title,
  gas,
  rs,
  ppm,
  r0,
}: {
  sensor: "h2s" | "ch4" | "leak";
  title: string;
  gas: string;
  rs: number;
  ppm: number;
  r0?: number;
}) {
  const { calibrate, canCommand, sensorsReady } = useAppStore();
  const [ref, setRef] = useState("0");
  const refPpm = Number(ref);
  const valid = Number.isFinite(refPpm) && refPpm >= 0;

  return (
    <Card className="flex flex-col gap-4 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <SectionLabel>{gas}</SectionLabel>
          <h3 className="mt-1 text-lg font-semibold text-ink">{title}</h3>
        </div>
        <StatusPill tone={r0 && r0 > 0 ? "good" : "warn"}>
          {r0 && r0 > 0 ? "R0 tersimpan" : "belum"}
        </StatusPill>
      </div>

      <div className="rounded-lg bg-info-50 p-3">
        <Reading label="Rs" value={fmt(rs, 2)} unit="kΩ" />
        <Reading label="Estimasi" value={fmt(ppm, 0)} unit="ppm" />
        <Reading label="R0 tersimpan" value={fmt(r0, 2)} unit="kΩ" />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="number"
          min="0"
          step="10"
          value={ref}
          onChange={(event) => setRef(event.target.value)}
          disabled={!canCommand}
          className={inputClass}
          aria-label={`Referensi ppm ${title}`}
        />
        <span className="shrink-0 text-[11px] font-semibold text-muted">ppm ref</span>
      </div>

      <BusyButton
        disabled={!canCommand || !sensorsReady || !valid}
        icon={Wind}
        onClick={async () => {
          await calibrate({ action: "mq", sensor, refPpm });
        }}
      >
        {refPpm > 0 ? "Kalibrasi dengan gas referensi" : "Kalibrasi R0 (udara bersih)"}
      </BusyButton>

      <p className="text-[11px] leading-4 text-muted">
        {sensorsReady
          ? "0 ppm = udara bersih. Untuk gas referensi, isi konsentrasi yang diketahui."
          : "Menunggu warm-up sensor gas (60 detik setelah boot)."}
      </p>
    </Card>
  );
}

function EnvCard({
  cal,
}: {
  cal: CalibrationReadback | null;
}) {
  const { calibrate, canCommand } = useAppStore();
  const [ds, setDs] = useState(String(cal?.env?.ds ?? 0));
  const [dhtT, setDhtT] = useState(String(cal?.env?.dhtT ?? 0));
  const [dhtH, setDhtH] = useState(String(cal?.env?.dhtH ?? 0));
  const [flow, setFlow] = useState(String(cal?.flow ?? 1));

  return (
    <Card className="flex flex-col gap-4 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <SectionLabel>Offset &amp; flow</SectionLabel>
          <h3 className="mt-1 text-lg font-semibold text-ink">Sensor lingkungan</h3>
        </div>
        <Wrench className="size-5 text-muted" />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-ink-2">DS18B20 offset (°C)</span>
          <input
            type="number"
            step="0.1"
            min="-5"
            max="5"
            value={ds}
            onChange={(event) => setDs(event.target.value)}
            disabled={!canCommand}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-ink-2">DHT22 suhu (°C)</span>
          <input
            type="number"
            step="0.1"
            min="-5"
            max="5"
            value={dhtT}
            onChange={(event) => setDhtT(event.target.value)}
            disabled={!canCommand}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-ink-2">DHT22 RH (%)</span>
          <input
            type="number"
            step="1"
            min="-20"
            max="20"
            value={dhtH}
            onChange={(event) => setDhtH(event.target.value)}
            disabled={!canCommand}
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <BusyButton
          variant="secondary"
          disabled={!canCommand}
          onClick={async () => {
            await calibrate({ action: "set", sensor: "ds18b20", value: Number(ds) });
          }}
        >
          Simpan offset DS
        </BusyButton>
        <BusyButton
          variant="secondary"
          disabled={!canCommand}
          onClick={async () => {
            await calibrate({
              action: "set",
              sensor: "dht22",
              t: Number(dhtT),
              h: Number(dhtH),
            });
          }}
        >
          Simpan offset DHT
        </BusyButton>
      </div>

      <div className="flex items-center gap-2 border-t border-info-100 pt-4">
        <input
          type="number"
          step="0.01"
          min="0.01"
          value={flow}
          onChange={(event) => setFlow(event.target.value)}
          disabled={!canCommand}
          className={inputClass}
          aria-label="Konstanta flow L per kPa"
        />
        <span className="shrink-0 text-[11px] font-semibold text-muted">L/kPa</span>
        <BusyButton
          variant="secondary"
          disabled={!canCommand}
          onClick={async () => {
            await calibrate({ action: "set", sensor: "flow", value: Number(flow) });
          }}
        >
          Simpan flow
        </BusyButton>
      </div>
    </Card>
  );
}

function ValveCard({
  valveOpen,
  leakLatched,
}: {
  valveOpen: boolean;
  leakLatched: boolean;
}) {
  const { calibrate, calSensor, canCommand, sendCommand, auth } = useAppStore();
  const testing = calSensor === "valve";
  const isAdmin = auth?.user.role === "admin";

  return (
    <Card className="flex flex-col gap-4 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <SectionLabel>Aktuator</SectionLabel>
          <h3 className="mt-1 text-lg font-semibold text-ink">Tes solenoid</h3>
        </div>
        <StatusPill tone={leakLatched ? "danger" : valveOpen ? "warn" : "good"}>
          {leakLatched ? "latch kebocoran" : valveOpen ? "terbuka" : "tertutup"}
        </StatusPill>
      </div>

      <div className="flex flex-wrap gap-2">
        <BusyButton
          variant="soft"
          disabled={!canCommand || testing}
          onClick={async () => {
            await calibrate({ action: "begin", sensor: "valve" });
          }}
        >
          Mulai tes
        </BusyButton>
        <BusyButton
          disabled={!canCommand || !testing || leakLatched}
          icon={Power}
          onClick={async () => {
            await calibrate({ action: "valve", ms: 5000 });
          }}
        >
          Buka 5 detik
        </BusyButton>
        <BusyButton
          variant="secondary"
          disabled={!canCommand || !testing}
          onClick={async () => {
            await calibrate({ action: "valve", ms: -1 });
          }}
        >
          Tutup
        </BusyButton>
        {leakLatched ? (
          <BusyButton
            variant="secondary"
            disabled={!canCommand || !isAdmin}
            onClick={async () => {
              await sendCommand({ leak_reset: true });
            }}
          >
            Reset latch kebocoran
          </BusyButton>
        ) : null}
      </div>

      <p className="text-[11px] leading-4 text-muted">
        Valve menutup otomatis setelah batas waktu. Latch kebocoran tidak bisa
        dilewati; alat hanya mau direset setelah sensor kebocoran normal terus
        ≥60 detik (khusus admin).
      </p>
    </Card>
  );
}

function SelfTestCard() {
  const { calibrate, canCommand } = useAppStore();
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  return (
    <Card className="flex flex-col gap-4 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <SectionLabel>Diagnosa</SectionLabel>
          <h3 className="mt-1 text-lg font-semibold text-ink">Selftest alat</h3>
        </div>
        <ShieldCheck className="size-5 text-muted" />
      </div>

      <BusyButton
        disabled={!canCommand}
        icon={Activity}
        onClick={async () => {
          const response = await calibrate({ action: "selftest" });
          if (response?.ack?.ok && response.ack.result) {
            setResult(response.ack.result as Record<string, unknown>);
          }
        }}
      >
        Jalankan selftest
      </BusyButton>

      {result ? (
        <pre className="max-h-72 overflow-auto rounded-lg bg-ink p-3 font-mono text-[11px] leading-5 text-white">
          {JSON.stringify(result, null, 2)}
        </pre>
      ) : (
        <p className="text-[11px] leading-4 text-muted">
          Membaca semua sensor, NVS, heap, dan status MQTT tanpa menggerakkan valve.
        </p>
      )}
    </Card>
  );
}

export default function KalibrasiPage() {
  const {
    telemetry,
    cal,
    calSensor,
    leakLatched,
    pressureCalibrated,
    phCalibrated,
    sensorsReady,
    valveOpen,
    firmware,
    auth,
    canCommand,
    link,
    calibrate,
  } = useAppStore();

  const isAdmin = auth?.user.role === "admin";

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-6">
      <ScreenTitle
        className="lg:col-span-12"
        title="Pusat Kalibrasi"
        subtitle="Semua kalibrasi lewat web, tanpa edit firmware. Perintah ditandatangani HMAC dan dikonfirmasi alat."
      />

      <Card className="flex flex-col gap-3 p-4 lg:col-span-12">
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill tone={link === "live" ? "good" : "warn"}>
            {link === "live" ? "live" : link}
          </StatusPill>
          <StatusPill tone={sensorsReady ? "good" : "warn"}>
            {sensorsReady ? "sensor gas siap" : "warm-up gas"}
          </StatusPill>
          <StatusPill tone={pressureCalibrated ? "good" : "warn"}>
            tekanan {pressureCalibrated ? "siap" : "belum"}
          </StatusPill>
          <StatusPill tone={phCalibrated ? "good" : "warn"}>
            pH {phCalibrated ? "siap" : "belum"}
          </StatusPill>
          <StatusPill tone={leakLatched ? "danger" : "neutral"}>
            {leakLatched ? "latch kebocoran" : "tanpa latch"}
          </StatusPill>
          <StatusPill tone="neutral">firmware {firmware}</StatusPill>
          <StatusPill tone="neutral">sesi: {calSensor || "none"}</StatusPill>
        </div>

        {!isAdmin ? (
          <p className="rounded-lg bg-danger-200 p-3 text-[12px] font-medium text-danger-800">
            Kalibrasi hanya untuk role admin. Login lewat halaman Pengaturan.
          </p>
        ) : !canCommand ? (
          <p className="rounded-lg bg-info-200 p-3 text-[12px] font-medium text-ink">
            Backend belum tersambung atau alat offline. Kalibrasi tidak akan sampai.
          </p>
        ) : null}

        {calSensor !== "none" ? (
          <div className="flex items-center justify-between gap-3 rounded-lg bg-info-50 p-3">
            <span className="text-[12px] font-semibold text-ink">
              Sesi {calSensor} aktif — selesaikan atau batalkan.
            </span>
            <BusyButton
              variant="secondary"
              onClick={async () => {
                await calibrate({ action: "abort" });
              }}
            >
              Batalkan sesi
            </BusyButton>
          </div>
        ) : null}
      </Card>

      <PressureCard
        title="Digester"
        sensor="pressure_digester"
        telemetry={{ kpa: telemetry.pressureDigester, raw: telemetry.rawPd }}
        stored={cal?.pd}
      />
      <PressureCard
        title="Penampung"
        sensor="pressure_collector"
        telemetry={{ kpa: telemetry.pressureCollector, raw: telemetry.rawPc }}
        stored={cal?.pc}
      />

      <PhCard
        telemetry={{ volts: telemetry.phVolts, ph: telemetry.ph }}
        stored={cal?.ph}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:col-span-12">
        <MqCard
          sensor="h2s"
          title="MQ-136 H₂S"
          gas="H₂S"
          rs={telemetry.r0h2s > 0 ? telemetry.r0h2s : -1}
          ppm={telemetry.h2sAfter}
          r0={cal?.mq?.h2s}
        />
        <MqCard
          sensor="ch4"
          title="MQ-4 jalur gas"
          gas="CH₄"
          rs={telemetry.r0ch4 > 0 ? telemetry.r0ch4 : -1}
          ppm={telemetry.ch4}
          r0={cal?.mq?.ch4}
        />
        <MqCard
          sensor="leak"
          title="MQ-4 ambient"
          gas="Kebocoran"
          rs={telemetry.r0leak > 0 ? telemetry.r0leak : -1}
          ppm={telemetry.leak}
          r0={cal?.mq?.leak}
        />
      </div>

      <div className="lg:col-span-7">
        <EnvCard cal={cal} />
      </div>
      <div className="flex flex-col gap-4 lg:col-span-5">
        <ValveCard valveOpen={valveOpen} leakLatched={leakLatched} />
        <SelfTestCard />
      </div>

      <Card className="flex flex-col gap-3 p-4 lg:col-span-12">
        <div className="flex items-center gap-2">
          <RefreshCw className="size-4 text-muted" />
          <p className="text-[12px] font-semibold text-ink">Readback terakhir</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Reading label="Tekanan digester" value={cal?.pd?.ok ? "tersimpan" : "belum"} />
          <Reading label="Tekanan penampung" value={cal?.pc?.ok ? "tersimpan" : "belum"} />
          <Reading label="pH" value={cal?.ph?.ok ? "tersimpan" : "belum"} />
          <Reading label="R0 leak" value={fmt(cal?.mq?.leak, 2)} unit="kΩ" />
        </div>
        <p className="text-[11px] leading-4 text-muted">
          Nilai di atas berasal dari `state.cal` yang dikirim alat, bukan dari input
          web. Kalau kosong, alat belum mengonfirmasi penyimpanan.
        </p>
      </Card>
    </div>
  );
}
