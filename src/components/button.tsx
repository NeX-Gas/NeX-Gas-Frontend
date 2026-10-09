import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "soft" | "ghost";
type Size = "md" | "sm" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-brand text-white hover:bg-brand-deep active:bg-brand-deep",
  secondary:
    "bg-surface text-ink hover:bg-info-50 active:bg-info-100 card-shadow",
  soft: "bg-info-200 text-ink hover:bg-info-300 active:bg-info-400",
  ghost: "text-ink-2 hover:bg-info-100 active:bg-info-200",
};

const sizes: Record<Size, string> = {
  sm: "h-10 px-3.5 text-[13px] rounded-lg gap-2",
  md: "h-12 px-5 text-[15px] rounded-xl gap-2.5",
  lg: "h-13 px-6 text-base rounded-xl gap-2.5",
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
  return (
    <>
      {Icon ? (
        <Icon
          className={cn(size === "sm" ? "size-4" : "size-[18px]", "shrink-0")}
          strokeWidth={2}
        />
      ) : null}
      {children ? <span className="truncate">{children}</span> : null}
      {IconRight ? (
        <IconRight
          className={cn(size === "sm" ? "size-4" : "size-[18px]", "shrink-0")}
          strokeWidth={2}
        />
      ) : null}
    </>
  );
}

function classes({ variant = "primary", size = "md", fullWidth, className }: BaseProps) {
  return cn(
    "inline-flex items-center justify-center font-semibold transition-colors select-none",
    "focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none",
    "disabled:pointer-events-none disabled:opacity-50",
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
