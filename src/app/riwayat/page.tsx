"use client";

import { useMemo, useState } from "react";
import {
  ClipboardList,
  Fuel,
  Plus,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/button";
import { LogInputModal } from "@/components/log-modal";
import { ProductionChart, type Bar } from "@/components/production-chart";
import { Card, ScreenTitle, SectionLabel, StatusPill } from "@/components/ui";
import { useAppStore } from "@/components/app-store";
import { weeklyProduction } from "@/lib/mock";
import { cn } from "@/lib/cn";

type Period = "harian" | "mingguan" | "bulanan";

const datasets: Record<
  Period,
  {
    label: string;
    total: string;
    suffix: string;
    target: number;
    unit: string;
    data: Bar[];
  }
> = {
  harian: {
    label: "Harian",
    total: "4.0 m³",
    suffix: "/ hari ini",
    target: 1,
    unit: "m³",
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
    total: "11.9 m³",
    suffix: "/ 7 hari terakhir",
    target: 1.5,
    unit: "m³",
    data: weeklyProduction,
  },
  bulanan: {
    label: "Bulanan",
    total: "48.6 m³",
    suffix: "/ 30 hari terakhir",
    target: 12,
    unit: "m³",
    data: [
      { label: "M1", value: 11.9 },
      { label: "M2", value: 13.2 },
      { label: "M3", value: 12.4 },
      { label: "M4", value: 11.1 },
    ],
  },
};

function Segmented({
  value,
  onChange,
}: {
  value: Period;
  onChange: (p: Period) => void;
}) {
  return (
    <div className="flex gap-1 rounded-xl bg-info-50 p-1 card-shadow">
      {(Object.keys(datasets) as Period[]).map((key) => {
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
            {datasets[key].label}
          </button>
        );
      })}
    </div>
  );
}

function SavingsCard() {
  return (
    <Card className="relative overflow-hidden bg-brand p-4 text-white">
      <span className="pointer-events-none absolute -right-4 -bottom-6 size-32 rounded-full bg-white/10" />
      <div className="relative flex items-start gap-4">
        <span className="grid size-14 shrink-0 place-items-center rounded-xl bg-surface">
          <Fuel className="size-7 text-brand" />
        </span>
        <div>
          <p className="text-[11px] font-semibold tracking-[0.08em] text-white/75 uppercase">
            Pengganti Tabung LPG
          </p>
          <h3 className="mt-1 text-lg leading-[1.25] font-semibold">
            Setara 12.5 kg LPG Dihemat
            <br />
            Bulan Ini
          </h3>
        </div>
      </div>
      <div className="relative mt-4 flex items-center gap-2 border-t border-white/25 pt-3">
        <TrendingDown className="size-4 shrink-0" />
        <span className="text-base font-bold">Hemat Rp 150.000</span>
        <span className="text-sm text-white/70">/ bln</span>
      </div>
      <div className="relative mt-3">
        <span className="inline-flex rounded-full bg-surface px-2.5 py-1 text-[13px] font-semibold text-brand">
          Bebas Beli Gas Melon
        </span>
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

  const ds = datasets[period];
  const peak = useMemo(
    () =>
      ds.data.reduce(
        (acc, d) => (d.value > acc.value ? d : acc),
        ds.data[0],
      ),
    [ds],
  );

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-6">
      <ScreenTitle
        className="lg:col-span-12"
        title="Estimasi Penghematan Energi"
        subtitle="Pantau produksi biogas harian & konversi nilai rupiah"
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
                {ds.total}
              </span>
              <span className="text-sm text-ink-2">{ds.suffix}</span>
            </p>
          </div>
          <StatusPill tone="good">Stabil</StatusPill>
        </div>

        <ProductionChart
          key={period}
          data={ds.data}
          target={ds.target}
          unit={ds.unit}
        />

        <div className="flex items-center gap-3 rounded-lg bg-info-50 p-3">
          <TrendingUp className="size-4 shrink-0 text-brand" />
          <p className="flex-1 text-[13px] font-semibold text-ink">
            Puncak produksi: {peak.label} ({peak.value} m³)
          </p>
          <span className="text-[13px] font-medium whitespace-nowrap text-muted">
            Target +40%
          </span>
        </div>
      </Card>

      <div className="flex flex-col gap-4 lg:col-span-5 lg:gap-6">
        <SavingsCard />
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
