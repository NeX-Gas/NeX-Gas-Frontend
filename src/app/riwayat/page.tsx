"use client";

import { useMemo, useState } from "react";
import { ClipboardPlus, Fuel, TrendingDown, TrendingUp } from "lucide-react";
import { Button } from "@/components/button";
import { LogInputModal } from "@/components/log-modal";
import { ProductionChart, type Bar } from "@/components/production-chart";
import {
  Panel,
  PanelHead,
  Readout,
  ScreenTitle,
  SectionLabel,
  StatusPill,
} from "@/components/ui";
import { useAppStore } from "@/components/app-store";
import { parseVolume } from "@/lib/format";
import { weeklyProduction } from "@/lib/mock";
import { cn } from "@/lib/cn";

type Period = "harian" | "mingguan" | "bulanan";

type Dataset = {
  label: string;
  total: number;
  suffix: string;
  target: number;
  data: Bar[];
};

const datasets: Record<Period, Dataset> = {
  harian: {
    label: "Harian",
    total: 4.0,
    suffix: "hari ini",
    target: 1,
    data: [
      { label: "06", value: 0.4 },
      { label: "09", value: 0.6 },
      { label: "12", value: 0.9 },
      { label: "15", value: 1.1 },
      { label: "18", value: 0.7 },
      { label: "21", value: 0.3 },
    ],
  },
  mingguan: {
    label: "Mingguan",
    total: 11.9,
    suffix: "7 hari terakhir",
    target: 1.5,
    data: weeklyProduction,
  },
  bulanan: {
    label: "Bulanan",
    total: 48.6,
    suffix: "30 hari terakhir",
    target: 12,
    data: [
      { label: "M1", value: 11.9 },
      { label: "M2", value: 13.2 },
      { label: "M3", value: 12.4 },
      { label: "M4", value: 11.1 },
    ],
  },
};

function PeriodSwitch({
  value,
  onChange,
}: {
  value: Period;
  onChange: (p: Period) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Periode data"
      className="flex gap-0.5 rounded-[4px] bg-info-100 p-0.5"
    >
      {(Object.keys(datasets) as Period[]).map((key) => {
        const active = value === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            aria-pressed={active}
            className={cn(
              "h-7 rounded-[3px] px-2.5 text-[11.5px] font-medium transition-colors",
              active
                ? "border border-line/50 bg-surface text-brand-deep"
                : "text-ink-2 hover:text-ink",
            )}
          >
            {datasets[key].label}
          </button>
        );
      })}
    </div>
  );
}

