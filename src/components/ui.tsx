import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Tone } from "@/lib/types";

/* ------------------------------------------------------------------ *
 * Permukaan
 * ------------------------------------------------------------------ */

export function Panel({
  children,
  className,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}) {
  return <Tag className={cn("panel", className)}>{children}</Tag>;
}

/** Alias lama; semua permukaan sekarang datar (garis rambut, tanpa bayangan). */
export const Card = Panel;

/* ------------------------------------------------------------------ *
 * Tipografi
 * ------------------------------------------------------------------ */

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
        "text-[11px] leading-4 font-medium tracking-[0.09em] text-muted uppercase",
        className,
      )}
    >
      {children}
    </p>
  );
}

/** Label kecil dengan garis rambut sampai tepi panel. */
export function RuleLabel({
  children,
  right,
  className,
}: {
  children: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <SectionLabel className="shrink-0">{children}</SectionLabel>
      <span className="h-px flex-1 bg-line/40" />
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}

export function PanelHead({
  label,
  title,
  right,
  className,
}: {
  label: string;
  title: string;
  right?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 border-b border-line/35 px-4 py-3",
        className,
      )}
    >
      <div className="min-w-0">
        <SectionLabel>{label}</SectionLabel>
        <h3 className="mt-0.5 truncate text-[15px] leading-5 font-semibold tracking-[-0.01em] text-ink">
          {title}
        </h3>
      </div>
      {right ? <div className="shrink-0 pt-0.5">{right}</div> : null}
    </div>
  );
}

/** Angka pengukuran: mono, satuan kecil di baseline. */
export function Readout({
  value,
  unit,
  size = "md",
  tone = "ink",
  className,
}: {
  value: React.ReactNode;
  unit?: string;
  size?: "sm" | "md" | "lg" | "xl";
  tone?: "ink" | "muted" | "brand" | "danger";
  className?: string;
}) {
  const sizes = {
    sm: "text-[14px] leading-5",
    md: "text-[19px] leading-6",
    lg: "text-[28px] leading-8",
    xl: "text-[40px] leading-[44px]",
  };
  const tones = {
    ink: "text-ink",
    muted: "text-muted",
    brand: "text-brand",
    danger: "text-danger-700",
  };
  const unitSizes = {
    sm: "text-[10px]",
    md: "text-[11px]",
    lg: "text-[12px]",
    xl: "text-[13px]",
  };
  return (
    <span className={cn("inline-flex items-baseline gap-1.5", className)}>
      <span
        className={cn(
          "font-mono font-medium tracking-[-0.01em] tnum",
          sizes[size],
          tones[tone],
        )}
      >
        {value}
      </span>
      {unit ? (
        <span
          className={cn(
            "font-mono font-medium tracking-[0.02em] text-muted",
            unitSizes[size],
          )}
        >
          {unit}
        </span>
      ) : null}
    </span>
  );
}

/* ------------------------------------------------------------------ *
 * Status
 * ------------------------------------------------------------------ */

const dotTones: Record<Tone, string> = {
  good: "bg-brand-400",
  neutral: "bg-muted/60",
  warn: "border border-danger bg-transparent",
  danger: "bg-danger",
};

const textTones: Record<Tone, string> = {
  good: "text-brand-deep",
  neutral: "text-muted",
  warn: "text-danger",
  danger: "text-danger-800 font-semibold",
};

/**
 * Status = titik persegi + teks. Sengaja tanpa latar pil: di panel instrumen,
 * status dibaca, bukan dihias.
 */
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
        "inline-flex items-center gap-1.5 text-[12px] leading-4 font-medium",
        textTones[tone],
        className,
      )}
    >
      {dot ? (
        <span className={cn("size-1.5 shrink-0 rounded-[1px]", dotTones[tone])} />
      ) : null}
      {children}
    </span>
  );
}

const badgeTones = {
  good: "border-brand/30 bg-brand/5 text-brand-deep",
  warn: "border-danger/30 bg-danger-200/40 text-danger-700",
  danger: "border-danger/45 bg-danger-200 text-danger-800",
  info: "border-line/50 bg-surface text-muted",
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
        "inline-flex items-center rounded-[3px] border px-1.5 py-0.5 text-[10px] leading-4 font-semibold tracking-[0.08em] uppercase",
        badgeTones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ *
 * Meter
 * ------------------------------------------------------------------ */

export function ProgressBar({
  value,
  tone = "good",
  thresholds = [],
  className,
}: {
  value: number;
  tone?: "good" | "warn";
  thresholds?: { at: number; tone: "normal" | "warn" }[];
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      className={cn("relative h-1.5 w-full overflow-hidden rounded-[1px] bg-info-200", className)}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn(
          "h-full transition-[width] duration-500 ease-out",
          tone === "warn" ? "bg-danger" : "bg-brand-400",
        )}
        style={{ width: `${pct}%` }}
      />
      {thresholds.map((t) => (
        <span
          key={`${t.at}-${t.tone}`}
          className={cn(
            "absolute top-0 h-full w-px",
            t.tone === "warn" ? "bg-danger" : "bg-ink/25",
          )}
          style={{ left: `${t.at}%` }}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Ikon
 * ------------------------------------------------------------------ */

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
    sm: "size-7 rounded-[4px]",
    md: "size-8 rounded-[4px]",
    lg: "size-10 rounded-[4px]",
  };
  const tones = {
    info: "bg-info-50 text-ink-2",
    brand: "bg-brand text-white",
    danger: "bg-danger-200 text-danger-700",
  };
  const iconSizes = { sm: "size-3.5", md: "size-4", lg: "size-5" };
  return (
    <span
      className={cn("grid place-items-center", sizes[size], tones[tone], className)}
    >
      <Icon className={iconSizes[size]} strokeWidth={1.75} />
    </span>
  );
}

/* ------------------------------------------------------------------ *
 * Header halaman
 * ------------------------------------------------------------------ */

export function ScreenTitle({
  title,
  subtitle,
  actions,
  className,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "flex flex-wrap items-end justify-between gap-3 border-b border-line/35 pb-4",
        className,
      )}
    >
      <div>
        <h1 className="text-[20px] leading-7 font-semibold tracking-[-0.015em] text-ink">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-0.5 text-[13px] leading-5 text-ink-2">{subtitle}</p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </header>
  );
}

/* ------------------------------------------------------------------ *
 * Baris data
 * ------------------------------------------------------------------ */

export function MetricRow({
  label,
  value,
  unit,
  tone = "ink",
  hint,
  className,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  unit?: string;
  tone?: "ink" | "muted" | "brand" | "danger";
  hint?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-baseline justify-between gap-3 border-b border-line/30 py-2 last:border-b-0",
        className,
      )}
    >
      <span className="min-w-0 text-[12.5px] leading-5 text-ink-2">
        {label}
        {hint ? (
          <span className="ml-1.5 font-mono text-[10.5px] text-muted">{hint}</span>
        ) : null}
      </span>
      <Readout value={value} unit={unit} size="sm" tone={tone} className="shrink-0" />
    </div>
  );
}
