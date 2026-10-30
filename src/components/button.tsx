import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "soft" | "ghost";
type Size = "md" | "sm" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-brand text-white hover:bg-brand-deep active:bg-brand-dark disabled:bg-info-200 disabled:text-muted",
  secondary:
    "border border-line/60 bg-surface text-ink hover:border-line hover:bg-info-50 active:bg-info-100 disabled:border-line/40 disabled:bg-info-50 disabled:text-muted",
  soft: "bg-info-100 text-ink hover:bg-info-200 active:bg-info-300 disabled:bg-info-50 disabled:text-muted",
  ghost: "text-ink-2 hover:bg-info-50 active:bg-info-100 disabled:text-muted",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-[12.5px] rounded-[4px] gap-1.5",
  md: "h-10 px-4 text-[13px] rounded-[4px] gap-2",
  lg: "h-12 px-5 text-[14px] rounded-[4px] gap-2",
};

type BaseProps = {
  children?: React.ReactNode;
  variant?: Variant;
  size?: Size;
  icon?: LucideIcon;
  iconRight?: LucideIcon;
  fullWidth?: boolean;
  className?: string;
};

function inner({ icon: Icon, iconRight: IconRight, size = "md", children }: BaseProps) {
  const iconSize = size === "sm" ? "size-3.5" : "size-4";
  return (
    <>
      {Icon ? (
        <Icon className={cn(iconSize, "shrink-0")} strokeWidth={1.75} />
      ) : null}
      {children ? <span className="truncate">{children}</span> : null}
      {IconRight ? (
        <IconRight className={cn(iconSize, "shrink-0")} strokeWidth={1.75} />
      ) : null}
    </>
  );
}

function classes({ variant = "primary", size = "md", fullWidth, className }: BaseProps) {
  return cn(
    "inline-flex items-center justify-center font-semibold tracking-[-0.005em] transition-colors select-none",
    "focus-visible:ring-2 focus-visible:ring-brand/35 focus-visible:ring-offset-1 focus-visible:outline-none",
    "disabled:pointer-events-none",
    variants[variant],
    sizes[size],
    fullWidth && "w-full",
    className,
  );
}

export function Button({
  onClick,
  type = "button",
  disabled,
  ...props
}: BaseProps & {
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={classes(props)}
    >
      {inner(props)}
    </button>
  );
}

export function ButtonLink({
  href,
  ...props
}: BaseProps & { href: string }) {
  return (
    <Link href={href} className={classes(props)}>
      {inner(props)}
    </Link>
  );
}
