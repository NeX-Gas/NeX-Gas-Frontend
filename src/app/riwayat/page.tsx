"use client";

import { useEffect, useMemo, useState } from "react";
import { ClipboardList, Fuel, Plus, TrendingUp } from "lucide-react";
import { Button } from "@/components/button";
import { LogInputModal } from "@/components/log-modal";
import { ProductionChart, type Bar } from "@/components/production-chart";
import { Card, ScreenTitle, SectionLabel, StatusPill } from "@/components/ui";
import { useAppStore } from "@/components/app-store";
import { fetchTelemetryHistory, getSession } from "@/lib/api";
import { cn } from "@/lib/cn";

type Period = "harian" | "mingguan" | "bulanan";

const PERIODS: Array<{
  key: Period;
  label: string;
  suffix: string;
  buckets: number;
  bucketMs: number;
}> = [
  { key: "harian", label: "Harian", suffix: "/ 24 jam terakhir", buckets: 8, bucketMs: 3 * 3600_000 },
  { key: "mingguan", label: "Mingguan", suffix: "/ 7 hari terakhir", buckets: 7, bucketMs: 24 * 3600_000 },
  { key: "bulanan", label: "Bulanan", suffix: "/ 30 hari terakhir", buckets: 6, bucketMs: 5 * 24 * 3600_000 },
];

type Reading = {
  receivedAt: string;
  gasSinceStartTotalL: number | null;
};

/** Volume gas per bucket dari selisih counter firmware `gasSinceStartTotalL` (liter -> m³). */
function buildBars(readings: Reading[], period: Period): Bar[] {
  const cfg = PERIODS.find((p) => p.key === period)!;
  const now = Date.now();
  const start = now - cfg.buckets * cfg.bucketMs;
  const litres = new Array<number>(cfg.buckets).fill(0);

  let prev: { t: number; l: number } | null = null;
  for (const r of readings) {
    const t = new Date(r.receivedAt).getTime();
    const l = r.gasSinceStartTotalL;
    if (!Number.isFinite(t) || l == null || !Number.isFinite(l)) continue;
    if (prev) {
      const delta = l - prev.l;
      // Counter reset saat alat restart -> abaikan, jangan dianggap produksi.
      if (delta > 0 && t >= start) {
        const idx = Math.min(
          cfg.buckets - 1,
          Math.max(0, Math.floor((t - start) / cfg.bucketMs)),
        );
        litres[idx] += delta;
      }
    }
    prev = { t, l };
  }

  return litres.map((litre, i) => {
    const at = new Date(start + i * cfg.bucketMs);
    const label =
      period === "harian"
        ? `${String(at.getHours()).padStart(2, "0")}`
        : at.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
    return { label, value: Math.round((litre / 1000) * 100) / 100 };
  });
}

