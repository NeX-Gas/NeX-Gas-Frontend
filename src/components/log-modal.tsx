"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/button";
import { cn } from "@/lib/cn";

const quick = [15, 20, 25, 30];

export function LogInputModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (kg: number) => void;
}) {
  const [kg, setKg] = useState(25);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const valid = Number.isFinite(kg) && kg > 0 && kg <= 500;
  const gas = valid ? (kg * 0.072).toFixed(1) : "0.0";

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="animate-fade-up w-full max-w-md rounded-t-[10px] bg-surface p-5 card-shadow-lg sm:rounded-[10px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-medium tracking-[0.09em] text-muted uppercase">
              Catatan Harian
            </p>
            <h2 className="mt-1 text-[17px] font-semibold tracking-[-0.01em] text-ink">
              Pengisian Kotoran
            </h2>
            <p className="mt-1 font-mono text-[11px] text-muted">
              perkiraan gas ~{gas} m³
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="grid size-8 place-items-center rounded-[4px] text-ink-2 hover:bg-info-50"
          >
            <X className="size-5" />
          </button>
        </div>

        <label className="mt-5 block text-[11px] font-medium tracking-[0.09em] text-muted uppercase">
          Berat kotoran (kg)
        </label>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={500}
            step={1}
            value={Number.isFinite(kg) ? kg : ""}
            onChange={(e) => setKg(Number(e.target.value))}
            className="h-10 w-28 rounded-[4px] border border-line/60 bg-surface px-3 font-mono text-[16px] font-medium text-ink focus:border-brand focus:outline-none"
          />
          <div className="flex flex-wrap gap-2">
            {quick.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setKg(q)}
                className={cn(
                  "h-8 rounded-[4px] border px-2.5 font-mono text-[11.5px] transition-colors",
                  kg === q
                    ? "border-brand bg-brand text-white"
                    : "border-line/50 bg-surface text-ink-2 hover:border-line hover:bg-info-50",
                )}
              >
                {q} kg
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <Button variant="soft" fullWidth onClick={onClose}>
            Batal
          </Button>
          <Button
            fullWidth
            disabled={!valid}
            onClick={() => {
              if (!valid) return;
              onSave(kg);
              onClose();
            }}
          >
            Simpan Catatan
          </Button>
        </div>
      </div>
    </div>
  );
}
