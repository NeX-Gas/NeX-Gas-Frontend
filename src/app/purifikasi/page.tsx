"use client";

import { CheckCircle2, Leaf, Recycle, TriangleAlert } from "lucide-react";
import { Button } from "@/components/button";
import {
  MetricRow,
  Panel,
  PanelHead,
  ProgressBar,
  Readout,
  ScreenTitle,
  StatusBadge,
  StatusPill,
} from "@/components/ui";
import { useAppStore } from "@/components/app-store";
import { fmtValue } from "@/lib/format";
import { THRESHOLDS } from "@/lib/system";
import type { FilterUnit, ScaleTick, Tone } from "@/lib/types";
import { cn } from "@/lib/cn";

function ScaleLabels({ scale }: { scale: ScaleTick[] }) {
  const last = scale.length - 1;
  return (
    <div className="relative mt-1.5 h-6">
      {scale.map((tick, i) => (
        <span
          key={tick.at}
          className={cn(
            "absolute top-0 flex flex-col gap-1",
            i === 0
              ? "items-start"
              : i === last
                ? "-translate-x-full items-end"
                : "-translate-x-1/2 items-center",
          )}
          style={{ left: `${tick.at}%` }}
        >
          <span
            className={cn(
              "font-mono text-[9.5px] leading-none tnum",
              tick.tone === "warn" ? "font-semibold text-danger" : "text-ink-2",
            )}
          >
            {tick.label}
          </span>
          {tick.caption ? (
            <span className="text-[8.5px] leading-none tracking-[0.07em] text-muted uppercase">
              {tick.caption}
            </span>
          ) : null}
        </span>
      ))}
    </div>
  );
}

function NoteBox({
  tone,
  title,
  body,
  className,
}: {
  tone: Tone;
  title: string;
  body: string;
  className?: string;
}) {
  const warn = tone === "warn";
  return (
    <div className={cn("inset flex items-start gap-2 px-3 py-2.5", className)}>
      {warn ? (
        <TriangleAlert className="mt-px size-3.5 shrink-0 text-danger" strokeWidth={1.75} />
      ) : (
        <CheckCircle2 className="mt-px size-3.5 shrink-0 text-brand" strokeWidth={1.75} />
      )}
      <div className="min-w-0">
        <p className="text-[12px] leading-4 font-medium text-ink">{title}</p>
        <p className="mt-0.5 text-[11px] leading-4 whitespace-pre-line text-muted">
          {body}
        </p>
      </div>
    </div>
  );
}

function FilterPanel({ unit, className }: { unit: FilterUnit; className?: string }) {
  const warn = unit.status.tone === "warn";

  return (
    <Panel className={cn("flex flex-col", className)}>
      <PanelHead
        label={unit.kind}
        title={unit.name}
        right={
          <StatusBadge tone={warn ? "warn" : "good"}>
            {unit.status.text}
          </StatusBadge>
        }
      />

      <div className="flex flex-1 flex-col gap-3 p-4">
        <p className="text-[11.5px] leading-4 text-muted">{unit.subtitle}</p>

        <div className="flex items-baseline justify-between">
          <span className="text-[12px] text-ink-2">Kapasitas terserap</span>
          <Readout value={unit.saturation} unit="% jenuh" size="lg" />
        </div>

        <div>
          <ProgressBar
            value={unit.saturation}
            tone={warn ? "warn" : "good"}
            thresholds={unit.thresholds}
            className="h-2"
          />
          <ScaleLabels scale={unit.scale} />
        </div>

        <NoteBox
          tone={unit.noteTone}
          title={unit.noteTitle}
          body={unit.noteBody}
          className="mt-auto"
        />
      </div>
    </Panel>
  );
}

