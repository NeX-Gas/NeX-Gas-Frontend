"use client";

import { useState } from "react";
import { Lock, ShieldCheck, ShieldOff } from "lucide-react";
import { Button } from "@/components/button";
import { Card, SectionLabel, StatusPill } from "@/components/ui";
import { useAppStore } from "@/components/app-store";
import { postDeviceConfig } from "@/lib/api";
import { cn } from "@/lib/cn";

export function SecurityCard({ className }: { className?: string }) {
  const { auth, authCmd, authMsgs, canCommand, notify } = useAppStore();
  const isAdmin = auth?.user.role === "admin";
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const apply = async (enabled: boolean) => {
    setBusy(true);
    setResult(null);
    try {
      const response = await postDeviceConfig({
        security: { authCmd: enabled, authMsgs: enabled },
      });
      const message = response.ack
        ? `Alat mengonfirmasi: authCmd=${enabled}, authMsgs=${enabled}`
        : "Perintah terkirim, tetapi alat belum mengonfirmasi (ACK timeout).";
      setResult(message);
      notify(message);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Gagal mengubah keamanan";
      setResult(message);
      notify(message);
    } finally {
      setBusy(false);
    }
  };

  if (!isAdmin) {
    return (
      <Card className={cn("flex flex-col gap-3 p-4", className)}>
        <SectionLabel>Keamanan perintah</SectionLabel>
        <p className="text-sm text-ink-2">
          Login sebagai admin untuk mengubah mode tanda tangan perintah.
        </p>
      </Card>
    );
  }

  return (
    <Card className={cn("flex flex-col gap-4 p-4", className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <SectionLabel>Keamanan perintah</SectionLabel>
          <h3 className="mt-1 text-lg font-semibold text-ink">Tanda tangan HMAC</h3>
        </div>
        <StatusPill tone={authCmd && authMsgs ? "good" : "warn"}>
          {authCmd && authMsgs ? "aktif" : "belum aktif"}
        </StatusPill>
      </div>

      <div className="flex flex-wrap gap-2">
        <StatusPill tone={authCmd ? "good" : "warn"}>
          perintah {authCmd ? "ditandatangani" : "polos"}
        </StatusPill>
        <StatusPill tone={authMsgs ? "good" : "warn"}>
          pesan alat {authMsgs ? "ditandatangani" : "polos"}
        </StatusPill>
      </div>

      <p className="rounded-lg bg-info-50 p-3 text-[12px] leading-5 text-ink-2">
        Aktifkan hanya setelah backend baru terpasang dan <code>DEVICE_TOKEN</code>{" "}
        diisi dengan kunci yang sama dari{" "}
        <code>NeX-Gas-Firmware/secrets.h</code>. Setelah aktif, perintah tanpa
        tanda tangan ditolak dan telemetri palsu tidak diterima.
      </p>

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          icon={ShieldCheck}
          disabled={!canCommand || busy || (authCmd && authMsgs)}
          onClick={() => void apply(true)}
        >
          {busy ? "Mengirim…" : "Aktifkan keduanya"}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          icon={ShieldOff}
          disabled={!canCommand || busy || (!authCmd && !authMsgs)}
          onClick={() => void apply(false)}
        >
          Matikan
        </Button>
      </div>

      {result ? (
        <p className="rounded-lg bg-info-200 p-3 text-[12px] font-medium text-ink">
          {result}
        </p>
      ) : null}

      <p className="flex items-start gap-2 text-[11px] leading-4 text-muted">
        <Lock className="mt-0.5 size-3.5 shrink-0" />
        Kunci HMAC tidak pernah dikirim lewat MQTT. Broker publik hanya melihat
        tanda tangan, bukan kuncinya.
      </p>
    </Card>
  );
}
