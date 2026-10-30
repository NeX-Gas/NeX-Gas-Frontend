"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  BookOpen,
  CalendarClock,
  CheckCheck,
  Gauge,
  MoreVertical,
  ShieldCheck,
  Siren,
  TriangleAlert,
} from "lucide-react";
import { Button } from "@/components/button";
import { Card, StatusBadge } from "@/components/ui";
import { useAppStore } from "@/components/app-store";
import type { AppNotification, NotificationSeverity } from "@/lib/types";
import { cn } from "@/lib/cn";

type FilterKey = "semua" | "peringatan" | "info";

const severity: Record<
  NotificationSeverity,
  {
    badge: "warn" | "danger" | "info";
    iconBg: string;
    iconColor: string;
    Icon: typeof TriangleAlert;
  }
> = {
  waspada: {
    badge: "warn",
    iconBg: "bg-danger-200",
    iconColor: "text-danger",
    Icon: TriangleAlert,
  },
  bahaya: {
    badge: "danger",
    iconBg: "bg-danger-400",
    iconColor: "text-danger-800",
    Icon: Siren,
  },
  info: {
    badge: "info",
    iconBg: "bg-info-400",
    iconColor: "text-brand",
    Icon: Gauge,
  },
  jadwal: {
    badge: "info",
    iconBg: "bg-info-400",
    iconColor: "text-muted-2",
    Icon: CalendarClock,
  },
};

function DiagnosticBanner({ className }: { className?: string }) {
  return (
    <Card className={cn("flex items-start gap-3 bg-info-200 p-4", className)}>
      <Activity className="mt-0.5 size-5 shrink-0 text-brand" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-[15px] font-semibold text-ink">
            Pengecekan Rutin Sensor
          </h3>
          <span className="text-[13px] font-semibold text-brand">Aktif</span>
        </div>
        <p className="mt-1 text-sm text-ink-2">
          Semua 4 unit pemantau bio-digester tersambung via telemetry nirkabel.
        </p>
      </div>
    </Card>
  );
}

function NotificationCard({ item }: { item: AppNotification }) {
  const { markRead, notify } = useAppStore();
  const cfg = severity[item.severity];
  const Icon = cfg.Icon;

  return (
    <Card className="animate-fade-up relative flex flex-col gap-3 p-4">
      {item.unread ? (
        <span className="absolute top-4 right-4 size-3 rounded-full bg-brand" />
      ) : null}

      <div className="flex gap-3">
        <span
          className={cn(
            "grid size-12 shrink-0 place-items-center rounded-xl",
            cfg.iconBg,
            cfg.iconColor,
          )}
        >
          <Icon className="size-6" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <StatusBadge tone={cfg.badge}>{item.badge}</StatusBadge>
            <span className="text-[13px] font-semibold text-ink-2">
              {item.time}
            </span>
          </div>
          <h3 className="mt-1.5 text-lg leading-[1.35] font-semibold whitespace-pre-line text-ink">
            {item.title}
          </h3>
          <p className="mt-1 text-sm leading-[1.6] whitespace-pre-line text-ink-2">
            {item.body}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 pt-1">
        <Button
          variant="soft"
          size="sm"
          icon={BookOpen}
          onClick={() => {
            markRead(item.id);
            notify(`Membuka: ${item.action}`);
          }}
        >
          {item.action}
        </Button>
        <button
          type="button"
          onClick={() => markRead(item.id)}
          aria-label="Tandai dibaca"
          className="grid size-10 place-items-center rounded-lg text-ink-2 hover:bg-info-100"
        >
          <MoreVertical className="size-5" />
        </button>
      </div>
    </Card>
  );
}

export default function NotifikasiPage() {
  const { notifications, unreadCount, criticalCount, markAllRead } =
    useAppStore();
  const [filter, setFilter] = useState<FilterKey>("semua");

  const infoCount = notifications.filter((n) => n.category === "info").length;

  const filtered = useMemo(() => {
    if (filter === "semua") return notifications;
    return notifications.filter((n) => n.category === filter);
  }, [filter, notifications]);

  const chips: { key: FilterKey; label: string; count: number }[] = [
    { key: "semua", label: "Semua", count: notifications.length },
    { key: "peringatan", label: "Peringatan Penting", count: criticalCount },
    { key: "info", label: "Info Operasional", count: infoCount },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-6">
      <div className="flex items-start justify-between gap-3 lg:col-span-12">
        <div>
          <h1 className="text-[22px] leading-7 font-semibold tracking-[-0.02em] text-ink">
            Notifikasi Sistem
          </h1>
          <p className="mt-1 max-w-xs text-sm text-ink-2">
            {criticalCount} peringatan penting memerlukan tindakan
          </p>
        </div>
        <Button
          variant="soft"
          size="sm"
          icon={CheckCheck}
          disabled={unreadCount === 0}
          onClick={markAllRead}
          className="shrink-0"
        >
          Tandai Dibaca
        </Button>
      </div>

      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 lg:col-span-12 lg:mx-0 lg:px-0">
        {chips.map((chip) => {
          const active = filter === chip.key;
          const danger = chip.key === "peringatan";
          return (
            <button
              key={chip.key}
              type="button"
              onClick={() => setFilter(chip.key)}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-semibold transition-colors",
                active
                  ? "bg-brand text-white"
                  : "bg-info-200 text-ink-2 hover:bg-info-300",
              )}
            >
              {chip.label}
              <span
                className={cn(
                  "grid min-w-5 place-items-center rounded-full px-1.5 py-0.5 text-[11px] font-bold",
                  active
                    ? "bg-white text-brand"
                    : danger
                      ? "bg-danger-400 text-danger-800"
                      : "bg-info-400 text-ink-2",
                )}
              >
                {chip.count}
              </span>
            </button>
          );
        })}
      </div>

      <DiagnosticBanner className="lg:col-span-12" />

      <div className="grid grid-cols-1 gap-3 lg:col-span-12 lg:grid-cols-2">
        {filtered.map((item) => (
          <NotificationCard key={item.id} item={item} />
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 p-8 text-center lg:col-span-12">
          <ShieldCheck className="size-8 text-brand" />
          <p className="font-semibold text-ink">Tidak ada notifikasi</p>
          <p className="text-sm text-ink-2">
            Semua sistem berjalan normal di kategori ini.
          </p>
        </Card>
      ) : null}
    </div>
  );
}
