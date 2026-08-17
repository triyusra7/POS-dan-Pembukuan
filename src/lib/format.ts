/**
 * Format angka nominal ke format Rupiah dengan pemisah ribuan titik.
 * Contoh: 1000000 -> "Rp 1.000.000"
 */
export function formatRupiah(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format angka dengan pemisah titik ribuan tanpa simbol Rp.
 * Contoh: 1000000 -> "1.000.000"
 */
export function formatNumber(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return "0";
  return new Intl.NumberFormat("id-ID").format(amount);
}

/**
 * Parse string nominal dengan titik ribuan menjadi angka.
 * Contoh: "1.000.000" -> 1000000
 */
export function parseNumberFromInput(value: string): number {
  if (!value) return 0;
  const clean = value.replace(/[^0-9]/g, "");
  return clean ? parseInt(clean, 10) : 0;
}

/**
 * Format tanggal Indonesia lengkap atau jam.
 */
export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

export function formatTimeOnly(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(d);
}
