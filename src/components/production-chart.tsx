import { cn } from "@/lib/cn";

export type Bar = { label: string; value: number };

/** Langkah skala yang "manusiawi" — bukan 1.9, 1.3, 0.6. */
const STEP_LADDER = [0.1, 0.2, 0.25, 0.5, 1, 2, 2.5, 5, 10, 20, 25, 50, 100];

function scaleFor(max: number) {
  const step =
    STEP_LADDER.find((candidate) => Math.ceil(max / candidate) <= 4) ?? 100;
  const ceiling = step * Math.max(1, Math.ceil(max / step));
  const decimals = step < 1 ? (step < 0.25 ? 2 : 1) : 0;
  const ticks: number[] = [];
  for (let v = 0; v <= ceiling + 1e-9; v += step) ticks.push(v);
  return { step, ceiling, decimals, ticks };
}

/**
 * Grafik batang bergaya instrumen: garis bantu tipis, label sumbu mono,
 * batang tanpa sudut membulat. Puncak ditandai warna brand.
 */
export function ProductionChart({
  data,
  target,
  height = 148,
}: {
  data: Bar[];
  target: number;
  height?: number;
}) {
  const max = Math.max(...data.map((d) => d.value), target);
  const peak = Math.max(...data.map((d) => d.value));
  const { ceiling, decimals, ticks } = scaleFor(max);

  return (
    <div className="w-full">
      <div className="relative pl-9" style={{ minHeight: height + 28 }}>
        {/* sumbu nilai */}
        <div className="absolute inset-y-0 left-0 w-8" style={{ height }}>
          {ticks.map((tick) => (
            <span
              key={tick}
              className="absolute right-1.5 translate-y-1/2 font-mono text-[9.5px] leading-none text-muted tnum"
              style={{ bottom: `${(tick / ceiling) * 100}%` }}
            >
              {tick.toFixed(decimals)}
            </span>
          ))}
        </div>

        <div className="relative" style={{ height }}>
          {ticks
            .filter((tick) => tick > 0)
            .map((tick) => (
              <span
                key={tick}
                className="absolute inset-x-0 h-px bg-line/30"
                style={{ bottom: `${(tick / ceiling) * 100}%` }}
              />
            ))}

          {/* garis target */}
          <div
            className="absolute inset-x-0 z-10 flex items-center"
            style={{ bottom: `${(target / ceiling) * 100}%` }}
          >
            <span className="h-px flex-1 bg-danger/45" />
            <span className="ml-1.5 font-mono text-[9.5px] whitespace-nowrap text-danger tnum">
              target {target}
            </span>
          </div>

          <div className="absolute inset-0 flex items-end gap-1.5 sm:gap-2.5">
            {data.map((d) => {
              const isPeak = d.value === peak;
              return (
                <div
                  key={d.label}
                  className="group relative flex h-full flex-1 items-end"
                >
                  <div
                    className={cn(
                      "animate-grow-bar w-full rounded-t-[2px]",
                      isPeak ? "bg-brand" : "bg-info-300",
                    )}
                    style={{
                      height: `${Math.max((d.value / ceiling) * 100, 1.5)}%`,
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* label sumbu-x */}
        <div className="mt-2 flex gap-1.5 sm:gap-2.5">
          {data.map((d) => (
            <span
              key={d.label}
              className={cn(
                "flex-1 text-center font-mono text-[10.5px]",
                d.value === peak ? "font-semibold text-ink" : "text-muted",
              )}
            >
              {d.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
