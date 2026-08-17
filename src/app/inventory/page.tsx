"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Package,
  Search,
  AlertTriangle,
  Plus,
  ArrowDownToLine,
  PackageX,
  Settings2,
} from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { SectionCard, EmptyState, StatusDot } from "@/components/ui/data-display";
import { FadeIn, EASE_OUT_EXPO } from "@/components/motion/motion-primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ProductPanel from "@/components/inventory/ProductPanel";
import StockReducePanel from "@/components/inventory/StockReducePanel";
import PurchasePanel from "@/components/cashflow/PurchasePanel";
import { formatRupiah } from "@/lib/format";

export default function InventoryPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [productPanelOpen, setProductPanelOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [reducePanelOpen, setReducePanelOpen] = useState(false);
  const [reduceTarget, setReduceTarget] = useState<any | null>(null);
  const [restockPanelOpen, setRestockPanelOpen] = useState(false);
  const [restockTarget, setRestockTarget] = useState<any | null>(null);

  const loadProducts = useCallback(async () => {
    try {
      const res = await fetch(`/api/pos/products?search=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (data.success) {
        setProducts(data.products);
        setCategories(data.categories ?? []);
      }
    } catch (err) {
      console.error("Gagal memuat produk:", err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const lowStockCount = products.filter((p) => p.currentStock <= p.minStock).length;
  const totalStockValue = products.reduce((sum, p) => sum + p.currentStock * p.costPrice, 0);

  function openCreatePanel() {
    setEditingProduct(null);
    setProductPanelOpen(true);
  }

  function openEditPanel(product: any) {
    setEditingProduct(product);
    setProductPanelOpen(true);
  }

  function openRestockPanel(product: any) {
    setRestockTarget(product);
    setRestockPanelOpen(true);
  }

  function openReducePanel(product: any) {
    setReduceTarget(product);
    setReducePanelOpen(true);
  }

  return (
    <div className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Daftar Stok Barang Toko"
        description="Kelola daftar produk, ubah harga jual & modal (HPP), tambah stok belanja barang, atau catat barang yang rusak dan hilang."
      >
        <span className="num rounded-xl border border-line bg-surface px-3 py-2 text-xs font-bold text-ink-soft shadow-2xs">
          Total {products.length} Barang • Nilai Aset Stok {formatRupiah(totalStockValue)}
        </span>
        <Button
          onClick={openCreatePanel}
          className="bg-brand text-white hover:bg-brand/90 cursor-pointer rounded-xl font-bold"
        >
          <Plus className="h-4 w-4" /> Tambah Barang Baru
        </Button>
      </PageHeader>

      <FadeIn delay={0.08} className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari berdasarkan nama barang, SKU, atau barcode..."
            className="pl-10 text-sm"
          />
        </div>
        {lowStockCount > 0 && (
          <motion.p
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
            className="flex items-center gap-2 rounded-md border border-warning/30 bg-warning-soft px-3 py-2 text-[12px] font-medium text-warning"
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            {lowStockCount} produk perlu segera diisi ulang
          </motion.p>
        )}
      </FadeIn>

      <FadeIn delay={0.14} className="mt-4">
        <SectionCard>
          {loading ? (
            <div className="space-y-2 p-4">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="skeleton h-12 rounded-md" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <EmptyState
              icon={Package}
              title="Belum ada produk"
              description="Tambahkan produk pertama agar bisa dijual di layar kasir."
              action={
                <Button
                  size="sm"
                  onClick={openCreatePanel}
                  className="bg-brand text-white hover:bg-brand/90 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" /> Tambah Produk
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[880px] border-collapse">
                <thead>
                  <tr className="border-b border-line text-left bg-surface-muted/30">
                    {["Nama Barang", "Kategori", "Harga Modal", "Harga Jual", "Sisa Stok", "Pilihan Aksi"].map(
                      (heading, idx) => (
                        <th
                          key={heading}
                          className={`px-4 py-3 text-xs font-bold text-ink-muted ${
                            idx >= 2 && idx <= 4 ? "text-right" : ""
                          } ${idx === 5 ? "text-right" : ""}`}
                        >
                          {heading}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {products.map((product, idx) => {
                    const isOut = product.currentStock <= 0;
                    const isLow = product.currentStock <= product.minStock;
                    return (
                      <motion.tr
                        key={product.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.25,
                          ease: EASE_OUT_EXPO,
                          delay: Math.min(idx * 0.02, 0.25),
                        }}
                        className="border-b border-line last:border-0 transition-colors hover:bg-surface-muted/60"
                      >
                        <td className="px-4 py-3">
                          <p className="text-xs sm:text-[13px] font-bold text-ink">{product.name}</p>
                          <p className="num text-xs text-ink-muted">{product.sku}</p>
                        </td>
                        <td className="px-4 py-3 text-xs text-ink-soft">
                          {product.category?.name ?? "—"}
                        </td>
                        <td className="num px-4 py-3 text-right text-xs text-ink-soft">
                          {formatRupiah(product.costPrice)}
                        </td>
                        <td className="num px-4 py-3 text-right text-xs font-bold text-ink">
                          {formatRupiah(product.sellingPrice)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="num inline-flex items-center gap-1.5 text-xs font-bold text-ink">
                            <StatusDot
                              tone={isOut ? "negative" : isLow ? "warning" : "positive"}
                            />
                            {product.currentStock} {product.unit}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Tombol Tambah Stok */}
                            <button
                              type="button"
                              onClick={() => openRestockPanel(product)}
                              title="Tambah stok barang baru dari supplier"
                              aria-label={`Tambah stok barang ${product.name}`}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-brand/40 bg-brand-soft/80 px-2.5 py-1.5 text-xs font-bold text-brand shadow-2xs transition-all hover:bg-brand hover:text-white active:scale-95 cursor-pointer"
                            >
                              <ArrowDownToLine className="h-3.5 w-3.5" />
                              <span>+ Stok</span>
                            </button>

                            {/* Tombol Catat Barang Rusak / Hilang */}
                            <button
                              type="button"
                              onClick={() => openReducePanel(product)}
                              title="Catat barang rusak, hilang, atau kadaluarsa"
                              aria-label={`Catat barang rusak atau hilang ${product.name}`}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-negative/30 bg-negative-soft/70 px-2.5 py-1.5 text-xs font-bold text-negative shadow-2xs transition-all hover:bg-negative hover:text-white active:scale-95 cursor-pointer"
                            >
                              <PackageX className="h-3.5 w-3.5" />
                              <span>− Rusak</span>
                            </button>

                            {/* Tombol Ubah Data */}
                            <button
                              type="button"
                              onClick={() => openEditPanel(product)}
                              title="Ubah nama barang, barcode, atau harga jual/modal"
                              aria-label={`Ubah data ${product.name}`}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs font-bold text-ink shadow-2xs transition-all hover:border-brand hover:text-brand hover:bg-[#F3E8BC]/30 active:scale-95 cursor-pointer"
                            >
                              <Settings2 className="h-3.5 w-3.5" />
                              <span>Ubah</span>
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </FadeIn>

      <ProductPanel
        open={productPanelOpen}
        onClose={() => setProductPanelOpen(false)}
        onSaved={loadProducts}
        categories={categories}
        product={editingProduct}
      />
      <StockReducePanel
        open={reducePanelOpen}
        onClose={() => setReducePanelOpen(false)}
        onSaved={loadProducts}
        product={reduceTarget}
      />
      <PurchasePanel
        open={restockPanelOpen}
        onClose={() => setRestockPanelOpen(false)}
        onSaved={loadProducts}
        presetProduct={restockTarget}
      />
    </div>
  );
}
