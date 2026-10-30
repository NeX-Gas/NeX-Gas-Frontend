"use client";

import { Languages, User } from "lucide-react";
import {
  MetricRow,
  Panel,
  PanelHead,
  ScreenTitle,
  SectionLabel,
  StatusPill,
} from "@/components/ui";
import { useAppStore } from "@/components/app-store";
import { CalibrationPanel, DeviceStatusCard } from "@/components/device-panel";
import { THRESHOLDS } from "@/lib/system";
import type { Language } from "@/lib/types";
import { cn } from "@/lib/cn";

const languages: { key: Language; label: string }[] = [
  { key: "id", label: "Indonesia" },
  { key: "jv", label: "Basa Jawa" },
  { key: "su", label: "Basa Sunda" },
];

function ThresholdPanel({ className }: { className?: string }) {
  return (
    <Panel className={cn("flex flex-col", className)}>
      <PanelHead
        label="Parameter"
        title="Ambang Notifikasi"
        right={
          <span className="font-mono text-[10.5px] text-muted">firmware</span>
        }
      />
      <div className="px-4 py-1">
        <MetricRow
          label="H₂S · peringatan / bahaya"
          value={`${THRESHOLDS.h2sWarn} / ${THRESHOLDS.h2sDanger}`}
          unit="ppm"
        />
        <MetricRow
          label="Metana bocor · waspada / bahaya"
          value={`${THRESHOLDS.leakWarn} / ${THRESHOLDS.leakDanger}`}
          unit="ppm"
        />
        <MetricRow
          label="Valve · buka / tutup"
          value={`${THRESHOLDS.valveOpenAt.toFixed(1)} / ${THRESHOLDS.valveCloseAt.toFixed(1)}`}
          unit="kPa"
        />
        <MetricRow
          label="Penampung penuh"
          value={THRESHOLDS.collectorFullAt.toFixed(1)}
          unit="kPa"
        />
        <MetricRow
          label="Δ tekanan minimum"
          value={THRESHOLDS.minDeltaPressure.toFixed(2)}
          unit="kPa"
        />
        <MetricRow
          label="Suhu mesofilik"
          value={`${THRESHOLDS.tempMin}–${THRESHOLDS.tempMax}`}
          unit="°C"
        />
        <MetricRow label="RH maksimum" value={THRESHOLDS.humidityMax} unit="%" />
      </div>
      <p className="border-t border-line/35 px-4 py-2.5 text-[10.5px] leading-4 text-muted">
        Nilai ini identik dengan <span className="font-mono">struct Thresholds</span>{" "}
        di firmware. Ubah di kedua sisi kalau mau berbeda.
      </p>
    </Panel>
  );
}

function Preferences({ className }: { className?: string }) {
  const { language, setLanguage, notify } = useAppStore();

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <Panel className="overflow-hidden">
        <button
          type="button"
          onClick={() => notify("Membuka profil peternak")}
          className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-info-50/70"
        >
          <User className="size-4 shrink-0 text-muted" strokeWidth={1.75} />
          <div className="min-w-0 flex-1">
            <p className="text-[12.5px] leading-5 font-medium text-ink">
              Akun & Profil Peternak
            </p>
            <p className="text-[11px] leading-4 text-muted">
              Kelompok Tani Sumber Makmur · Pak Sutrisno
            </p>
          </div>
          <span className="font-mono text-[10.5px] text-muted">ubah</span>
        </button>
      </Panel>

      <Panel className="flex flex-col">
        <PanelHead
          label="Antarmuka"
          title="Bahasa"
          right={
            <Languages className="size-4 text-muted" strokeWidth={1.75} />
          }
        />
        <div className="p-4">
          <div
            role="group"
            aria-label="Bahasa antarmuka"
            className="flex gap-0.5 rounded-[4px] bg-info-100 p-0.5"
          >
            {languages.map((lang) => {
              const active = language === lang.key;
              return (
                <button
                  key={lang.key}
                  type="button"
                  onClick={() => setLanguage(lang.key)}
                  aria-pressed={active}
                  className={cn(
                    "h-8 flex-1 rounded-[3px] text-[11.5px] font-medium transition-colors",
                    active
                      ? "border border-line/50 bg-surface text-brand-deep"
                      : "text-ink-2 hover:text-ink",
                  )}
                >
                  {lang.label}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-[10.5px] leading-4 text-muted">
            Tersimpan di perangkat ini. Isi halaman belum diterjemahkan.
          </p>
        </div>
      </Panel>
    </div>
  );
}

function UnitFacts({ className }: { className?: string }) {
  const { notify } = useAppStore();
  const facts = [
    { label: "Tipe", value: "Kubah tetap" },
    { label: "Kapasitas", value: "6 m³" },
    { label: "Dibangun", value: "Des 2023" },
    { label: "Lokasi", value: "Kandang Sapi Barat" },
  ];

  return (
    <Panel className={cn("flex flex-col overflow-hidden", className)}>
      <PanelHead
        label="Instalasi"
        title="Info Digester"
        right={<StatusPill tone="good">Aktif</StatusPill>}
      />
      <div className="grid grid-cols-2 gap-px bg-line/30 sm:grid-cols-4">
        {facts.map((fact) => (
          <div key={fact.label} className="bg-surface px-4 py-3">
            <SectionLabel>{fact.label}</SectionLabel>
            <p className="mt-1 font-mono text-[13px] leading-5 text-ink tnum">
              {fact.value}
            </p>
          </div>
        ))}
      </div>
      <div className="border-t border-line/35 px-4 py-2">
        <button
          type="button"
          onClick={() => notify("Membuka catatan instalasi")}
          className="text-left font-mono text-[10px] leading-4 text-muted underline decoration-line underline-offset-4 hover:text-ink-2"
        >
          data instalasi masih statis — belum ada endpoint backend
        </button>
      </div>
    </Panel>
  );
}

export default function PengaturanPage() {
  return (
    <div className="flex flex-col gap-4 lg:gap-5">
      <ScreenTitle
        title="Pengaturan & Alat"
        subtitle="Status perangkat, kalibrasi sensor, dan ambang batas"
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-5">
        <DeviceStatusCard className="lg:col-span-12" />

        <CalibrationPanel className="lg:col-span-7" />

        <div className="flex flex-col gap-4 lg:col-span-5">
          <Preferences />
          <ThresholdPanel />
        </div>

        <UnitFacts className="lg:col-span-12" />
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-line/35 pt-3">
        <p className="font-mono text-[10.5px] text-muted">
          NEX-GAS v1.0.0 · dibuat untuk peternak Indonesia
        </p>
        <p className="font-mono text-[10.5px] text-muted">
          energi terbarukan mandiri
        </p>
      </footer>
    </div>
  );
}
