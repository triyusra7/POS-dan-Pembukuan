"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SidePanel, PanelField } from "@/components/ui/side-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatRupiah } from "@/lib/format";

const REASONS = [
  { value: "DAMAGE", label: "Rusak / pecah" },
  { value: "EXPIRED", label: "Kadaluarsa / basi" },
  { value: "LOST", label: "Hilang saat opname" },
  { value: "CORRECTION", label: "Koreksi data stok" },
] as const;

type StockReducePanelProps = {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  product: any | null;
};

export default function StockReducePanel({
  open,
  onClose,
  onSaved,
  product,
}: StockReducePanelProps) {
  const [qty, setQty] = useState(1);
  const [reason, setReason] = useState<string>("DAMAGE");
  const [note, setNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setQty(1);
    setReason("DAMAGE");
    setNote("");
  }, [open, product]);

  if (!product) return null;

  const estimatedLoss = (product.costPrice ?? 0) * qty;
  const remainingStock = Math.max(0, (product.currentStock ?? 0) - qty);

  async function handleSubmit() {
    if (qty <= 0) {
      toast.error("Jumlah harus lebih dari nol");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/inventory/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, qty, reason, note }),
      });
      const data = await res.json();

      if (!data.success) {
        toast.error("Gagal menyesuaikan stok", { description: data.message });
        return;
      }

      toast.success("Stok disesuaikan", { description: data.message });
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
      title="Kurangi Stok"
      description="Untuk barang rusak, kadaluarsa, atau hilang. Kerugian otomatis masuk laporan laba rugi."
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} className="cursor-pointer">
            Batal
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={isSaving}
            className="bg-negative text-white hover:bg-negative/90 cursor-pointer"
          >
            {isSaving ? "Menyimpan..." : "Kurangi Stok"}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="rounded-md border border-line bg-surface-muted px-3 py-3">
          <p className="text-[13px] font-semibold text-ink">{product.name}</p>
          <p className="num mt-1 text-[11.5px] text-ink-muted">
            {product.sku} • stok kini {product.currentStock} {product.unit} • modal{" "}
            {formatRupiah(product.costPrice)}
          </p>
        </div>

        <PanelField label="Jumlah yang Berkurang" htmlFor="reduce-qty">
          <Input
            id="reduce-qty"
            type="number"
            min={1}
            max={product.currentStock || undefined}
            value={qty}
            onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
            className="num h-10 text-right text-[15px] font-bold"
          />
        </PanelField>

        <PanelField label="Alasan">
          <div className="grid grid-cols-2 gap-1.5">
            {REASONS.map((item) => {
              const isSelected = reason === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setReason(item.value)}
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

        <PanelField label="Keterangan" htmlFor="reduce-note" hint="Opsional">
          <Input
            id="reduce-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Misal: kemasan sobek saat display"
            className="h-9"
          />
        </PanelField>

        <div className="rounded-md border border-line bg-surface-muted px-3 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
            Yang akan dibukukan
          </p>
          <p className="num mt-1.5 text-[12.5px] leading-relaxed text-ink">
            Stok menjadi <span className="font-bold">{remainingStock}</span> {product.unit}, dan
            kerugian <span className="font-bold text-negative">{formatRupiah(estimatedLoss)}</span>{" "}
            dicatat sebagai beban.
          </p>
        </div>
      </div>
    </SidePanel>
  );
}
