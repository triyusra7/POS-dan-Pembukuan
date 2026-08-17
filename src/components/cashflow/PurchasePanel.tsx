"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { SidePanel, PanelField } from "@/components/ui/side-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SPRING_SNAPPY } from "@/components/motion/motion-primitives";
import { formatNumber, parseNumberFromInput, formatRupiah } from "@/lib/format";

type Product = {
  id: string;
  sku: string;
  name: string;
  unit: string;
  costPrice: number;
  currentStock: number;
};

type PurchaseLine = {
  product: Product;
  qty: number;
  unitCostInput: string;
};

type PurchasePanelProps = {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  /** Produk yang langsung dimasukkan saat panel dibuka dari halaman inventori */
  presetProduct?: Product | null;
};

export default function PurchasePanel({
  open,
  onClose,
  onSaved,
  presetProduct = null,
}: PurchasePanelProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [lines, setLines] = useState<PurchaseLine[]>([]);
  const [supplierName, setSupplierName] = useState("");
  const [paymentType, setPaymentType] = useState<"CASH" | "CREDIT">("CASH");
  const [note, setNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [availableCash, setAvailableCash] = useState<number | null>(null);

  useEffect(() => {
    if (!open) return;
    fetch("/api/cash-drawer")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setAvailableCash(data.hasActiveShift ? data.available : null);
      })
      .catch(() => setAvailableCash(null));
  }, [open]);

  useEffect(() => {
    if (!open) return;

    setLines(
      presetProduct
        ? [
            {
              product: presetProduct,
              qty: 1,
              unitCostInput: formatNumber(presetProduct.costPrice),
            },
          ]
        : []
    );
    setSearch("");
    setSupplierName("");
    setPaymentType("CASH");
    setNote("");

    let cancelled = false;
    fetch("/api/pos/products")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.success) setProducts(data.products);
      })
      .catch(() => toast.error("Gagal memuat daftar produk"));

    return () => {
      cancelled = true;
    };
  }, [open, presetProduct]);

  const total = lines.reduce(
    (sum, line) => sum + line.qty * parseNumberFromInput(line.unitCostInput),
    0
  );
  const exceedsDrawer =
    paymentType === "CASH" && availableCash !== null && total > availableCash;

  const availableProducts = products.filter((product) => {
    const alreadyAdded = lines.some((line) => line.product.id === product.id);
    if (alreadyAdded) return false;
    if (!search.trim()) return true;
    const keyword = search.toLowerCase();
    return (
      product.name.toLowerCase().includes(keyword) || product.sku.toLowerCase().includes(keyword)
    );
  });

  function addLine(product: Product) {
    setLines((prev) => [
      ...prev,
      { product, qty: 1, unitCostInput: formatNumber(product.costPrice) },
    ]);
    setSearch("");
  }

  function updateLine(productId: string, changes: Partial<Omit<PurchaseLine, "product">>) {
    setLines((prev) =>
      prev.map((line) => (line.product.id === productId ? { ...line, ...changes } : line))
    );
  }

  function removeLine(productId: string) {
    setLines((prev) => prev.filter((line) => line.product.id !== productId));
  }

  async function handleSubmit() {
    if (lines.length === 0) {
      toast.error("Pilih minimal satu barang yang dibeli");
      return;
    }

    const invalidLine = lines.find(
      (line) => line.qty <= 0 || parseNumberFromInput(line.unitCostInput) <= 0
    );
    if (invalidLine) {
      toast.error(`Jumlah dan harga beli "${invalidLine.product.name}" belum benar`);
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierName: supplierName || "Supplier Umum",
          paymentType,
          fundSource: "CASH",
          note,
          items: lines.map((line) => ({
            productId: line.product.id,
            qty: line.qty,
            unitCost: parseNumberFromInput(line.unitCostInput),
          })),
        }),
      });
      const data = await res.json();

      if (!data.success) {
        toast.error("Gagal menyimpan", { description: data.message });
        return;
      }

      toast.success("Pembelian tersimpan", { description: data.message });
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
      size="wide"
      title="Belanja Stok ke Supplier"
      description="Stok bertambah otomatis, dan uang keluar tercatat sebagai pembelian persediaan."
      footer={
        <>
          <span className="num mr-auto text-[13px] font-bold text-ink">
            Total {formatRupiah(total)}
          </span>
          <Button variant="outline" size="sm" onClick={onClose} className="cursor-pointer">
            Batal
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={isSaving || lines.length === 0 || exceedsDrawer}
            className="bg-brand text-white hover:bg-brand/90 cursor-pointer"
          >
            {isSaving ? "Menyimpan..." : "Simpan Pembelian"}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <PanelField label="Nama Supplier" htmlFor="supplier-name">
          <Input
            id="supplier-name"
            value={supplierName}
            onChange={(e) => setSupplierName(e.target.value)}
            placeholder="Misal: CV Sumber Rejeki"
            className="h-9"
          />
        </PanelField>

        <PanelField
          label="Cara Bayar"
          hint={
            availableCash !== null
              ? `Uang tunai di laci saat ini ${formatRupiah(availableCash)}.`
              : undefined
          }
        >
          <div className="grid grid-cols-2 gap-1.5">
            {(
              [
                { value: "CASH", label: "Bayar tunai", hint: "Uang keluar dari laci sekarang" },
                { value: "CREDIT", label: "Tempo / hutang", hint: "Dicatat sebagai hutang supplier" },
              ] as const
            ).map((item) => {
              const isSelected = paymentType === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setPaymentType(item.value)}
                  className={`rounded-md border px-3 py-2.5 text-left transition-colors cursor-pointer ${
                    isSelected ? "border-brand bg-brand-soft" : "border-line hover:bg-surface-muted"
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

        {/* Daftar barang yang dibeli */}
        <div>
          <p className="mb-2 text-[12px] font-semibold text-ink">Barang yang Dibeli</p>

          <div className="space-y-2">
            <AnimatePresence initial={false} mode="popLayout">
              {lines.map((line) => {
                const unitCost = parseNumberFromInput(line.unitCostInput);
                return (
                  <motion.div
                    key={line.product.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={SPRING_SNAPPY}
                    className="rounded-md border border-line bg-surface p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-[12.5px] font-semibold text-ink">
                          {line.product.name}
                        </p>
                        <p className="num text-[11px] text-ink-muted">
                          {line.product.sku} • stok kini {line.product.currentStock}{" "}
                          {line.product.unit}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeLine(line.product.id)}
                        aria-label={`Hapus ${line.product.name}`}
                        className="shrink-0 rounded p-1 text-ink-muted transition-colors hover:bg-negative-soft hover:text-negative cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="mt-2.5 grid grid-cols-[80px_1fr_auto] items-center gap-2">
                      <div>
                        <label className="mb-1 block text-[10.5px] text-ink-muted">Jumlah</label>
                        <Input
                          type="number"
                          min={1}
                          value={line.qty}
                          onChange={(e) =>
                            updateLine(line.product.id, {
                              qty: Math.max(1, parseInt(e.target.value) || 1),
                            })
                          }
                          className="num h-8 text-center"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[10.5px] text-ink-muted">
                          Harga beli / {line.product.unit}
                        </label>
                        <Input
                          value={line.unitCostInput}
                          onChange={(e) =>
                            updateLine(line.product.id, {
                              unitCostInput: formatNumber(parseNumberFromInput(e.target.value)),
                            })
                          }
                          className="num h-8 text-right"
                        />
                      </div>
                      <div className="pt-4 text-right">
                        <span className="num text-[12.5px] font-bold text-ink">
                          {formatRupiah(line.qty * unitCost)}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Pencarian produk untuk ditambahkan */}
          <div className="mt-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-muted" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari produk untuk ditambahkan..."
                className="h-9 pl-9"
              />
            </div>

            {search.trim() && (
              <ul className="mt-1.5 max-h-52 overflow-y-auto rounded-md border border-line">
                {availableProducts.slice(0, 20).map((product) => (
                  <li key={product.id}>
                    <button
                      type="button"
                      onClick={() => addLine(product)}
                      className="flex w-full items-center justify-between gap-3 border-b border-line px-3 py-2 text-left transition-colors last:border-0 hover:bg-surface-muted cursor-pointer"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-[12.5px] font-medium text-ink">
                          {product.name}
                        </span>
                        <span className="num block text-[11px] text-ink-muted">
                          {product.sku} • modal {formatRupiah(product.costPrice)}
                        </span>
                      </span>
                      <Plus className="h-3.5 w-3.5 shrink-0 text-brand" />
                    </button>
                  </li>
                ))}
                {availableProducts.length === 0 && (
                  <li className="px-3 py-3 text-center text-[12px] text-ink-muted">
                    Produk tidak ditemukan
                  </li>
                )}
              </ul>
            )}
          </div>
        </div>

        <PanelField label="Catatan" htmlFor="purchase-note">
          <Input
            id="purchase-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Opsional — misal: nomor nota supplier"
            className="h-9"
          />
        </PanelField>

        {exceedsDrawer && (
          <p className="rounded-md border border-negative/30 bg-negative-soft px-3 py-2.5 text-[12px] leading-relaxed text-negative">
            Total belanja melebihi uang tunai di laci ({formatRupiah(availableCash ?? 0)}). Kurangi
            jumlah barang, atau pilih pembayaran tempo.
          </p>
        )}
      </div>
    </SidePanel>
  );
}
