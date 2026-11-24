"use client";

import { useCallback, useEffect, useState } from "react";
import { Save, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/button";
import { Card, SectionLabel, StatusPill } from "@/components/ui";
import { useAppStore } from "@/components/app-store";
import { fetchDeviceConfig, postDeviceConfig } from "@/lib/api";
import { cn } from "@/lib/cn";

type Field = { key: string; label: string; unit: string; step: string; min?: string };

const THRESHOLD_FIELDS: Field[] = [
  { key: "openKpa", label: "Valve buka", unit: "kPa", step: "0.05", min: "0" },
  { key: "closeKpa", label: "Valve tutup", unit: "kPa", step: "0.05", min: "0" },
  { key: "fullKpa", label: "Penampung penuh", unit: "kPa", step: "0.05", min: "0" },
  { key: "minDeltaKpa", label: "Delta minimum", unit: "kPa", step: "0.01", min: "0" },
  { key: "h2sWarnPpm", label: "H₂S waspada", unit: "ppm", step: "0.5", min: "0" },
  { key: "h2sDangerPpm", label: "H₂S bahaya", unit: "ppm", step: "0.5", min: "0" },
  { key: "leakWarnPpm", label: "Bocor waspada", unit: "ppm", step: "10", min: "0" },
  { key: "leakDangerPpm", label: "Bocor bahaya", unit: "ppm", step: "10", min: "0" },
  { key: "tempMinC", label: "Suhu minimum", unit: "°C", step: "0.5" },
  { key: "tempMaxC", label: "Suhu maksimum", unit: "°C", step: "0.5" },
  { key: "humidityMaxPct", label: "RH maksimum", unit: "%", step: "1", min: "0" },
];

const INTERVAL_FIELDS: Field[] = [
  { key: "sampleMs", label: "Sampling", unit: "ms", step: "100", min: "500" },
  { key: "telemetryMs", label: "Telemetri", unit: "ms", step: "500", min: "1000" },
  { key: "stateMs", label: "State", unit: "ms", step: "1000", min: "5000" },
  { key: "valveMaxOpenMs", label: "Valve max buka", unit: "ms", step: "60000", min: "1000" },
];

const DEFAULTS: Record<string, number> = {
  openKpa: 1.0,
  closeKpa: 0.3,
  fullKpa: 2.0,
  minDeltaKpa: 0.15,
  h2sWarnPpm: 5,
  h2sDangerPpm: 12,
  leakWarnPpm: 400,
  leakDangerPpm: 1000,
  tempMinC: 28,
  tempMaxC: 38,
  humidityMaxPct: 80,
  sampleMs: 2000,
  telemetryMs: 5000,
  stateMs: 30000,
  valveMaxOpenMs: 600000,
};

const inputClass =
  "h-10 w-full rounded-lg border border-info-300 bg-info-50 px-3 font-mono text-[13px] font-semibold text-ink focus:border-brand focus:outline-none disabled:opacity-50";

export function ConfigCard({ className }: { className?: string }) {
  const { auth, canCommand, notify } = useAppStore();
  const isAdmin = auth?.user.role === "admin";
  const [form, setForm] = useState<Record<string, string>>(
    Object.fromEntries(Object.entries(DEFAULTS).map(([k, v]) => [k, String(v)])),
  );
  const [meta, setMeta] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const snapshot = await fetchDeviceConfig();
      setError(null);
      if (!snapshot) {
        setMeta("Alat belum mengirim config (menunggu pesan retained).");
        return;
      }
      const thresholds = (snapshot.config.thresholds ?? {}) as Record<string, unknown>;
      const intervals = (snapshot.config.intervals ?? {}) as Record<string, unknown>;
      const next: Record<string, string> = {};
      for (const field of THRESHOLD_FIELDS) {
        const value = thresholds[field.key];
        next[field.key] = String(
          typeof value === "number" ? value : DEFAULTS[field.key],
        );
      }
      for (const field of INTERVAL_FIELDS) {
        const source = field.key === "valveMaxOpenMs" ? snapshot.config : intervals;
        const value = source[field.key];
        next[field.key] = String(
          typeof value === "number" ? value : DEFAULTS[field.key],
        );
      }
      setForm(next);
      setMeta(
        `Diterima ${new Date(snapshot.receivedAt).toLocaleString("id-ID")}${
          snapshot.signed ? " • bertanda tangan" : " • polos"
        }`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat config alat");
    }
  }, [isAdmin]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);

  if (!isAdmin) {
    return (
      <Card className={cn("flex flex-col gap-3 p-4", className)}>
        <SectionLabel>Ambang batas</SectionLabel>
        <p className="text-sm text-ink-2">
          Login sebagai admin untuk mengubah ambang dan interval alat.
        </p>
      </Card>
    );
  }

  const save = async () => {
    setBusy(true);
    setResult(null);
    setError(null);

    const thresholds: Record<string, number> = {};
    for (const field of THRESHOLD_FIELDS) thresholds[field.key] = Number(form[field.key]);
    const intervals: Record<string, number> = {};
    for (const field of INTERVAL_FIELDS) {
      if (field.key === "valveMaxOpenMs") continue;
      intervals[field.key] = Number(form[field.key]);
    }
    const valveMaxOpenMs = Number(form.valveMaxOpenMs);

    const all = [...Object.values(thresholds), ...Object.values(intervals), valveMaxOpenMs];
    if (all.some((value) => !Number.isFinite(value))) {
      setError("Semua field harus berupa angka.");
      setBusy(false);
      return;
    }

    try {
      const response = await postDeviceConfig({ thresholds, intervals, valveMaxOpenMs });
      const message = response.ack
        ? "Alat mengonfirmasi config baru."
        : "Config terkirim; menunggu konfirmasi alat.";
      setResult(message);
      notify(message);
      await load();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Config gagal dikirim";
      setError(message);
      notify(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className={cn("flex flex-col gap-4 p-4", className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <SectionLabel>Ambang &amp; interval</SectionLabel>
          <h3 className="mt-1 text-lg font-semibold text-ink">Konfigurasi runtime</h3>
        </div>
        <StatusPill tone={meta ? "good" : "warn"}>
          {meta ? "dari alat" : "default"}
        </StatusPill>
      </div>

      {meta ? <p className="text-[11px] leading-4 text-muted">{meta}</p> : null}
      {error ? (
        <p className="rounded-lg bg-danger-200 p-3 text-[12px] font-medium text-danger-800">
          {error}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {THRESHOLD_FIELDS.map((field) => (
          <label key={field.key} className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold text-ink-2">
              {field.label} <span className="font-normal text-muted">({field.unit})</span>
            </span>
            <input
              type="number"
              step={field.step}
              min={field.min}
              value={form[field.key] ?? ""}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, [field.key]: event.target.value }))
              }
              disabled={!canCommand}
              className={inputClass}
            />
          </label>
        ))}
      </div>

      <div className="grid gap-3 border-t border-info-100 pt-4 sm:grid-cols-2 lg:grid-cols-4">
        {INTERVAL_FIELDS.map((field) => (
          <label key={field.key} className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold text-ink-2">
              {field.label} <span className="font-normal text-muted">({field.unit})</span>
            </span>
            <input
              type="number"
              step={field.step}
              min={field.min}
              value={form[field.key] ?? ""}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, [field.key]: event.target.value }))
              }
              disabled={!canCommand}
              className={inputClass}
            />
          </label>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          icon={Save}
          disabled={!canCommand || busy}
          onClick={() => void save()}
        >
          {busy ? "Mengirim…" : "Simpan ke alat"}
        </Button>
        <Button size="sm" variant="secondary" onClick={() => void load()}>
          Muat ulang dari alat
        </Button>
        <span className="inline-flex items-center gap-1.5 text-[11px] text-muted">
          <SlidersHorizontal className="size-3.5" />
          Disimpan di NVS alat, bukan di firmware.
        </span>
      </div>

      {result ? (
        <p className="rounded-lg bg-info-200 p-3 text-[12px] font-medium text-ink">
          {result}
        </p>
      ) : null}
    </Card>
  );
}