function SavingsPanel({
  total,
  className,
}: {
  total: number;
  className?: string;
}) {
  // Konversi kasar: 1 m³ biogas ≈ 0.45 kg LPG.
  const lpg = total * 0.45;
  const rupiah = Math.round(lpg * 12000);

  return (
    <Panel
      className={cn(
        "flex flex-col overflow-hidden border-brand-dark/40 bg-brand text-white",
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-white/20 px-4 py-2.5">
        <Fuel className="size-3.5 text-brand-300" strokeWidth={1.75} />
        <SectionLabel className="text-white/70">Pengganti LPG</SectionLabel>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <p className="text-[11px] tracking-[0.06em] text-white/60 uppercase">
            Setara tabung terhemat
          </p>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="font-mono text-[32px] leading-9 font-medium tnum">
              {lpg.toFixed(1)}
            </span>
            <span className="font-mono text-[12px] text-brand-200">kg</span>
          </div>
        </div>

        <div className="rounded-[4px] bg-black/15 px-3 py-2">
          <div className="flex items-baseline justify-between">
            <span className="text-[11px] text-white/70">Nilai rupiah</span>
            <span className="flex items-baseline gap-1 font-mono tnum">
              <span className="text-[10.5px] text-white/60">Rp</span>
              <span className="text-[17px] leading-5 font-medium">
                {rupiah.toLocaleString("id-ID")}
              </span>
            </span>
          </div>
        </div>

        <div className="flex flex-col">
          <div className="flex items-baseline justify-between border-b border-white/15 py-1.5">
            <span className="text-[11.5px] text-white/70">Volume biogas</span>
            <span className="font-mono text-[12px] tnum">
              {total.toFixed(1)} m³
            </span>
          </div>
          <div className="flex items-baseline justify-between border-b border-white/15 py-1.5">
            <span className="text-[11.5px] text-white/70">
              Setara tabung 3 kg
            </span>
            <span className="font-mono text-[12px] tnum">
              {(lpg / 3).toFixed(1)} tabung
            </span>
          </div>
          <div className="flex items-baseline justify-between py-1.5">
            <span className="text-[11.5px] text-white/70">Harga acuan LPG</span>
            <span className="font-mono text-[12px] tnum">Rp 12.000/kg</span>
          </div>
        </div>

        <p className="mt-auto flex items-start gap-1.5 border-t border-white/15 pt-2.5 text-[10.5px] leading-4 text-white/65">
          <TrendingDown className="mt-px size-3 shrink-0" />
          Estimasi dari {total.toFixed(1)} m³ biogas · 0.45 kg LPG per m³. Bukan
          tagihan aktual.
        </p>
      </div>
    </Panel>
  );
}

export default function RiwayatPage() {
  const [period, setPeriod] = useState<Period>("mingguan");
  const { logs, addLog } = useAppStore();
  const [open, setOpen] = useState(false);

  const ds = datasets[period];
  const peak = useMemo(
    () => ds.data.reduce((acc, d) => (d.value > acc.value ? d : acc), ds.data[0]),
    [ds],
  );

  return (
    <div className="flex flex-col gap-4 lg:gap-5">
      <ScreenTitle
        title="Riwayat Produksi"
        subtitle="Volume biogas, catatan pengisian, dan estimasi penghematan"
        actions={
          <Button
            size="sm"
            icon={ClipboardPlus}
            onClick={() => setOpen(true)}
          >
            Catat
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-5">
        <Panel className="flex flex-col lg:col-span-8">
          <PanelHead
            label="Volume Biogas"
            title={`${ds.total.toFixed(1)} m³`}
            right={<PeriodSwitch value={period} onChange={setPeriod} />}
          />

          <div className="flex flex-1 flex-col gap-4 p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-[12px] text-muted">{ds.suffix}</p>
              <StatusPill tone="good">Stabil</StatusPill>
            </div>

            <ProductionChart
              key={period}
              data={ds.data}
              target={ds.target}
            />

            <div className="flex items-center gap-2 border-t border-line/30 pt-2.5">
              <TrendingUp className="size-3.5 shrink-0 text-brand" strokeWidth={1.75} />
              <p className="flex-1 text-[12px] text-ink-2">
                Puncak <span className="font-mono text-ink">{peak.label}</span> ·{" "}
                <span className="font-mono text-ink">{peak.value} m³</span>
              </p>
            </div>
          </div>
        </Panel>

        <SavingsPanel className="lg:col-span-4" total={ds.total} />
      </div>

      <Panel className="overflow-hidden">
        <PanelHead
          label="Catatan Harian"
          title="Input Kotoran"
          right={
            <span className="font-mono text-[10.5px] text-muted">
              {logs.length} entri · lokal
            </span>
          }
        />

        <ul>
          {logs.map((log, i) => (
            <li
              key={log.id}
              className={cn(
                "flex items-start justify-between gap-4 px-4 py-3",
                i > 0 && "border-t border-line/30",
              )}
            >
              <div className="flex min-w-0 items-start gap-3">
                <span className="mt-1.5 font-mono text-[10.5px] text-muted tnum">
                  {String(logs.length - i).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <p className="text-[13px] leading-5 font-medium text-ink">
                    {log.date}
                  </p>
                  <p className="truncate text-[11.5px] leading-4 text-muted">
                    {log.input}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 flex-col items-end gap-1">
                <Readout
                  value={parseVolume(log.gas)?.toFixed(1) ?? "—"}
                  unit="m³"
                  size="sm"
                />
                <StatusPill
                  tone={log.status.tone === "neutral" ? "neutral" : "good"}
                >
                  {log.status.text}
                </StatusPill>
              </div>
            </li>
          ))}
          {logs.length === 0 ? (
            <li className="px-4 py-8 text-center text-[12px] text-muted">
              Belum ada catatan.
            </li>
          ) : null}
        </ul>
      </Panel>

      <p className="px-1 font-mono text-[10.5px] leading-4 text-muted">
        Grafik memakai data contoh — belum tersambung ke histori backend.
      </p>

      {open ? (
        <LogInputModal
          onClose={() => setOpen(false)}
          onSave={(kg) => addLog(kg, `${(kg * 0.072).toFixed(1)} m³`)}
        />
      ) : null}
    </div>
  );
}
