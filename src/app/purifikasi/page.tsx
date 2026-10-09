"use client";

import Image from "next/image";
import {
  CheckCircle2,
  History,
  Leaf,
  Recycle,
  ShieldCheck,
  TriangleAlert,
  Wind,
} from "lucide-react";
import { Button } from "@/components/button";
import { Card, ProgressBar, SectionLabel, StatusBadge } from "@/components/ui";
import { useAppStore } from "@/components/app-store";
import type { FilterUnit, Tone } from "@/lib/types";
import { cn } from "@/lib/cn";

function InfoBanner({ className }: { className?: string }) {
  return (
    <Card className={cn("flex items-start gap-3 bg-info-200 p-4", className)}>
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-400 text-brand-dark">
        <Wind className="size-5" />
      </span>
      <div>
        <h2 className="text-lg font-semibold text-ink">
          Status Filter Purifikasi
        </h2>
        <p className="mt-0.5 text-sm text-ink-2">
          Purifikasi dua tahap (silika gel → karbon aktif) menjaga api biogas
          tetap biru dan bebas H₂S.
        </p>
      </div>
    </Card>
  );
}

function IllustrationCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative h-36 overflow-hidden rounded-xl card-shadow",
        className,
      )}
    >
      <Image
        src={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/filter-illustration.png`}
        alt="Ilustrasi sistem filtrasi biogas"
        fill
        sizes="(max-width: 1024px) 100vw, 40vw"
        className="object-cover"
        priority
      />
      <div className="absolute inset-0 bg-gradient-to-tr from-[#293040]/85 via-[#293040]/40 to-transparent" />
      <div className="absolute inset-x-4 bottom-3 flex items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <span className="size-3 rounded-full bg-brand-300" />
          <span className="text-[13px] font-semibold tracking-wide text-[#EDF0FF]">
            SISTEM FILTRASI AKTIF
          </span>
        </span>
        <span className="rounded-full bg-[#293040]/70 px-2.5 py-1 text-[13px] font-semibold text-[#EDF0FF] backdrop-blur">
          2 Tabung Aktif
        </span>
      </div>
    </div>
  );
}

function ScaleLabels({ scale }: { scale: string[] }) {
  return (
    <div className="mt-1.5 flex items-center justify-between px-0.5">
      {scale.map((s) => (
        <span
          key={s}
          className={cn(
            "text-[13px] font-semibold",
            s.toLowerCase().includes("waspada")
              ? "font-bold text-danger"
              : "text-ink-2",
          )}
        >
          {s}
        </span>
      ))}
    </div>
  );
}

function NoteBox({
  tone,
  title,
  body,
}: {
  tone: Tone;
  title: string;
  body: string;
}) {
  const warn = tone === "warn";
  return (
    <div className="flex items-start gap-2 rounded-lg bg-info-50 p-3">
      {warn ? (
        <TriangleAlert className="mt-0.5 size-[18px] shrink-0 text-danger" />
      ) : (
        <CheckCircle2 className="mt-0.5 size-[18px] shrink-0 text-brand" />
      )}
      <div className="min-w-0">
        <p className="text-[13px] font-semibold text-ink">{title}</p>
        <p className="mt-0.5 text-sm whitespace-pre-line text-ink-2">{body}</p>
      </div>
    </div>
  );
}

function FilterCard({
  unit,
  className,
}: {
  unit: FilterUnit;
  className?: string;
}) {
  const warn = unit.status.tone === "warn";
  return (
    <Card className={cn("flex flex-col gap-4 p-4", className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <SectionLabel>{unit.kind}</SectionLabel>
          <h3 className="mt-1 text-lg font-semibold text-ink">{unit.name}</h3>
          <p className="text-sm text-ink-2">{unit.subtitle}</p>
        </div>
        <StatusBadge tone={warn ? "warn" : "good"}>
          {unit.status.text}
        </StatusBadge>
      </div>

      <div className="flex items-end justify-between gap-3">
        <span className="text-[13px] font-semibold text-ink-2">
          Kapasitas Terserap:
        </span>
        <span className="flex items-baseline gap-1.5">
          <span className="text-[44px] leading-[44px] font-bold tracking-[-0.02em] text-ink">
            {unit.saturation}
          </span>
          <span className="text-base font-semibold text-ink-2">% Jenuh</span>
        </span>
      </div>

      <div>
        <ProgressBar
          value={unit.saturation}
          tone={warn ? "warn" : "good"}
          thresholds={unit.thresholds}
          label={`${unit.saturation}%`}
        />
        <ScaleLabels scale={unit.scale} />
      </div>

      <NoteBox
        tone={unit.noteTone}
        title={unit.noteTitle}
        body={unit.noteBody}
      />
    </Card>
  );
}

function PastLog({ className }: { className?: string }) {
  const { replacementLogs } = useAppStore();
  return (
    <Card className={cn("flex flex-col gap-2 p-4", className)}>
      <div className="flex items-start justify-between gap-3 pb-1">
        <div className="flex items-center gap-2">
          <History className="size-4 text-muted" />
          <h3 className="text-lg leading-6 font-semibold text-ink">
            Riwayat Penggantian
            <br />
            Terakhir
          </h3>
        </div>
        <span className="text-[13px] font-semibold text-muted">Tersimpan</span>
      </div>
      <div className="flex flex-col gap-2.5">
        {replacementLogs.map((log) => (
          <div key={log.id} className="flex items-center gap-3 rounded-lg bg-info-50 p-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-info-400 text-muted-2">
              <Leaf className="size-3.5" />
            </span>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-ink">{log.title}</p>
              <p className="text-sm whitespace-pre-line text-ink-2">
                {log.meta}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default function PurifikasiPage() {
  const { filters, replaceFilter } = useAppStore();
  const mostSaturated = filters.reduce(
    (acc, f) => (f.saturation > acc.saturation ? f : acc),
    filters[0],
  );

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-6">
      <h1 className="sr-only">Status Filter Purifikasi</h1>
      <InfoBanner className="lg:col-span-7" />
      <IllustrationCard className="lg:col-span-5" />

      {filters.map((unit) => (
        <FilterCard key={unit.id} unit={unit} className="lg:col-span-6" />
      ))}

      <div className="flex flex-col gap-2 lg:col-span-12 lg:max-w-xl">
        <Button
          icon={Recycle}
          onClick={() => replaceFilter(mostSaturated.id)}
          className="lg:max-w-sm"
        >
          Tandai Filter Sudah Diganti
        </Button>
        <p className="text-sm text-ink-2">
          Tekan setelah mengganti isi serbuk besi atau silika
        </p>
      </div>

      <PastLog className="lg:col-span-12 lg:max-w-xl" />

      <div className="hidden items-center gap-2 text-[13px] font-semibold text-brand lg:col-span-12 lg:flex">
        <ShieldCheck className="size-4" />
        Silika gel dapat diregenerasi; karbon aktif diganti tiap 45 hari
        siklus.
      </div>
    </div>
  );
}
