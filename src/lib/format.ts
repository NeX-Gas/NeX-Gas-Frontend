/** Helper tampilan angka sensor. Nilai -1 dari firmware = tidak tersedia. */

export function hasValue(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

export function fmtValue(
  value: number,
  digits = 1,
  empty = "—",
): string {
  return hasValue(value) ? value.toFixed(digits) : empty;
}

export function fmtUnit(value: number, unit: string, digits = 1): string {
  const text = fmtValue(value, digits);
  return text === "—" ? text : `${text} ${unit}`;
}

/** Ambil angka dari label bervolume seperti "1.8 m³ Gas" atau "2.1 m³". */
export function parseVolume(label: string): number | null {
  const match = label.match(/(\d+(?:[.,]\d+)?)/);
  if (!match) return null;
  const value = Number(match[1].replace(",", "."));
  return Number.isFinite(value) ? value : null;
}

export function relativeTime(epochMs: number | null): string {
  if (!epochMs) return "belum ada data";
  const diff = Math.max(0, Date.now() - epochMs);
  const seconds = Math.round(diff / 1000);
  if (seconds < 5) return "baru saja";
  if (seconds < 60) return `${seconds} detik lalu`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  return `${Math.round(hours / 24)} hari lalu`;
}