function Segmented({
  value,
  onChange,
}: {
  value: Period;
  onChange: (p: Period) => void;
}) {
  return (
    <div className="flex gap-1 rounded-xl bg-info-50 p-1 card-shadow">
      {PERIODS.map(({ key, label }) => {
        const active = value === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={cn(
              "h-12 flex-1 rounded-lg text-[15px] font-semibold transition-colors",
              active
                ? "bg-surface text-brand card-shadow"
                : "text-ink-2 hover:bg-info-100",
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

function GasTotalCard({ totalM3 }: { totalM3: number }) {
  return (
    <Card className="relative overflow-hidden bg-brand p-4 text-white">
      <span className="pointer-events-none absolute -right-4 -bottom-6 size-32 rounded-full bg-white/10" />
      <div className="relative flex items-start gap-4">
        <span className="grid size-14 shrink-0 place-items-center rounded-xl bg-surface">
          <Fuel className="size-7 text-brand" />
        </span>
        <div>
          <p className="text-[11px] font-semibold tracking-[0.08em] text-white/75 uppercase">
            Gas Tercatat Alat
          </p>
          <h3 className="mt-1 text-lg leading-[1.25] font-semibold">
            {totalM3.toFixed(2)} m³
            <br />
            30 hari terakhir
          </h3>
        </div>
      </div>
      <div className="relative mt-4 border-t border-white/25 pt-3 text-sm text-white/70">
        Dihitung dari counter firmware <code>gasSinceStartTotalL</code>.
      </div>
    </Card>
  );
}

function QuickAction({ onLog }: { onLog: () => void }) {
  return (
    <Card className="flex items-center gap-3 p-4">
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-info-400 text-muted-2">
        <Plus className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] text-ink">Catat Muatan Hari Ini</p>
        <p className="text-sm text-ink-2">Menjaga produksi tetap stabil</p>
      </div>
      <Button variant="soft" size="sm" onClick={onLog} className="shrink-0">
        + Isi Log
      </Button>
    </Card>
  );
}

export default function RiwayatPage() {
  const [period, setPeriod] = useState<Period>("mingguan");
  const { logs, addLog } = useAppStore();
  const [open, setOpen] = useState(false);
  const [readings, setReadings] = useState<Reading[]>([]);

  // Riwayat hanya dari backend (butuh login). Tanpa sesi -> grafik kosong,
  // bukan angka contoh.
  useEffect(() => {
    if (!getSession()) return;
    let cancelled = false;
    void fetchTelemetryHistory(500)
      .then((items) => {
        if (!cancelled) setReadings(items);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const cfg = PERIODS.find((p) => p.key === period)!;
  const bars = useMemo(() => buildBars(readings, period), [readings, period]);
  const total = useMemo(
    () => bars.reduce((sum, b) => sum + b.value, 0),
    [bars],
  );
  const total30 = useMemo(
    () => buildBars(readings, "bulanan").reduce((sum, b) => sum + b.value, 0),
    [readings],
  );
  const target = useMemo(() => {
    const peak = Math.max(...bars.map((b) => b.value));
    return peak > 0 ? Math.round(peak * 1.4 * 100) / 100 : 0;
  }, [bars]);
  const peak = bars.reduce((acc, b) => (b.value > acc.value ? b : acc), bars[0]);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-6">
      <ScreenTitle
        className="lg:col-span-12"
        title="Riwayat Produksi Biogas"
        subtitle="Volume gas dari catatan backend, tanpa data contoh"
      />

      <div className="lg:col-span-12 lg:max-w-md">
        <Segmented value={period} onChange={setPeriod} />
      </div>

      <Card className="flex flex-col gap-4 p-4 lg:col-span-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <SectionLabel>Volume Biogas Dihasilkan</SectionLabel>
            <p className="mt-1 flex items-baseline gap-1.5">
              <span className="text-lg font-semibold text-ink">
                {total.toFixed(2)} m³
              </span>
              <span className="text-sm text-ink-2">{cfg.suffix}</span>
            </p>
          </div>
          <StatusPill tone="neutral">
            {readings.length > 0 ? `${readings.length} catatan` : "Belum ada data"}
          </StatusPill>
        </div>

        <ProductionChart
          key={period}
          data={bars}
          target={target}
          unit="m³"
        />

        <div className="flex items-center gap-3 rounded-lg bg-info-50 p-3">
          <TrendingUp className="size-4 shrink-0 text-brand" />
          <p className="flex-1 text-[13px] font-semibold text-ink">
            {total > 0
              ? `Puncak produksi: ${peak.label} (${peak.value} m³)`
              : "Belum ada produksi tercatat. Data muncul setelah valve membuka dan backend menyimpan telemetry."}
          </p>
        </div>
      </Card>

      <div className="flex flex-col gap-4 lg:col-span-5 lg:gap-6">
        <GasTotalCard totalM3={total30} />
        <QuickAction onLog={() => setOpen(true)} />
      </div>

      <section className="flex flex-col gap-3 lg:col-span-12">
        <div className="flex items-center justify-between gap-3 px-1">
          <h3 className="text-lg font-semibold text-ink">Catatan Harian</h3>
          <span className="text-[13px] font-semibold text-muted">
            Semua data tersimpan
          </span>
        </div>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {logs.map((log) => (
            <Card
              key={log.id}
              className="animate-fade-up flex items-center gap-3 p-4"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-info-100 text-ink">
                <ClipboardList className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-semibold text-ink">
                  {log.date}
                </p>
                <p className="truncate text-sm text-ink-2">{log.input}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <span className="text-base font-bold text-ink">
                  {log.gas}
                </span>
                <StatusPill
                  tone={log.status.tone === "neutral" ? "neutral" : "good"}
                >
                  {log.status.text}
                </StatusPill>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {open ? (
        <LogInputModal
          onClose={() => setOpen(false)}
          onSave={(kg) => addLog(kg, `${(kg * 0.072).toFixed(1)} m³`)}
        />
      ) : null}
    </div>
  );
}
