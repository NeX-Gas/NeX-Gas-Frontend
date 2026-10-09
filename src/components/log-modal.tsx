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

  const gas = (kg * 0.072).toFixed(1);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="animate-fade-up w-full max-w-md rounded-t-2xl bg-surface p-5 card-shadow-lg sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-ink">
              Catat Pengisian Kotoran
            </h2>
            <p className="mt-0.5 text-sm text-ink-2">
              Perkiraan produksi gas: ~{gas} m³
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="grid size-9 place-items-center rounded-lg text-ink-2 hover:bg-info-100"
          >
            <X className="size-5" />
          </button>
        </div>

        <label className="mt-5 block text-[13px] font-semibold text-ink-2">
          Berat kotoran (kg)
        </label>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <input
            type="number"
            inputMode="numeric"
            min={1}
            value={kg}
            onChange={(e) => setKg(Number(e.target.value))}
            className="h-12 w-28 rounded-xl border border-info-300 bg-info-50 px-3 text-lg font-semibold text-ink focus:border-brand focus:outline-none"
          />
          <div className="flex flex-wrap gap-2">
            {quick.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setKg(q)}
                className={cn(
                  "h-9 rounded-lg px-3 text-[13px] font-semibold transition-colors",
                  kg === q
                    ? "bg-brand text-white"
                    : "bg-info-100 text-ink-2 hover:bg-info-200",
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
            onClick={() => {
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
