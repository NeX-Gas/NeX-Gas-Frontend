import { cn } from "@/lib/cn";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative grid size-8 shrink-0 place-items-center rounded-[0.6rem] bg-brand text-white shadow-sm",
        className,
      )}
    >
      <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
        <path
          d="M12 21c3.6 0 6.5-2.5 6.5-6 0-2.6-1.7-4.6-3.4-6.2C13.6 7.3 12 5.4 12 3c0 0-6.5 4.2-6.5 9.2 0 4.6 2.9 8.8 6.5 8.8Z"
          fill="currentColor"
          opacity="0.35"
        />
        <path
          d="M12 21c-2.9 0-5.2-2.2-5.2-5 0-2.3 1.6-3.9 3.1-5.3C11.1 9.5 12 8.2 12 6.4c0 0 4.8 3.6 4.8 8 0 3.7-2.1 6.6-4.8 6.6Z"
          fill="currentColor"
        />
        <path
          d="M12 20.4V11"
          stroke="#006C49"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

export function Logo({
  subtitle,
  className,
  onDark = false,
}: {
  subtitle?: string;
  className?: string;
  onDark?: boolean;
}) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <LogoMark />
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "text-[15px] font-semibold tracking-tight",
            onDark ? "text-white" : "text-ink",
          )}
        >
          NEX-GAS
        </span>
        {subtitle ? (
          <span
            className={cn(
              "mt-0.5 text-[11px] font-semibold tracking-wide",
              onDark ? "text-white/70" : "text-ink-2",
            )}
          >
            {subtitle}
          </span>
        ) : null}
      </span>
    </span>
  );
}
