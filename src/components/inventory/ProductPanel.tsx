"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SidePanel, PanelField } from "@/components/ui/side-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatNumber, parseNumberFromInput, formatRupiah } from "@/lib/format";

type Category = { id: string; name: string };

type ProductPanelProps = {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  categories: Category[];
  /** Isi bila sedang mengubah produk; kosongkan untuk produk baru */
  product?: any | null;
};

export default function ProductPanel({
  open,
  onClose,
  onSaved,
  categories,
  product = null,
}: ProductPanelProps) {
  const isEditing = Boolean(product);

  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [costInput, setCostInput] = useState("");
  const [priceInput, setPriceInput] = useState("");
  const [stockInput, setStockInput] = useState("0");
  const [minStockInput, setMinStockInput] = useState("5");
  const [unit, setUnit] = useState("pcs");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(product?.name ?? "");
    setSku(product?.sku ?? "");
    setBarcode(product?.barcode ?? "");
    setCategoryId(product?.categoryId ?? "");
    setCostInput(product ? formatNumber(product.costPrice) : "");
    setPriceInput(product ? formatNumber(product.sellingPrice) : "");
    setStockInput(product ? String(product.currentStock) : "0");
    setMinStockInput(product ? String(product.minStock) : "5");
    setUnit(product?.unit ?? "pcs");
  }, [open, product]);

  const cost = parseNumberFromInput(costInput);
  const price = parseNumberFromInput(priceInput);
  const margin = price - cost;
  const marginPercent = cost > 0 ? (margin / cost) * 100 : 0;

  async function handleSubmit() {
    if (!name.trim()) {
      toast.error("Nama produk wajib diisi");
      return;
    }
    if (!isEditing && !sku.trim()) {
      toast.error("SKU wajib diisi");
      return;
    }
    if (price <= 0) {
      toast.error("Harga jual harus lebih dari nol");
      return;
    }

    setIsSaving(true);
    try {
      const payload = isEditing
        ? {
            id: product.id,
            name,
            costPrice: cost,
            sellingPrice: price,
            minStock: parseInt(minStockInput) || 0,
            unit,
            barcode,
            categoryId: categoryId || null,
          }
        : {
            name,
            sku,
            barcode,
            categoryId: categoryId || null,
            costPrice: cost,
            sellingPrice: price,
            currentStock: parseInt(stockInput) || 0,
            minStock: parseInt(minStockInput) || 0,
            unit,
          };

      const res = await fetch("/api/products", {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!data.success) {
        toast.error("Gagal menyimpan", { description: data.message });
        return;
      }

      toast.success(isEditing ? "Produk diperbarui" : "Produk ditambahkan", {
        description: data.message,
      });
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
      title={isEditing ? "Ubah Produk" : "Tambah Produk Baru"}
      description={
        isEditing
          ? "Perubahan harga berlaku untuk transaksi berikutnya."
          : "Produk langsung muncul di katalog kasir setelah disimpan."
      }
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} className="cursor-pointer">
            Batal
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={isSaving}
            className="bg-brand text-white hover:bg-brand/90 cursor-pointer"
          >
            {isSaving ? "Menyimpan..." : isEditing ? "Simpan Perubahan" : "Tambah Produk"}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <PanelField label="Nama Produk" htmlFor="product-name">
          <Input
            id="product-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Misal: Kopi Susu Gula Aren 250ml"
            className="h-9"
          />
        </PanelField>

        <div className="grid grid-cols-2 gap-3">
          <PanelField
            label="SKU"
            htmlFor="product-sku"
            hint={isEditing ? "SKU tidak bisa diubah" : undefined}
          >
            <Input
              id="product-sku"
              value={sku}
              onChange={(e) => setSku(e.target.value.toUpperCase())}
              placeholder="KOP-001"
              disabled={isEditing}
              className="h-9 uppercase"
            />
          </PanelField>

          <PanelField label="Satuan" htmlFor="product-unit">
            <Input
              id="product-unit"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="pcs / botol / kg"
              className="h-9"
            />
          </PanelField>
        </div>

        <PanelField label="Kategori">
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setCategoryId("")}
              className={`rounded-md border px-2.5 py-1.5 text-[12px] font-medium transition-colors cursor-pointer ${
                categoryId === ""
                  ? "border-brand bg-brand-soft text-brand"
                  : "border-line text-ink-soft hover:bg-surface-muted"
              }`}
            >
              Tanpa kategori
            </button>
            {categories.map((category) => {
              const isSelected = categoryId === category.id;
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setCategoryId(category.id)}
                  className={`rounded-md border px-2.5 py-1.5 text-[12px] font-medium transition-colors cursor-pointer ${
                    isSelected
                      ? "border-brand bg-brand-soft text-brand"
                      : "border-line text-ink-soft hover:bg-surface-muted"
                  }`}
                >
                  {category.name}
                </button>
              );
            })}
          </div>
        </PanelField>

        <div className="grid grid-cols-2 gap-3">
          <PanelField label="Harga Modal (HPP)" htmlFor="product-cost">
            <Input
              id="product-cost"
              value={costInput}
              onChange={(e) => setCostInput(formatNumber(parseNumberFromInput(e.target.value)))}
              placeholder="0"
              className="num h-9 text-right"
            />
          </PanelField>

          <PanelField label="Harga Jual" htmlFor="product-price">
            <Input
              id="product-price"
              value={priceInput}
              onChange={(e) => setPriceInput(formatNumber(parseNumberFromInput(e.target.value)))}
              placeholder="0"
              className="num h-9 text-right"
            />
          </PanelField>
        </div>

        {price > 0 && cost > 0 && (
          <div className="rounded-md border border-line bg-surface-muted px-3 py-2.5">
            <p className="num text-[12.5px] text-ink">
              Untung per {unit}:{" "}
              <span className={`font-bold ${margin >= 0 ? "text-positive" : "text-negative"}`}>
                {formatRupiah(margin)}
              </span>{" "}
              <span className="text-ink-muted">({marginPercent.toFixed(1)}% dari modal)</span>
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {!isEditing && (
            <PanelField label="Stok Awal" htmlFor="product-stock">
              <Input
                id="product-stock"
                type="number"
                min={0}
                value={stockInput}
                onChange={(e) => setStockInput(e.target.value)}
                className="num h-9 text-right"
              />
            </PanelField>
          )}

          <PanelField
            label="Batas Stok Minimum"
            htmlFor="product-min-stock"
            hint="Peringatan muncul bila stok menyentuh angka ini."
          >
            <Input
              id="product-min-stock"
              type="number"
              min={0}
              value={minStockInput}
              onChange={(e) => setMinStockInput(e.target.value)}
              className="num h-9 text-right"
            />
          </PanelField>
        </div>

        <PanelField label="Barcode" htmlFor="product-barcode" hint="Opsional">
          <Input
            id="product-barcode"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            placeholder="899123456001"
            className="num h-9"
          />
        </PanelField>
      </div>
    </SidePanel>
  );
}
