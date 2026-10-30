"use client";

import { useMemo, useState } from "react";
import { Check, CheckCheck, ShieldCheck } from "lucide-react";
import { Button } from "@/components/button";
import {
  MetricRow,
  Panel,
  PanelHead,
  ScreenTitle,
  SectionLabel,
  StatusBadge,
} from "@/components/ui";
import { useAppStore } from "@/components/app-store";
import type { AppNotification, NotificationSeverity } from "@/lib/types";
import { cn } from "@/lib/cn";

type FilterKey = "semua" | "peringatan" | "info";

const severity: Record<
  NotificationSeverity,
  { badge: "warn" | "danger" | "info"; rail: string }
> = {
  waspada: { badge: "warn", rail: "bg-danger-300" },
  bahaya: { badge: "danger", rail: "bg-danger" },
  info: { badge: "info", rail: "bg-info-300" },
  jadwal: { badge: "info", rail: "bg-line" },
};

function FilterTabs({
  value,
  onChange,
  chips,
}: {
  value: FilterKey;
  onChange: (k: FilterKey) => void;
  chips: { key: FilterKey; label: string; count: number }[];
}) {
  return (
    <div
      role="group"
      aria-label="Filter notifikasi"
      className="no-scrollbar -mx-4 flex gap-0.5 overflow-x-auto border-b border-line/35 px-4 lg:mx-0 lg:px-0"
    >
      {chips.map((chip) => {
        const active = value === chip.key;
        return (
          <button
            key={chip.key}
            type="button"
            onClick={() => onChange(chip.key)}
            aria-pressed={active}
            className={cn(
              "relative flex shrink-0 items-center gap-1.5 px-3 pb-2.5 text-[12.5px] font-medium transition-colors",
              active ? "text-brand-deep" : "text-muted hover:text-ink",
            )}
          >
            {chip.label}
            <span className="font-mono text-[10.5px] tnum">{chip.count}</span>
            {active ? (
              <span className="absolute inset-x-2 -bottom-px h-0.5 bg-brand" />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

function NotificationRow({
  item,
  index,
}: {
  item: AppNotification;
  index: number;
}) {
  const { markRead, notify } = useAppStore();
  const cfg = severity[item.severity];

  return (
    <li
      className={cn(
        "relative py-3.5 pr-4 pl-4",
        index > 0 && "border-t border-line/30",
      )}
    >
      <span
        className={cn("absolute inset-y-0 left-0 w-[3px]", cfg.rail)}
        aria-hidden="true"
      />

      <div className="flex items-center gap-2.5">
        <StatusBadge tone={cfg.badge}>{item.badge}</StatusBadge>
        <span className="font-mono text-[10.5px] text-muted">{item.time}</span>
        {item.unread ? (
          <span
            className="size-1.5 rounded-[1px] bg-brand"
            aria-label="Belum dibaca"
          />
        ) : null}
      </div>

      <h3 className="mt-1.5 text-[14px] leading-5 font-semibold text-ink">
        {item.title}
      </h3>
      <p className="mt-1 text-[12.5px] leading-5 text-ink-2">
        {item.body}
      </p>

      <div className="mt-2 flex items-center gap-3">
        {item.action ? (
          <button
            type="button"
            onClick={() => {
              markRead(item.id);
              notify(`Membuka: ${item.action}`);
            }}
            className="text-[11.5px] font-medium text-brand underline decoration-brand/30 underline-offset-[3px] transition-colors hover:text-brand-deep"
          >
            {item.action}
          </button>
        ) : null}
        {item.unread ? (
          <button
            type="button"
            onClick={() => markRead(item.id)}
            className="ml-auto inline-flex items-center gap-1 text-[11px] text-muted transition-colors hover:text-ink-2"
          >
            <Check className="size-3" strokeWidth={2} />
            tandai dibaca
          </button>
        ) : null}
      </div>
    </li>
  );
}

export default function NotifikasiPage() {
  const {
    notifications,
    unreadCount,
    criticalCount,
    markAllRead,
    link,
  } = useAppStore();
  const [filter, setFilter] = useState<FilterKey>("semua");

  const infoCount = notifications.filter((n) => n.category === "info").length;

  const filtered = useMemo(() => {
    if (filter === "semua") return notifications;
    return notifications.filter((n) => n.category === filter);
  }, [filter, notifications]);

  const bySeverity = useMemo(() => {
    const counts: Record<NotificationSeverity, number> = {
      bahaya: 0,
      waspada: 0,
      info: 0,
      jadwal: 0,
    };
    notifications.forEach((n) => {
      counts[n.severity] += 1;
    });
    return counts;
  }, [notifications]);

  const chips: { key: FilterKey; label: string; count: number }[] = [
    { key: "semua", label: "Semua", count: notifications.length },
    { key: "peringatan", label: "Peringatan", count: criticalCount },
    { key: "info", label: "Info", count: infoCount },
  ];

  return (
    <div className="flex flex-col gap-4 lg:gap-5">
      <ScreenTitle
        title="Notifikasi"
        subtitle={
          criticalCount > 0
            ? `${criticalCount} peringatan penting memerlukan tindakan`
            : "Tidak ada peringatan yang belum ditangani"
        }
        actions={
          <Button
            variant="secondary"
            size="sm"
            icon={CheckCheck}
            disabled={unreadCount === 0}
            onClick={markAllRead}
          >
            Tandai dibaca
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-5">
        <div className="lg:col-span-8">
          <FilterTabs value={filter} onChange={setFilter} chips={chips} />

          <Panel className="mt-3 overflow-hidden">
            <ul>
              {filtered.map((item, i) => (
                <NotificationRow key={item.id} item={item} index={i} />
              ))}
            </ul>
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
                <ShieldCheck className="size-6 text-brand" strokeWidth={1.5} />
                <p className="text-[13px] font-medium text-ink">
                  Tidak ada notifikasi
                </p>
                <p className="text-[12px] text-muted">
                  Semua sistem berjalan normal di kategori ini.
                </p>
              </div>
            ) : null}
          </Panel>
        </div>

        <div className="flex flex-col gap-4 lg:col-span-4">
          <Panel>
            <PanelHead label="Ringkasan" title="Kondisi Sistem" />
            <div className="px-4 pb-2">
              <MetricRow label="Bahaya" value={bySeverity.bahaya} tone={bySeverity.bahaya > 0 ? "danger" : "muted"} />
              <MetricRow label="Waspada" value={bySeverity.waspada} tone={bySeverity.waspada > 0 ? "danger" : "muted"} />
              <MetricRow label="Info" value={bySeverity.info} />
              <MetricRow label="Jadwal" value={bySeverity.jadwal} />
              <MetricRow label="Belum dibaca" value={unreadCount} tone={unreadCount > 0 ? "brand" : "muted"} />
            </div>
            <p className="border-t border-line/35 px-4 py-2.5 font-mono text-[10px] leading-4 text-muted">
              sumber: {link === "live" ? "firmware via backend" : "simulator lokal"}
              {" · "}tersimpan di perangkat ini
            </p>
          </Panel>

          <Panel className="p-4">
            <SectionLabel>Tentang kanal ini</SectionLabel>
            <p className="mt-1.5 text-[12px] leading-5 text-ink-2">
              {link === "live"
                ? "Peristiwa dari firmware (boot, kebocoran, penampung penuh, filter jenuh) masuk ke daftar ini secara otomatis."
                : "Dashboard masih memakai simulator. Notifikasi di sini adalah contoh dan tidak berasal dari alat."}
            </p>
          </Panel>
        </div>
      </div>
    </div>
  );
}
