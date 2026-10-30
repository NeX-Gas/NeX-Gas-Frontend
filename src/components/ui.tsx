import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Tone } from "@/lib/types";

export function Card({
  children,
  className,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}) {
  return (
    <Tag className={cn("card-shadow rounded-xl bg-surface", className)}>
      {children}
    </Tag>
  );
}

export function SectionLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "text-[11px] font-semibold tracking-[0.08em] text-muted uppercase",
        className,
      )}
    >
      {children}
    </p>
  );
}

export function IconTile({
  icon: Icon,
  className,
  size = "md",
  tone = "info",
}: {
  icon: LucideIcon;
  className?: string;
  size?: "sm" | "md" | "lg";
  tone?: "info" | "brand" | "danger";
}) {
  const sizes = {
    sm: "size-9 rounded-lg",
    md: "size-10 rounded-lg",
    lg: "size-12 rounded-xl",
  };
  const tones = {
    info: "bg-info-100 text-brand",
    brand: "bg-brand text-white",
    danger: "bg-danger-200 text-danger",
  };
  return (
    <span className={cn("grid place-items-center", sizes[size], tones[tone], className)}>
      <Icon className={cn(size === "sm" ? "size-4" : "size-5")} strokeWidth={2} />
    </span>
  );
}

const pillTones: Record<Tone, string> = {
  good: "bg-info-200 text-brand-deep",
  neutral: "bg-info-100 text-muted-2",
  warn: "bg-danger-200 text-danger-700",
  danger: "bg-danger-300 text-danger-800",
};

const dotTones: Record<Tone, string> = {
  good: "bg-brand-400",
  neutral: "bg-muted",
  warn: "bg-danger",
  danger: "bg-danger-800",
};

export function StatusPill({
  children,
  tone = "neutral",
  dot = true,
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[12px] font-semibold",
        pillTones[tone],
        className,
      )}
    >
      {dot ? (
        <span className={cn("size-2 rounded-full", dotTones[tone])} />
      ) : null}
      {children}
    </span>
  );
}

const badgeTones = {
  good: "bg-brand-200 text-brand-dark",
  warn: "bg-danger-300 text-danger-900",
  danger: "bg-danger-400 text-danger-800",
  info: "bg-info-500 text-[#121C28]",
} as const;

export function StatusBadge({
  children,
  tone = "info",
  className,
}: {
  children: React.ReactNode;
  tone?: keyof typeof badgeTones;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold tracking-[0.05em] uppercase",
        badgeTones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function ProgressBar({
  value,
  tone = "good",
  thresholds = [],
  label,
  className,
}: {
  value: number;
  tone?: "good" | "warn";
  thresholds?: { at: number; tone: "normal" | "warn" }[];
  label?: string;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("relative h-7 w-full rounded-lg bg-info-300", className)}>
      <div
        className={cn(
          "relative flex h-full items-center justify-end rounded-lg pr-2 transition-[width] duration-700 ease-out",
          tone === "warn" ? "bg-danger-400" : "bg-brand-400",
        )}
        style={{ width: `${pct}%` }}
      >
        {label ? (
          <span
            className={cn(
              "text-[12px] font-semibold whitespace-nowrap",
              tone === "warn" ? "text-danger-900" : "text-brand-dark",
            )}
          >
            {label}
          </span>
        ) : null}
      </div>
      {thresholds.map((t) => (
        <span
          key={t.at}
          className={cn(
            "absolute top-0 h-full w-0.5",
            t.tone === "warn" ? "bg-danger" : "bg-[#6C7A71]",
          )}
          style={{ left: `${t.at}%` }}
        />
      ))}
    </div>
  );
}

export function ScreenTitle({
  title,
  subtitle,
  className,
}: {
  title: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <header className={cn("flex flex-col gap-1", className)}>
      <h1 className="text-[22px] leading-7 font-semibold tracking-[-0.02em] text-ink">
        {title}
      </h1>
      {subtitle ? (
        <p className="text-sm leading-5 text-ink-2">{subtitle}</p>
      ) : null}
    </header>
  );
}
