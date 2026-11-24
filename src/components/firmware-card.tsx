"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Upload } from "lucide-react";
import { Button } from "@/components/button";
import { Card, SectionLabel, StatusPill } from "@/components/ui";
import { useAppStore } from "@/components/app-store";
import {
  fetchFirmwareLatest,
  installFirmware,
  type FirmwareManifest,
} from "@/lib/api";
import { cn } from "@/lib/cn";

export function FirmwareCard({ className }: { className?: string }) {
  const { auth, firmware, notify, canCommand } = useAppStore();
  const isAdmin = auth?.user.role === "admin";
  const [manifest, setManifest] = useState<FirmwareManifest | null>(null);
  const [current, setCurrent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isAdmin) return;
    setError(null);
    try {
      const data = await fetchFirmwareLatest();
      setManifest(data.latest);
      setCurrent(data.currentVersion);
    } catch (err) {
      setManifest(null);
      setCurrent(null);
      setError(err instanceof Error ? err.message : "Gagal memuat manifest firmware");
    }
  }, [isAdmin]);

  useEffect(() => {
    // Defer one tick so the effect body itself does not call setState.
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);

  if (!isAdmin) {
    return (
      <Card className={cn("flex flex-col gap-3 p-4", className)}>
        <SectionLabel>Firmware</SectionLabel>
        <p className="text-sm text-ink-2">
          Login sebagai admin untuk melihat dan memasang update firmware.
        </p>
      </Card>
    );
  }

  return (
    <Card className={cn("flex flex-col gap-4 p-4", className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <SectionLabel>Firmware</SectionLabel>
          <h3 className="mt-1 text-lg font-semibold text-ink">Update OTA</h3>
        </div>
        <StatusPill tone={manifest ? "good" : "warn"}>
          {manifest ? `tersedia ${manifest.version}` : "belum ada rilis"}
        </StatusPill>
      </div>

      <div className="grid gap-2 rounded-lg bg-info-50 p-3 text-[13px] text-ink-2">
        <div className="flex items-center justify-between gap-3">
          <span>Versi terpasang</span>
          <span className="font-mono font-semibold text-ink">{current ?? firmware}</span>
        </div>
        {manifest ? (
          <>
            <div className="flex items-center justify-between gap-3">
              <span>Versi tersedia</span>
              <span className="font-mono font-semibold text-ink">{manifest.version}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span>Ukuran</span>
              <span className="font-mono font-semibold text-ink">
                {(manifest.size / 1024).toFixed(1)} KB
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span>SHA-256</span>
              <span className="truncate font-mono text-[11px] text-ink" title={manifest.sha256}>
                {manifest.sha256.slice(0, 16)}…
              </span>
            </div>
            {manifest.changelog ? (
              <p className="border-t border-info-200 pt-2 text-[12px] leading-5">
                {manifest.changelog}
              </p>
            ) : null}
          </>
        ) : (
          <p className="text-[12px] leading-5">
            {error ??
              "Belum ada binary. Jalankan `npm run firmware:publish -- <file.bin> <versi>` di backend."}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          icon={RefreshCw}
          onClick={() => void load()}
        >
          Muat ulang
        </Button>
        <Button
          size="sm"
          icon={Upload}
          disabled={!manifest || !canCommand || busy}
          onClick={async () => {
            setBusy(true);
            setResult(null);
            try {
              const response = await installFirmware();
              setResult(`${response.message} (${response.verificationStatus})`);
              notify(`OTA ${response.version} dikirim ke alat`);
            } catch (err) {
              setResult(err instanceof Error ? err.message : "OTA gagal dikirim");
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? "Mengirim…" : "Update alat"}
        </Button>
      </div>

      {result ? (
        <p className="rounded-lg bg-info-200 p-3 text-[12px] font-medium text-ink">
          {result}
        </p>
      ) : null}

      <p className="text-[11px] leading-4 text-muted">
        Alat menutup valve, mengunduh binary, memverifikasi SHA-256, lalu reboot.
        Jika 3 boot gagal, firmware kembali ke partisi lama.
      </p>
    </Card>
  );
}