function FlowPanel({
  units,
  className,
}: {
  units: FilterUnit[];
  className?: string;
}) {
  const [silica, carbon] = units;
  const { telemetry, filterWarning } = useAppStore();
  const outletTone = filterWarning ? "danger" : "ink";

  return (
    <Panel className={cn("flex flex-col", className)}>
      <PanelHead
        label="Alur Gas"
        title="Jalur Purifikasi"
        right={
          <StatusPill tone={filterWarning ? "warn" : "good"}>
            {filterWarning ? "H₂S lolos" : "Siap bakar"}
          </StatusPill>
        }
      />

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <div className="flex items-baseline justify-between">
            <span className="text-[12px] text-ink-2">H₂S keluar karbon</span>
            <span className="font-mono text-[10px] text-muted tnum">
              ambang &lt; {THRESHOLDS.h2sWarn} ppm
            </span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <Readout
              value={fmtValue(telemetry.h2sAfter, 1)}
              unit="ppm"
              size="lg"
              tone={outletTone}
            />
            <span className="font-mono text-[10.5px] text-muted">
              MQ-136 outlet
            </span>
          </div>
        </div>

        <div className="inset px-3">
          <MetricRow
            label="01 · Digester → Silika"
            hint="uap air"
            value={silica.saturation}
            unit="%"
            tone={silica.saturation >= 80 ? "danger" : "ink"}
          />
          <MetricRow
            label="02 · Silika → Karbon"
            hint="H₂S"
            value={carbon.saturation}
            unit="%"
            tone={carbon.saturation >= 80 ? "danger" : "ink"}
          />
        </div>

        <p className="mt-auto font-mono text-[10px] leading-4 text-muted">
          silika dapat diregenerasi · karbon aktif diganti tiap 45 hari
        </p>
      </div>
    </Panel>
  );
}

function ReplacementHistory({ className }: { className?: string }) {
  const { replacementLogs } = useAppStore();
  return (
    <Panel className={cn("flex flex-col", className)}>
      <PanelHead
        label="Riwayat"
        title="Penggantian Terakhir"
        right={
          <span className="font-mono text-[10.5px] text-muted">lokal</span>
        }
      />
      <ul className="flex-1">
        {replacementLogs.map((log, i) => (
          <li
            key={log.id}
            className={cn(
              "flex items-start gap-3 px-4 py-3",
              i > 0 && "border-t border-line/30",
            )}
          >
            <Leaf className="mt-0.5 size-3.5 shrink-0 text-brand" strokeWidth={1.75} />
            <div className="min-w-0">
              <p className="text-[12.5px] leading-5 font-medium text-ink">
                {log.title}
              </p>
              <p className="font-mono text-[10.5px] leading-4 whitespace-pre-line text-muted">
                {log.meta}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

export default function PurifikasiPage() {
  const { filters, replaceFilter, filterHealth, filterWarning, telemetry } =
    useAppStore();

  const units = filters.map((unit) =>
    unit.id === "carbon-active"
      ? {
          ...unit,
          saturation: Math.max(0, Math.min(100, Math.round(100 - filterHealth))),
          status: filterWarning
            ? { text: "Jenuh", tone: "warn" as Tone }
            : { text: "Aman", tone: "good" as Tone },
          noteTitle: filterWarning ? "H₂S menembus filter" : "Media masih aktif",
          noteBody: filterWarning
            ? `H₂S sesudah filter ${telemetry.h2sAfter.toFixed(1)} ppm — ganti karbon aktif.`
            : "H₂S sesudah filter masih di bawah ambang aman.",
          noteTone: filterWarning ? ("warn" as Tone) : ("good" as Tone),
        }
      : unit,
  );

  const mostSaturated = units.reduce(
    (acc, f) => (f.saturation > acc.saturation ? f : acc),
    units[0],
  );

  return (
    <div className="flex flex-col gap-4 lg:gap-5">
      <ScreenTitle
        title="Purifikasi"
        subtitle="Dua tahap: silika gel menahan uap air, karbon aktif menyerap H₂S"
        actions={
          <Button
            variant="secondary"
            size="sm"
            icon={Recycle}
            onClick={() => replaceFilter(mostSaturated.id)}
          >
            Tandai diganti
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-5">
        {units.map((unit) => (
          <FilterPanel key={unit.id} unit={unit} className="lg:col-span-6" />
        ))}

        <FlowPanel units={units} className="lg:col-span-5" />
        <ReplacementHistory className="lg:col-span-7 lg:self-start" />

        <div className="flex flex-col gap-2 lg:col-span-12">
          <p className="text-[11.5px] leading-5 text-muted">
            Serbuk besi di dalam tabung silika dapat diregenerasi dengan
            penjemuran. Karbon aktif diganti tiap 45 hari siklus.
          </p>
        </div>
      </div>
    </div>
  );
}
