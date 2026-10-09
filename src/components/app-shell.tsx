"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Bell, User } from "lucide-react";
import { Logo, LogoMark } from "@/components/logo";
import { useAppStore } from "@/components/app-store";
import { navItems, pageTitles } from "@/lib/nav";
import { cn } from "@/lib/cn";

function useActive() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);
  return { pathname, isActive };
}

function Sidebar() {
  const { isActive } = useActive();
  const { criticalCount } = useAppStore();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-info-100 bg-surface lg:flex">
      <div className="px-6 py-6">
        <Logo subtitle="Monitoring Biogas" />
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-3">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-colors",
                active
                  ? "bg-info-100 text-brand"
                  : "text-ink-2 hover:bg-info-50 hover:text-ink",
              )}
            >
              <Icon className="size-5" strokeWidth={2} />
              <span className="flex-1">{item.label}</span>
              {item.href === "/notifikasi" && criticalCount > 0 ? (
                <span className="grid size-5 place-items-center rounded-full bg-danger text-[11px] font-bold text-white">
                  {criticalCount}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
      <div className="m-3 rounded-xl bg-info-50 p-4">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-brand-400" />
          <span className="text-[13px] font-semibold text-ink">Unit #01 Online</span>
        </div>
        <p className="mt-1 text-[12px] leading-4 text-ink-2">
          Telemetri nirkabel aktif • sinyal penuh
        </p>
      </div>
    </aside>
  );
}

function MobileHeader() {
  const { pathname } = useActive();
  const isDetail = pathname.startsWith("/purifikasi");
  const label = pageTitles[pathname] ?? "Home";

  return (
    <header className="sticky top-0 z-40 border-b border-info-50 bg-canvas/85 backdrop-blur-md lg:hidden">
      <div className="mx-auto flex h-16 max-w-md items-center gap-3 px-4">
        {isDetail ? (
          <Link
            href="/"
            aria-label="Kembali"
            className="grid size-10 -ml-2 shrink-0 place-items-center rounded-lg text-ink hover:bg-info-100"
          >
            <ArrowLeft className="size-5" />
          </Link>
        ) : (
          <LogoMark className="size-9 rounded-xl" />
        )}
        <div className="flex min-w-0 flex-col">
          <span className="text-[15px] leading-none font-semibold tracking-tight text-ink">
            NEX-GAS
          </span>
          <span className="mt-1 truncate text-[12px] leading-none font-semibold text-ink-2">
            {label}
          </span>
        </div>
        <button
          type="button"
          aria-label="Profil"
          className="ml-auto grid size-9 place-items-center rounded-full bg-brand text-white"
        >
          <User className="size-4" />
        </button>
      </div>
    </header>
  );
}

function DesktopTopBar() {
  const { unreadCount } = useAppStore();
  return (
    <header className="hidden items-center justify-between px-8 pt-6 pb-2 lg:flex">
      <div className="inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1.5 text-[13px] font-semibold text-ink-2 card-shadow">
        <span className="size-2 rounded-full bg-brand-400" />
        Unit #01 • Kandang Sapi Barat
      </div>
      <div className="flex items-center gap-3">
        <Link
          href="/notifikasi"
          aria-label="Notifikasi"
          className="relative grid size-10 place-items-center rounded-full bg-surface text-ink-2 card-shadow hover:text-ink"
        >
          <Bell className="size-5" />
          {unreadCount > 0 ? (
            <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-danger ring-2 ring-surface" />
          ) : null}
        </Link>
        <button
          type="button"
          aria-label="Profil"
          className="grid size-10 place-items-center rounded-full bg-brand text-white"
        >
          <User className="size-4" />
        </button>
      </div>
    </header>
  );
}

function BottomNav() {
  const { isActive } = useActive();
  const { criticalCount } = useAppStore();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-info-100 bg-canvas/90 backdrop-blur-md lg:hidden">
      <div className="mx-auto flex h-20 max-w-md items-stretch justify-around px-1">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1.5 rounded-xl pt-2 transition-colors",
                active ? "text-brand" : "text-ink-2",
              )}
            >
              <span className="relative">
                <Icon className="size-5" strokeWidth={2} />
                {item.href === "/notifikasi" && criticalCount > 0 && !active ? (
                  <span className="absolute -right-1 -top-1 size-2.5 rounded-full bg-danger ring-2 ring-canvas" />
                ) : null}
              </span>
              <span className="text-[12px] leading-none font-semibold">
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
      <div className="lg:pl-64">
        <MobileHeader />
        <DesktopTopBar />
        <main className="mx-auto w-full max-w-md px-4 pt-4 pb-28 lg:max-w-5xl lg:px-8 lg:pt-4 lg:pb-16">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
