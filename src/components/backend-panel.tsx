"use client";

import { useState } from "react";
import {
  CheckCircle2,
  LogIn,
  LogOut,
  PlugZap,
  RefreshCw,
  ServerCog,
  ShieldAlert,
  TriangleAlert,
} from "lucide-react";
import { Button } from "@/components/button";
import { Card, SectionLabel, StatusPill } from "@/components/ui";
import { useAppStore } from "@/components/app-store";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/cn";

/** URL panjang dipotong biar tidak merusak layout. */
function shortUrl(url: string): string {
  if (!url) return "belum diset";
  return url.replace(/^https?:\/\//, "").replace(/^wss?:\/\//, "…");
}

function Row({
  label,
  value,
  tone = "neutral",
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
          "max-w-[60%] truncate text-right text-[12px] font-semibold",
          tone === "warn"
            ? "text-danger"
            : tone === "good"
              ? "text-brand"
              : "text-ink",
        )}
        title={typeof value === "string" ? value : undefined}
      >
        {value}
      </span>
    </div>
  );
}

const roleLabel = {
  admin: "admin — semua aksi",
  operator: "operator — boleh kirim perintah",
  viewer: "viewer — hanya lihat data",
} as const;

export function BackendPanel({ className }: { className?: string }) {
  const {
    link,
    lastError,
    auth,
    apiConfigured,
    apiUrl,
    wsUrl,
    backendDeviceId,
    login,
    logout,
    refreshFromBackend,
  } = useAppStore();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setFormError(null);
    try {
      await login(username.trim(), password);
      setPassword("");
    } catch (error) {
      setFormError(
        error instanceof ApiError ? error.message : "Login backend gagal.",
      );
    } finally {
      setBusy(false);
    }
  };

  const linkTone = link === "live" ? "good" : link === "demo" ? "neutral" : "warn";
  const linkText =
    link === "live"
      ? "WebSocket tersambung"
      : link === "demo"
        ? "Mode demo (tanpa backend)"
        : link === "connecting"
          ? "Menghubungkan…"
          : "WebSocket terputus";

  return (
    <Card className={cn("flex flex-col gap-4 p-4", className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <SectionLabel>Koneksi Backend</SectionLabel>
          <h3 className="mt-1 text-lg font-semibold text-ink">
            {auth ? "Sesi aktif" : "Belum login"}
          </h3>
        </div>
        <StatusPill tone={linkTone}>{linkText}</StatusPill>
      </div>

      <div className="flex flex-col gap-1.5 rounded-lg bg-info-50 p-3">
        <Row
          label="WebSocket"
          value={shortUrl(wsUrl)}
          tone={wsUrl ? "good" : "warn"}
        />
        <Row
          label="REST API"
          value={shortUrl(apiUrl)}
          tone={apiConfigured ? "good" : "warn"}
        />
        <Row label="Device ID" value={backendDeviceId} />
        <Row
          label="Sesi"
          value={auth ? `${auth.user.username} · ${auth.user.role}` : "belum login"}
          tone={auth ? "good" : "warn"}
        />
      </div>

      {!apiConfigured ? (
        <p className="rounded-lg bg-info-100 p-3 text-[12px] leading-4 text-ink-2">
          Isi <code className="font-semibold">NEXT_PUBLIC_API_URL</code> (mis.
          <code className="font-semibold"> https://api.nex-gas.id</code>) dan{" "}
          <code className="font-semibold">NEXT_PUBLIC_WS_URL</code> di environment
          Vercel, lalu redeploy. Tanpa itu dashboard tetap jalan dengan simulator
          lokal dan perintah tidak bisa dikirim.
        </p>
      ) : null}

      {auth ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-2 rounded-lg bg-info-50 p-3">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand" />
            <div className="text-[12px] leading-4 text-ink-2">
              <p className="font-semibold text-ink">
                {auth.user.username} ({auth.user.role})
              </p>
              <p>{roleLabel[auth.user.role]}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={RefreshCw}
              onClick={refreshFromBackend}
            >
              Muat ulang data
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={LogOut}
              onClick={() => {
                void logout();
              }}
            >
              Keluar
            </Button>
          </div>
        </div>
      ) : (
        <form className="flex flex-col gap-2" onSubmit={submit}>
          <p className="text-[12px] leading-4 text-ink-2">
            Data live masuk lewat WebSocket tanpa login. Login dibutuhkan hanya
            untuk riwayat &amp; perintah ke alat (role operator/admin).
          </p>
          <label className="flex flex-col gap-1">
            <span className="text-[12px] font-semibold text-ink-2">Username</span>
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              required
              className="h-11 rounded-lg border border-info-100 bg-canvas px-3 text-[14px] text-ink outline-none focus:border-brand-300"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[12px] font-semibold text-ink-2">Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
              className="h-11 rounded-lg border border-info-100 bg-canvas px-3 text-[14px] text-ink outline-none focus:border-brand-300"
            />
          </label>
          <Button
            type="submit"
            size="sm"
            icon={busy ? ServerCog : LogIn}
            disabled={busy || !apiConfigured}
            fullWidth
          >
            {busy ? "Menghubungi backend…" : "Login backend"}
          </Button>
        </form>
      )}

      {formError ? (
        <p className="flex items-start gap-2 rounded-lg bg-danger-200 p-3 text-[12px] leading-4 text-danger-800">
          <ShieldAlert className="mt-0.5 size-4 shrink-0" />
          {formError}
        </p>
      ) : null}

      {lastError ? (
        <p className="flex items-start gap-2 rounded-lg bg-danger-200 p-3 text-[12px] leading-4 text-danger-800">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          {lastError}
        </p>
      ) : null}

      <p className="flex items-start gap-2 text-[11px] leading-4 text-muted">
        <PlugZap className="mt-0.5 size-3.5 shrink-0" />
        <span>
          Perintah dikirim via <code>POST /api/command</code>. Backend hanya
          melaporkan <code>published</code> / <code>pending_execution</code> —
          eksekusi fisik tetap diatur firmware.
        </span>
      </p>
    </Card>
  );
}
