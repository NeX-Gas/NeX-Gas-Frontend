"use client";

import {
  ChevronRight,
  Languages,
  Leaf,
  Radio,
  RefreshCw,
  TrendingUp,
  User,
  Wifi,
} from "lucide-react";
import { Button } from "@/components/button";
import { Card, IconTile, SectionLabel } from "@/components/ui";
import { useAppStore } from "@/components/app-store";
import { operationalSettings } from "@/lib/mock";
import type { Language } from "@/lib/types";
import { cn } from "@/lib/cn";

const languages: { key: Language; label: string }[] = [
  { key: "id", label: "Indonesia" },
  { key: "jv", label: "Basa Jawa" },
  { key: "su", label: "Basa Sunda" },
];

function UnitCard({ className }: { className?: string }) {
  const { notify } = useAppStore();
  return (
    <Card className={cn("flex flex-col gap-4 p-4", className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <IconTile icon={Radio} tone="info" className="bg-info-200" />
          <div>
            <SectionLabel>Unit Terpasang</SectionLabel>
            <p className="text-lg font-bold text-ink">NEX-GAS Unit #01</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-info-50 px-3 py-1 text-[13px] font-semibold text-brand">
          <span className="size-2.5 rounded-full bg-brand-400" />
          Aktif
        </span>
      </div>

      <div className="flex flex-col gap-2 rounded-lg bg-info-50 p-3">
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-sm font-medium text-ink">
            <Wifi className="size-4 text-brand" />
            LoRa / Bluetooth Gateway
          </span>
          <span className="flex items-center gap-1.5 text-[13px] font-semibold text-brand">
            <Wifi className="size-3.5" />
            Sinyal Penuh
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-info-300 pt-2">
          <span className="text-[13px] font-semibold text-ink-2">
            ID Digester: ID-BDG-2023-09
          </span>
          <span className="flex items-center gap-1 text-[13px] font-bold text-ink">
            <TrendingUp className="size-3.5 text-brand-400" />
            88%
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="soft"
          size="sm"
          icon={RefreshCw}
          onClick={() => notify("Sinkronisasi gateway berhasil")}
        >
          Sinkronisasi
        </Button>
        <Button
          variant="secondary"
          size="sm"
          icon={Radio}
          onClick={() => notify("Respon gateway normal (24 ms)")}
        >
          Cek Respon
        </Button>
      </div>
    </Card>
  );
}

function ParameterSection({ className }: { className?: string }) {
  const { notify } = useAppStore();
  return (
    <section className={cn("flex flex-col gap-3", className)}>
      <SectionLabel className="px-1">Parameter Operasional</SectionLabel>
      <div className="flex flex-col gap-3">
        {operationalSettings.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => notify(`Membuka ${item.title}`)}
            className="card-shadow flex items-center gap-3 rounded-xl bg-surface p-4 text-left transition-colors hover:bg-info-50"
          >
            <IconTile icon={Radio} tone="info" size="sm" />
            <div className="min-w-0 flex-1">
              <p className="text-lg font-semibold text-ink">{item.title}</p>
              <p className="mt-0.5 text-sm text-ink-2">{item.desc}</p>
            </div>
            <span className="grid size-9 shrink-0 place-items-center rounded-lg text-ink-2">
              <ChevronRight className="size-5" />
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

function Preferences({ className }: { className?: string }) {
  const { language, setLanguage, notify } = useAppStore();
  return (
    <section className={cn("flex flex-col gap-3", className)}>
      <button
        type="button"
        onClick={() => notify("Membuka profil peternak")}
        className="card-shadow flex items-center gap-3 rounded-xl bg-surface p-4 text-left transition-colors hover:bg-info-50"
      >
        <IconTile icon={User} tone="info" size="sm" />
        <div className="min-w-0 flex-1">
          <p className="text-lg font-semibold text-ink">
            Akun & Profil Peternak
          </p>
          <p className="mt-0.5 text-sm text-ink-2">
            Kelompok Tani Sumber Makmur • Pak Sutrisno
          </p>
        </div>
        <span className="grid size-9 shrink-0 place-items-center rounded-lg text-ink-2">
          <ChevronRight className="size-5" />
        </span>
      </button>

      <Card className="flex flex-col gap-4 p-4">
        <div className="flex items-center gap-3">
          <IconTile icon={Languages} tone="info" size="sm" />
          <div>
            <p className="text-lg font-semibold text-ink">Bahasa Antarmuka</p>
            <p className="text-sm text-ink-2">Pilihan dialek pedesaan</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {languages.map((lang) => {
            const active = language === lang.key;
            return (
              <button
                key={lang.key}
                type="button"
                onClick={() => setLanguage(lang.key)}
                className={cn(
                  "h-12 rounded-lg text-[13px] font-semibold transition-colors",
                  active
                    ? "bg-brand text-white"
                    : "bg-info-100 text-ink hover:bg-info-200",
                )}
              >
                {lang.label}
              </button>
            );
          })}
        </div>
      </Card>
    </section>
  );
}

export default function PengaturanPage() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-6">
      <header className="lg:col-span-12">
        <h1 className="text-[22px] leading-7 font-semibold text-ink">
          Pengaturan &amp; Alat
        </h1>
        <p className="mt-1 text-sm text-ink-2">
          Konfigurasi telemetri IoT dan profil unit digester
        </p>
      </header>

      <UnitCard className="lg:col-span-12" />

      <ParameterSection className="lg:col-span-7" />
      <Preferences className="lg:col-span-5" />

      <footer className="mt-2 flex flex-col items-center gap-1 text-center lg:col-span-12">
        <p className="text-[13px] font-medium text-ink-2">
          NEX-GAS Mobile v1.0.0-wireframe
        </p>
        <p className="text-sm text-ink-2">
          Dibuat khusus untuk Peternak Indonesia
        </p>
        <p className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand">
          <Leaf className="size-3.5" />
          Energi Terbarukan Mandiri
        </p>
      </footer>
    </div>
  );
}
