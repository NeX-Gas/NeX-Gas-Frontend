import { cn } from "@/lib/cn";

export type Bar = { label: string; value: number };

export function ProductionChart({
  data,
  target,
  unit = "m³",
  height = 132,
}: {
  data: Bar[];
  target: number;
  unit?: string;
  height?: number;
}) {
  const max = Math.max(...data.map((d) => d.value), target);
  const peak = Math.max(...data.map((d) => d.value));
  const targetBottom = (target / max) * height;

  return (
    <div className="w-full">
      <div className="relative" style={{ height: height + 42 }}>
        <div
          className="absolute inset-x-0 z-10 flex items-center justify-end"
          style={{ bottom: 42 + targetBottom }}
        >
          <div className="h-px flex-1 bg-line" />
          <span className="ml-1 rounded bg-surface px-1.5 text-[12px] font-semibold text-muted">
            Target {target} {unit}
          </span>
        </div>

        <div className="flex h-full items-end gap-1.5 sm:gap-3">
          {data.map((d) => {
            const isPeak = d.value === peak;
            return (
              <div
                key={d.label}
                className="flex h-full flex-1 flex-col items-center justify-end gap-1.5"
              >
                <span
                  className={cn(
                    "text-[13px] font-semibold",
                    isPeak ? "text-brand" : "text-ink-2",
                  )}
                >
                  {d.value}
                </span>
                <div
                  className={cn(
                    "animate-grow-bar w-full max-w-8 rounded-[4px]",
                    isPeak ? "bg-brand" : "bg-info-200",
                  )}
                  style={{
                    height: Math.max((d.value / max) * height, 6),
                    animationDelay: "80ms",
                  }}
                />
                <span
                  className={cn(
                    "text-[13px]",
                    isPeak
                      ? "font-bold text-ink"
                      : "font-medium text-ink",
                  )}
                >
                  {d.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
