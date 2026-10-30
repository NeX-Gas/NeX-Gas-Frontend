"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, User } from "lucide-react";
import { Logo, LogoMark } from "@/components/logo";
import { useAppStore } from "@/components/app-store";
import { StatusPill } from "@/components/ui";
import { navItems, pageTitles } from "@/lib/nav";
import { relativeTime } from "@/lib/format";
import { cn } from "@/lib/cn";

function useActive() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);
  return { pathname, isActive };
}

const linkText = {
  live: { label: "Live", tone: "good" as const },
  demo: { label: "Demo", tone: "neutral" as const },
  connecting: { label: "Menyambung", tone: "warn" as const },
  offline: { label: "Offline", tone: "danger" as const },
};

function Sidebar() {
  const { isActive } = useActive();
  const { criticalCount, link, deviceId, firmware } = useAppStore();
  const state = linkText[link];

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-line/40 bg-surface lg:flex">
      <div className="border-b border-line/35 px-5 py-5">
        <Logo subtitle="Monitoring Biogas" />
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 px-3 py-4">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex h-9 items-center gap-2.5 rounded-[4px] px-2.5 text-[13px] font-medium transition-colors",
                active
                  ? "bg-info-50 text-brand-deep"
                  : "text-ink-2 hover:bg-info-50/70 hover:text-ink",
              )}
            >
              {active ? (
                <span className="absolute top-2 bottom-2 left-0 w-0.5 bg-brand" />
              ) : null}
              <Icon className="size-4 shrink-0" strokeWidth={active ? 2 : 1.75} />
              <span className="flex-1">{item.label}</span>
              {item.href === "/notifikasi" && criticalCount > 0 ? (
                <span className="font-mono text-[11px] font-semibold text-danger">
                  {criticalCount}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <Link
        href="/pengaturan"
        className="mx-3 mb-3 rounded-[4px] border border-line/50 px-3 py-2.5 transition-colors hover:bg-info-50/60"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[11px] text-muted">{deviceId}</span>
          <StatusPill tone={state.tone}>{state.label}</StatusPill>
        </div>
        <p className="mt-1 font-mono text-[10.5px] text-muted">
          firmware {firmware}
        </p>
      </Link>
    </aside>
  );
}

function MobileHeader() {
  const { pathname } = useActive();
  const route = pathname.replace(/\/$/, "") || "/";
  const label = pageTitles[route] ?? "Beranda";
  const { link } = useAppStore();
  const state = linkText[link];

  return (
    <header className="sticky top-0 z-40 border-b border-line/40 bg-canvas/92 backdrop-blur-md lg:hidden">
      <div className="flex h-14 items-center gap-2.5 px-4">
        <LogoMark className="size-7 rounded-[4px]" />
        <div className="flex min-w-0 flex-col">
          <span className="text-[11px] leading-none font-medium tracking-[0.09em] text-muted uppercase">
            NEX-GAS
          </span>
          <span className="mt-1 truncate text-[13px] leading-none font-semibold text-ink">
            {label}
          </span>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <StatusPill tone={state.tone}>{state.label}</StatusPill>
          <button
            type="button"
            aria-label="Profil"
            className="grid size-8 place-items-center rounded-[4px] border border-line/50 bg-surface text-ink-2"
          >
            <User className="size-3.5" strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </header>
  );
}

function DesktopTopBar() {
  const { unreadCount, lastSeen, link, deviceId } = useAppStore();
  const state = linkText[link];

  return (
    <header className="hidden h-12 items-center justify-between border-b border-line/35 px-8 lg:flex">
      <div className="flex items-center gap-2 text-[12px] text-ink-2">
        <span className="font-mono text-muted">{deviceId}</span>
        <span className="text-line">/</span>
        <span>Digester Aktif</span>
        <span className="text-line">/</span>
        <span className="text-muted">Kandang Sapi Barat</span>
      </div>

      <div className="flex items-center gap-4">
        <span className="flex items-center gap-2 font-mono text-[11px] text-muted">
          <StatusPill tone={state.tone}>{state.label}</StatusPill>
          <span className="text-line">·</span>
          {relativeTime(lastSeen)}
        </span>
        <Link
          href="/notifikasi"
          aria-label="Notifikasi"
          className="relative grid size-8 place-items-center rounded-[4px] text-ink-2 transition-colors hover:bg-info-50 hover:text-ink"
        >
          <Bell className="size-4" strokeWidth={1.75} />
          {unreadCount > 0 ? (
            <span className="absolute top-1.5 right-1.5 size-1.5 rounded-[1px] bg-danger ring-2 ring-canvas" />
          ) : null}
        </Link>
        <button
          type="button"
          aria-label="Profil"
          className="grid size-8 place-items-center rounded-[4px] border border-line/50 bg-surface text-ink-2"
        >
          <User className="size-3.5" strokeWidth={1.75} />
        </button>
      </div>
    </header>
  );
}

function BottomNav() {
  const { isActive } = useActive();
  const { criticalCount } = useAppStore();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line/40 bg-canvas/95 backdrop-blur-md lg:hidden">
      <div className="mx-auto flex h-16 max-w-md items-stretch justify-around px-1">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex flex-1 flex-col items-center justify-center gap-1 transition-colors",
                active ? "text-brand-deep" : "text-muted",
              )}
            >
              {active ? (
                <span className="absolute top-0 h-0.5 w-8 bg-brand" />
              ) : null}
              <span className="relative">
                <Icon
                  className="size-[18px]"
                  strokeWidth={active ? 2 : 1.75}
                />
                {item.href === "/notifikasi" &&
                criticalCount > 0 &&
                !active ? (
                  <span className="absolute -top-1 -right-1 size-1.5 rounded-[1px] bg-danger" />
                ) : null}
              </span>
              <span className="text-[11px] leading-none font-medium">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-canvas">
      <Sidebar />
      <div className="lg:pl-60">
        <MobileHeader />
        <DesktopTopBar />
        <main className="mx-auto w-full max-w-[1152px] px-4 pt-5 pb-24 lg:px-8 lg:pt-6 lg:pb-16">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
