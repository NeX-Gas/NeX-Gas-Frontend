"use client";

import { Card, SectionLabel, StatusPill } from "@/components/ui";
import { useAppStore } from "@/components/app-store";
import { relativeTime } from "@/lib/format";
import { cn } from "@/lib/cn";

const linkLabel = {
  live: "Live (alat)",
  demo: "Mode demo",
  connecting: "Menghubungkan…",
  offline: "Backend offline",
} as const;

function Row({
  label,
  value,
  tone,
}: {
  label: string;
  value: React.ReactNode;
  tone?: "good" | "warn" | "neutral";
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[12px] text-ink-2">{label}</span>
      <span
        className={cn(
          "text-[12px] font-semibold",
          tone === "warn"
            ? "text-danger"
            : tone === "good"
              ? "text-brand"
              : "text-ink",
        )}
      >
        {value}
      </span>
    </div>
  );
}

export function DeviceStatusCard({ className }: { className?: string }) {
  const {
    link,
    deviceOnline,
    deviceId,
    firmware,
    rssi,
    buffered,
    lastSeen,
    sensorsReady,
    pressureCalibrated,
    phCalibrated,
  } = useAppStore();

  const linkTone =
    link === "live" && deviceOnline
      ? "good"
      : link === "demo"
        ? "neutral"
        : "warn";

  return (
    <Card className={cn("flex flex-col gap-4 p-4", className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <SectionLabel>Status Alat</SectionLabel>
          <h3 className="mt-1 text-lg font-semibold text-ink">{deviceId}</h3>
        </div>
        <StatusPill tone={linkTone}>{linkLabel[link]}</StatusPill>
      </div>

      <div className="flex flex-col gap-1.5 rounded-lg bg-info-50 p-3">
        <Row
          label="Sinyal WiFi"
          value={rssi === 0 ? "tidak tersedia" : `${rssi} dBm`}
          tone={rssi === 0 ? "warn" : rssi > -70 ? "good" : "warn"}
        />
        <Row
          label="Sensor siap"
          value={sensorsReady ? "ya" : "pemanasan / gagal baca"}
          tone={sensorsReady ? "good" : "warn"}
        />
        <Row
          label="Kalibrasi tekanan"
          value={pressureCalibrated ? "terkalibrasi" : "belum"}
          tone={pressureCalibrated ? "good" : "warn"}
        />
        <Row
          label="Kalibrasi pH"
          value={phCalibrated ? "terkalibrasi" : "belum"}
          tone={phCalibrated ? "good" : "warn"}
        />
        <Row
          label="Buffer offline"
          value={buffered > 0 ? `${buffered} sampel` : "kosong"}
          tone={buffered > 0 ? "warn" : "good"}
        />
        <Row label="Firmware" value={firmware} />
        <Row label="Data terakhir" value={relativeTime(lastSeen)} />
      </div>
    </Card>
  );
}
