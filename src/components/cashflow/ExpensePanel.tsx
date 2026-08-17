"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SidePanel, PanelField } from "@/components/ui/side-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatNumber, parseNumberFromInput, formatRupiah } from "@/lib/format";

const CATEGORIES = [
  { value: "UTILITY", label: "Listrik, Air & Internet" },
  { value: "RENT", label: "Sewa Tempat" },
  { value: "SALARY", label: "Gaji & Upah Pegawai" },
  { value: "TRANSPORT", label: "Transport & Pengiriman" },
  { value: "SUPPLIES", label: "Perlengkapan Toko" },
  { value: "OTHER", label: "Lain-lain" },
] as const;

const FUND_SOURCES = [
  { value: "CASH", label: "Kas laci", hint: "Uang tunai diambil dari laci kasir" },
  { value: "BANK", label: "Transfer bank", hint: "Dibayar lewat rekening atau e-wallet" },
] as const;

type ExpensePanelProps = {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
};

export default function ExpensePanel({ open, onClose, onSaved }: ExpensePanelProps) {
  const [category, setCategory] = useState<string>("UTILITY");
  const [description, setDescription] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [fundSource, setFundSource] = useState<string>("CASH");
  const [note, setNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [availableCash, setAvailableCash] = useState<number | null>(null);

  const amount = parseNumberFromInput(amountInput);
  const exceedsDrawer =
    fundSource === "CASH" && availableCash !== null && amount > availableCash;

  useEffect(() => {
    if (!open) return;
    fetch("/api/cash-drawer")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setAvailableCash(data.hasActiveShift ? data.available : null);
      })
      .catch(() => setAvailableCash(null));
  }, [open]);

  function resetForm() {
    setCategory("UTILITY");
    setDescription("");
    setAmountInput("");
    setFundSource("CASH");
    setNote("");
  }

  async function handleSubmit() {
    if (!description.trim()) {
      toast.error("Keterangan pengeluaran wajib diisi");
      return;
    }
    if (amount <= 0) {
      toast.error("Nominal pengeluaran harus lebih dari nol");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, description, amount, fundSource, note }),
      });
      const data = await res.json();

      if (!data.success) {
        toast.error("Gagal menyimpan", { description: data.message });
        return;
      }

      toast.success("Pengeluaran tercatat", { description: data.message });
      resetForm();
      onSaved();
      onClose();
    } catch (error: any) {
      toast.error("Terjadi kesalahan", { description: error.message });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <SidePanel
      open={open}
      onClose={onClose}
      title="Catat Pengeluaran"
      description="Biaya operasional toko. Jurnal akuntansi dibuat otomatis dan kas laci ikut berkurang."
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} className="cursor-pointer">
            Batal
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={isSaving || exceedsDrawer}
            className="bg-brand text-white hover:bg-brand/90 cursor-pointer"
          >
            {isSaving ? "Menyimpan..." : "Simpan Pengeluaran"}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <PanelField label="Jenis Pengeluaran">
          <div className="grid grid-cols-2 gap-1.5">
            {CATEGORIES.map((item) => {
              const isSelected = category === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setCategory(item.value)}
                  className={`rounded-md border px-2.5 py-2 text-left text-[12px] font-medium transition-colors cursor-pointer ${
                    isSelected
                      ? "border-brand bg-brand-soft text-brand"
                      : "border-line text-ink-soft hover:bg-surface-muted hover:text-ink"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </PanelField>

        <PanelField label="Keterangan" htmlFor="expense-description">
          <Input
            id="expense-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Misal: Bayar listrik bulan Agustus"
            className="h-9"
          />
        </PanelField>

        <PanelField label="Nominal" htmlFor="expense-amount">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] font-semibold text-ink-muted">
              Rp
            </span>
            <Input
              id="expense-amount"
              value={amountInput}
              onChange={(e) => setAmountInput(formatNumber(parseNumberFromInput(e.target.value)))}
              placeholder="0"
              className="num h-10 pl-9 text-right text-[15px] font-bold"
            />
          </div>
        </PanelField>

        <PanelField
          label="Sumber Dana"
          hint={
            availableCash !== null
              ? `Uang tunai di laci saat ini ${formatRupiah(availableCash)}.`
              : "Belum ada shift berjalan — pembayaran tunai dari laci belum bisa dicatat."
          }
        >
          <div className="grid grid-cols-2 gap-1.5">
            {FUND_SOURCES.map((item) => {
              const isSelected = fundSource === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setFundSource(item.value)}
                  className={`rounded-md border px-3 py-2.5 text-left transition-colors cursor-pointer ${
                    isSelected
                      ? "border-brand bg-brand-soft"
                      : "border-line hover:bg-surface-muted"
                  }`}
                >
                  <span
                    className={`block text-[12.5px] font-semibold ${
                      isSelected ? "text-brand" : "text-ink"
                    }`}
                  >
                    {item.label}
                  </span>
                  <span className="mt-0.5 block text-[11px] leading-snug text-ink-muted">
                    {item.hint}
                  </span>
                </button>
              );
            })}
          </div>
        </PanelField>

        <PanelField label="Catatan Tambahan" htmlFor="expense-note">
          <Input
            id="expense-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Opsional"
            className="h-9"
          />
        </PanelField>

        {amount > 0 && (
          <div
            className={`rounded-xl border p-3.5 space-y-2 ${
              exceedsDrawer ? "border-negative/30 bg-negative-soft" : "border-brand/20 bg-brand-soft/40"
            }`}
          >
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-ink-muted">
                {exceedsDrawer ? "❌ Uang Laci Kurang" : "✨ Jurnal Otomatis yang Dibuat"}
              </p>
              {!exceedsDrawer && (
                <span className="rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold text-white">
                  Otomatis 100%
                </span>
              )}
            </div>
            {exceedsDrawer ? (
              <p className="text-xs leading-relaxed text-negative font-semibold">
                Nominal ({formatRupiah(amount)}) melebihi uang tunai yang ada di laci saat ini (
                {formatRupiah(availableCash ?? 0)}). Kurangi nominal atau pilih opsi &quot;Transfer Bank&quot;.
              </p>
            ) : (
              <div className="text-xs leading-relaxed text-ink space-y-1">
                <p>
                  Uang keluar sebesar <strong className="text-negative font-bold">{formatRupiah(amount)}</strong> dari{" "}
                  <strong>{fundSource === "CASH" ? "Kas Laci Toko" : "Rekening Bank"}</strong>.
                </p>
                <div className="rounded-lg bg-surface/80 p-2 text-[11.5px] border border-line text-ink-soft">
                  <p>
                    • <strong>Debit:</strong> Beban {CATEGORIES.find((c) => c.value === category)?.label} (+{formatRupiah(amount)})
                  </p>
                  <p>
                    • <strong>Kredit:</strong> {fundSource === "CASH" ? "Kas Toko" : "Bank"} (−{formatRupiah(amount)})
                  </p>
                </div>
                <p className="text-[10.5px] text-ink-muted italic">
                  *Anda tidak perlu mikir debit-kredit. Biaya ini akan langsung mengurangi Laba Bersih Toko di Dashboard.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </SidePanel>
  );
}
