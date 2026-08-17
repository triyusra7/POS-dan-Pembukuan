"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  QrCode,
  Banknote,
  Printer,
  CheckCircle2,
  ShoppingBag,
  RotateCcw,
  Loader2,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidePanel } from "@/components/ui/side-panel";
import { StatusDot, EmptyState } from "@/components/ui/data-display";
import QrisMockup from "@/components/pos/QrisMockup";
import { useStore } from "@/components/layout/StoreProvider";
import {
  AnimatedNumber,
  EASE_OUT_EXPO,
  SPRING_SNAPPY,
  SPRING_BOUNCY,
} from "@/components/motion/motion-primitives";
import { toast } from "sonner";
import { formatRupiah, formatNumber, parseNumberFromInput } from "@/lib/format";

interface Product {
  id: string;
  sku: string;
  barcode: string | null;
  name: string;
  costPrice: number;
  sellingPrice: number;
  currentStock: number;
  minStock: number;
  unit: string;
  category: { id: string; name: string } | null;
}

interface CartItem {
  product: Product;
  qty: number;
}

interface ReceiptData {
  orderNumber: string;
  date: string;
  cashier: string;
  outlet: string;
  items: { name: string; qty: number; price: number; subtotal: number }[];
  subtotal: number;
  discount: number;
  total: number;
  amountPaid: number;
  change: number;
  paymentMethod: string;
  journalEntryNumber?: string;
}

const PAYMENT_METHODS = [
  { method: "CASH", label: "Tunai", Icon: Banknote },
  { method: "QRIS", label: "QRIS", Icon: QrCode },
  { method: "KASBON", label: "Kasbon", Icon: CreditCard },
] as const;

export default function PosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "QRIS" | "KASBON">("CASH");
  const [cashInput, setCashInput] = useState<string>("");
  const [discountInput, setDiscountInput] = useState<string>("0");
  const [isCheckingOut, setIsCheckingOut] = useState<boolean>(false);
  const [receiptOpen, setReceiptOpen] = useState<boolean>(false);
  const [lastReceipt, setLastReceipt] = useState<ReceiptData | null>(null);
  const [qrisConfirmed, setQrisConfirmed] = useState<boolean>(false);
  const { storeName } = useStore();

  const searchInputRef = useRef<HTMLInputElement>(null);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/pos/products?search=${encodeURIComponent(searchQuery)}&categoryId=${selectedCategory}`
      );
      const data = await res.json();
      if (data.success) {
        setProducts(data.products);
        setCategories(data.categories);
      }
    } catch (err) {
      console.error("Gagal load produk:", err);
    }
  }, [searchQuery, selectedCategory]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // F2 memindahkan fokus ke kolom pencarian, kebiasaan kasir di mesin lama
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F2") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Konfirmasi QRIS diulang tiap kali metode atau nominal berubah
  useEffect(() => {
    setQrisConfirmed(false);
  }, [paymentMethod, cart, discountInput]);

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { product, qty: 1 }];
    });
  }

  function updateQty(productId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.qty + delta;
            return newQty > 0 ? { ...item, qty: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  }

  function removeFromCart(productId: string) {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  }

  function clearCart() {
    setCart([]);
    setCashInput("");
    setDiscountInput("0");
  }

  const subtotal = cart.reduce((sum, item) => sum + item.qty * item.product.sellingPrice, 0);
  const discount = parseNumberFromInput(discountInput);
  const totalAmount = Math.max(0, subtotal - discount);
  const rawCashPaid = parseNumberFromInput(cashInput);
  const cashPaid = paymentMethod === "CASH" ? rawCashPaid : totalAmount;
  const changeAmount = Math.max(0, cashPaid - totalAmount);
  const isCashInsufficient = paymentMethod === "CASH" && cashPaid < totalAmount;
  const isQrisPending = paymentMethod === "QRIS" && !qrisConfirmed;
  const canCheckout = cart.length > 0 && !isCheckingOut && !isCashInsufficient && !isQrisPending;

  async function handleCheckout() {
    if (cart.length === 0) {
      toast.error("Keranjang belanja masih kosong");
      return;
    }
    if (isCashInsufficient) {
      toast.error("Uang tunai yang diterima kurang dari total belanja");
      return;
    }
    if (isQrisPending) {
      toast.error("Konfirmasi dulu bahwa pembayaran QRIS sudah masuk");
      return;
    }

    setIsCheckingOut(true);
    try {
      const res = await fetch("/api/pos/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((item) => ({
            productId: item.product.id,
            qty: item.qty,
            unitPrice: item.product.sellingPrice,
            unitCost: item.product.costPrice,
          })),
          paymentMethod,
          amountPaid: cashPaid,
          discount,
        }),
      });

      const resData = await res.json();

      if (resData.success) {
        toast.success("Transaksi berhasil", {
          description: `Nota #${resData.receipt.orderNumber} • jurnal #${resData.journalEntryNumber} dibukukan otomatis`,
        });
        setLastReceipt({ ...resData.receipt, journalEntryNumber: resData.journalEntryNumber });
        setReceiptOpen(true);
        clearCart();
        fetchProducts();
      } else {
        toast.error("Gagal checkout", { description: resData.message });
      }
    } catch (err: any) {
      toast.error("Terjadi kesalahan", { description: err.message });
    } finally {
      setIsCheckingOut(false);
    }
  }

  const categoryTabs = [
    { id: "all", name: `Semua (${products.length})` },
    ...categories.map((c) => ({ id: c.id, name: c.name })),
  ];

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col overflow-hidden lg:flex-row">
      {/* Katalog produk */}
      <div className="flex h-full w-full flex-col overflow-hidden border-r border-line lg:w-[58%]">
        <div className="space-y-3 border-b border-line bg-surface p-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
            <Input
              ref={searchInputRef}
              type="text"
              placeholder="Scan barcode atau cari produk… (F2)"
              className="h-11 pl-10.5 text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>

          <div className="scrollbar-none flex gap-1.5 overflow-x-auto pb-0.5">
            {categoryTabs.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <motion.button
                  key={cat.id}
                  whileTap={{ scale: 0.96 }}
                  transition={SPRING_SNAPPY}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`relative whitespace-nowrap rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors duration-150 cursor-pointer ${
                    isSelected ? "text-white" : "text-ink-soft hover:bg-surface-muted hover:text-ink"
                  }`}
                >
                  {isSelected && (
                    <motion.span
                      layoutId="pos-category"
                      transition={SPRING_SNAPPY}
                      className="absolute inset-0 rounded-md bg-brand"
                    />
                  )}
                  <span className="relative z-10">{cat.name}</span>
                </motion.button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-canvas p-4">
          <motion.div layout className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-4">
            <AnimatePresence mode="popLayout">
              {products.map((product, idx) => {
                const isOutOfStock = product.currentStock <= 0;
                const isLowStock = product.currentStock <= product.minStock;

                return (
                  <motion.button
                    key={product.id}
                    layout
                    type="button"
                    initial={{ opacity: 0, y: 12, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{
                      duration: 0.3,
                      ease: EASE_OUT_EXPO,
                      delay: Math.min(idx * 0.02, 0.3),
                    }}
                    whileHover={isOutOfStock ? undefined : { y: -4, scale: 1.02 }}
                    whileTap={isOutOfStock ? undefined : { scale: 0.94 }}
                    disabled={isOutOfStock}
                    onClick={() => addToCart(product)}
                    className={`flex flex-col justify-between rounded-lg border p-3 text-left transition-shadow ${
                      isOutOfStock
                        ? "cursor-not-allowed border-line bg-surface-muted opacity-60"
                        : "cursor-pointer border-line bg-surface hover:border-brand hover:shadow-md"
                    }`}
                  >
                    <div>
                      <div className="mb-1.5 flex items-start justify-between gap-1.5">
                        <span className="num text-[10px] uppercase tracking-wide text-ink-muted">
                          {product.sku}
                        </span>
                        <span className="num flex shrink-0 items-center gap-1 text-[10.5px] font-semibold text-ink-soft">
                          <StatusDot
                            tone={isOutOfStock ? "negative" : isLowStock ? "warning" : "positive"}
                          />
                          {isOutOfStock ? "Habis" : product.currentStock}
                        </span>
                      </div>
                      <p className="line-clamp-2 text-[12.5px] font-semibold leading-snug text-ink">
                        {product.name}
                      </p>
                    </div>
                    <div className="mt-3 flex items-baseline justify-between border-t border-line pt-2">
                      <span className="num text-[12.5px] font-bold text-ink">
                        {formatRupiah(product.sellingPrice)}
                      </span>
                      <span className="text-[10.5px] text-ink-muted">/{product.unit}</span>
                    </div>
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </motion.div>

          {products.length === 0 && (
            <EmptyState icon={ShoppingBag} title="Produk tidak ditemukan" />
          )}
        </div>
      </div>

      {/* Keranjang & pembayaran */}
      <div className="flex h-full w-full flex-col overflow-hidden border-t border-line bg-surface lg:w-[42%] lg:border-t-0">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-ink-soft" />
            <span className="text-[13.5px] font-bold tracking-tight text-ink">Keranjang</span>
            <motion.span
              key={cart.reduce((s, i) => s + i.qty, 0)}
              initial={{ scale: 1.5, color: "#035352" }}
              animate={{ scale: 1, color: "#8e8e97" }}
              transition={{ scale: SPRING_BOUNCY, color: { duration: 0.45, ease: "easeOut" } }}
              className="num inline-block text-[11.5px] font-semibold"
            >
              {cart.reduce((s, i) => s + i.qty, 0)} item
            </motion.span>
          </div>
          {cart.length > 0 && (
            <button
              type="button"
              onClick={clearCart}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-[11.5px] font-medium text-ink-soft transition-colors hover:bg-negative-soft hover:text-negative cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" /> Reset
            </button>
          )}
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto p-3">
          <AnimatePresence mode="popLayout" initial={false}>
            {cart.map((item) => (
              <motion.div
                key={item.product.id}
                layout
                initial={{ opacity: 0, x: 40, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -40, scale: 0.85 }}
                transition={SPRING_BOUNCY}
                className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface p-2.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] font-semibold text-ink">
                    {item.product.name}
                  </p>
                  <p className="num mt-0.5 text-[11px] text-ink-muted">
                    {formatRupiah(item.product.sellingPrice)} × {item.qty} ={" "}
                    <span className="font-semibold text-ink">
                      {formatRupiah(item.qty * item.product.sellingPrice)}
                    </span>
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-1 rounded-md bg-surface-muted p-0.5">
                  <motion.button
                    whileHover={{ scale: 1.12 }}
                    whileTap={{ scale: 0.82 }}
                    transition={SPRING_BOUNCY}
                    onClick={() => updateQty(item.product.id, -1)}
                    aria-label={`Kurangi ${item.product.name}`}
                    className="flex h-6 w-6 items-center justify-center rounded bg-surface text-ink transition-colors hover:bg-line cursor-pointer"
                  >
                    <Minus className="h-3 w-3" />
                  </motion.button>
                  <motion.span
                    key={item.qty}
                    initial={{ scale: 1.75, color: "#035352" }}
                    animate={{ scale: 1, color: "#18181b" }}
                    // Warna tidak boleh ikut memantul — pegas akan melewati batas kanal warna
                    transition={{ scale: SPRING_BOUNCY, color: { duration: 0.45, ease: "easeOut" } }}
                    className="num inline-block w-6 text-center text-[12px] font-bold"
                  >
                    {item.qty}
                  </motion.span>
                  <motion.button
                    whileHover={{ scale: 1.12 }}
                    whileTap={{ scale: 0.82 }}
                    transition={SPRING_BOUNCY}
                    onClick={() => updateQty(item.product.id, 1)}
                    aria-label={`Tambah ${item.product.name}`}
                    className="flex h-6 w-6 items-center justify-center rounded bg-surface text-ink transition-colors hover:bg-line cursor-pointer"
                  >
                    <Plus className="h-3 w-3" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.12 }}
                    whileTap={{ scale: 0.82 }}
                    transition={SPRING_BOUNCY}
                    onClick={() => removeFromCart(item.product.id)}
                    aria-label={`Hapus ${item.product.name}`}
                    className="ml-0.5 flex h-6 w-6 items-center justify-center rounded text-ink-muted transition-colors hover:bg-negative-soft hover:text-negative cursor-pointer"
                  >
                    <Trash2 className="h-3 w-3" />
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {cart.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.35 }}
              className="flex h-full min-h-[160px] flex-col items-center justify-center text-center"
            >
              <motion.div
                animate={{ y: [0, -7, 0] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              >
                <ShoppingBag className="h-7 w-7 text-line-strong" />
              </motion.div>
              <p className="mt-2 text-[12px] text-ink-muted">
                Pilih produk di katalog untuk mulai transaksi
              </p>
            </motion.div>
          )}
        </div>

        <div className="space-y-3 border-t border-line p-4">
          <div className="space-y-1.5">
            <div className="flex justify-between text-[12px] text-ink-soft">
              <span>Subtotal</span>
              <span className="num font-medium">{formatRupiah(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-[12.5px] text-ink-soft">
              <label htmlFor="pos-discount" className="font-medium">Diskon</label>
              <Input
                id="pos-discount"
                value={discountInput}
                onChange={(e) => setDiscountInput(formatNumber(parseNumberFromInput(e.target.value)))}
                className="num h-10 w-32 text-right font-medium"
              />
            </div>
            <div className="flex items-baseline justify-between border-t border-line pt-2">
              <span className="text-sm font-bold text-ink">Total</span>
              <AnimatedNumber
                value={totalAmount}
                format={(v) => formatRupiah(Math.round(v))}
                duration={0.4}
                className="num text-[22px] font-extrabold text-ink"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {PAYMENT_METHODS.map(({ method, label, Icon }) => {
              const isSelected = paymentMethod === method;
              return (
                <motion.button
                  key={method}
                  whileTap={{ scale: 0.96 }}
                  transition={SPRING_SNAPPY}
                  onClick={() => setPaymentMethod(method)}
                  className={`relative flex items-center justify-center gap-2 rounded-xl border py-2.5 min-h-[44px] text-xs font-bold transition-colors duration-150 cursor-pointer ${
                    isSelected
                      ? "border-transparent text-white"
                      : "border-line text-ink-soft hover:bg-surface-muted hover:text-ink"
                  }`}
                >
                  {isSelected && (
                    <motion.span
                      layoutId="pos-payment"
                      transition={SPRING_SNAPPY}
                      className="absolute inset-0 rounded-xl bg-brand"
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    <Icon className="h-4 w-4" /> {label}
                  </span>
                </motion.button>
              );
            })}
          </div>

          <AnimatePresence initial={false} mode="wait">
            {paymentMethod === "CASH" && (
              <motion.div
                key="cash"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: EASE_OUT_EXPO }}
                className="overflow-hidden"
              >
                <div className="space-y-2.5 rounded-xl border border-line bg-surface-muted p-3">
                  <div className="flex items-center gap-2.5">
                    <span className="shrink-0 text-xs font-bold text-ink-soft">
                      Uang diterima
                    </span>
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-ink-muted">
                        Rp
                      </span>
                      <Input
                        value={cashInput}
                        onChange={(e) =>
                          setCashInput(formatNumber(parseNumberFromInput(e.target.value)))
                        }
                        placeholder="0"
                        className="num h-11 bg-surface pl-9 text-right font-extrabold text-base"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {[
                      { label: "Uang Pas", value: totalAmount },
                      { label: "20rb", value: 20000 },
                      { label: "50rb", value: 50000 },
                      { label: "100rb", value: 100000 },
                    ].map((quick) => (
                      <button
                        key={quick.label}
                        type="button"
                        onClick={() => setCashInput(formatNumber(quick.value))}
                        className="num flex-1 rounded-lg border border-line bg-surface py-2 min-h-[38px] text-xs font-bold text-ink-soft transition-all hover:border-brand hover:text-brand hover:shadow-2xs active:scale-95 cursor-pointer"
                      >
                        {quick.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center justify-between border-t border-line pt-2">
                    <span className="text-xs font-semibold text-ink-soft">Kembalian</span>
                    <span
                      className={`num text-sm font-bold ${
                        isCashInsufficient ? "text-negative" : "text-positive"
                      }`}
                    >
                      {isCashInsufficient ? "Kurang bayar" : formatRupiah(changeAmount)}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {paymentMethod === "QRIS" && (
              <motion.div
                key="qris"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: EASE_OUT_EXPO }}
                className="overflow-hidden"
              >
                <div className="rounded-lg border border-line bg-surface-muted p-3">
                  <div className="flex items-start gap-3">
                    <QrisMockup merchantName={storeName} amount={totalAmount} size={132} />

                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                        Tagihan QRIS
                      </p>
                      <p className="num mt-1 text-[18px] font-bold leading-none text-ink">
                        {formatRupiah(totalAmount)}
                      </p>

                      <p className="mt-2.5 flex items-start gap-1.5 rounded border border-warning/30 bg-warning-soft px-2 py-1.5 text-[10.5px] leading-snug text-warning">
                        <Info className="mt-px h-3 w-3 shrink-0" />
                        Kode ini hanya peragaan tampilan dan tidak bisa dipindai.
                      </p>

                      <button
                        type="button"
                        onClick={() => setQrisConfirmed((prev) => !prev)}
                        className={`mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-md border px-2 py-2 text-[11.5px] font-semibold transition-colors cursor-pointer ${
                          qrisConfirmed
                            ? "border-positive/40 bg-positive-soft text-positive"
                            : "border-line bg-surface text-ink-soft hover:border-brand hover:text-brand"
                        }`}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {qrisConfirmed ? "Pembayaran diterima" : "Tandai sudah dibayar"}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {paymentMethod === "KASBON" && (
              <motion.p
                key="kasbon"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: EASE_OUT_EXPO }}
                className="overflow-hidden rounded-lg border border-line bg-surface-muted px-3 py-2.5 text-[11.5px] leading-relaxed text-ink-soft"
              >
                Belanja dicatat sebagai piutang pelanggan. Uang belum masuk ke laci, tetapi barang
                tetap keluar dari stok.
              </motion.p>
            )}
          </AnimatePresence>

          <motion.div
            whileHover={canCheckout ? { scale: 1.015 } : undefined}
            whileTap={canCheckout ? { scale: 0.97 } : undefined}
            transition={SPRING_BOUNCY}
          >
            <Button
              onClick={handleCheckout}
              disabled={!canCheckout}
              className="h-13 min-h-[52px] w-full bg-brand text-sm sm:text-base font-bold text-white shadow-md hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer rounded-xl"
            >
              {isCheckingOut ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" /> Memproses & membukukan…
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5" /> Selesaikan Transaksi
                </>
              )}
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Struk hasil transaksi */}
      <SidePanel
        open={receiptOpen}
        onClose={() => setReceiptOpen(false)}
        title="Struk Transaksi"
        description={lastReceipt ? `Nota #${lastReceipt.orderNumber}` : undefined}
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setReceiptOpen(false)}
              className="cursor-pointer"
            >
              Tutup
            </Button>
            <Button
              size="sm"
              onClick={() => window.print()}
              className="bg-brand text-white hover:bg-brand/90 cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5" /> Cetak Struk
            </Button>
          </>
        }
      >
        {lastReceipt && (
          <div className="space-y-4">
            <div className="rounded-lg border border-dashed border-line-strong p-4">
              <div className="border-b border-dashed border-line pb-3 text-center">
                <p className="text-[13px] font-bold text-ink">{lastReceipt.outlet}</p>
                <p className="num mt-1 text-[10.5px] text-ink-muted">
                  Nota #{lastReceipt.orderNumber}
                </p>
                <p className="text-[10.5px] text-ink-muted">Kasir: {lastReceipt.cashier}</p>
              </div>

              <ul className="space-y-1.5 border-b border-dashed border-line py-3">
                {lastReceipt.items.map((item, idx) => (
                  <li key={idx} className="flex justify-between gap-3 text-[11.5px]">
                    <span className="truncate text-ink-soft">
                      {item.name} ×{item.qty}
                    </span>
                    <span className="num shrink-0 font-semibold text-ink">
                      {formatRupiah(item.subtotal)}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="space-y-1 pt-3 text-[11.5px]">
                <div className="flex justify-between">
                  <span className="text-ink-soft">Total</span>
                  <span className="num font-bold text-ink">{formatRupiah(lastReceipt.total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-soft">Metode</span>
                  <span className="font-medium text-ink">{lastReceipt.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-soft">Dibayar</span>
                  <span className="num font-medium text-ink">
                    {formatRupiah(lastReceipt.amountPaid)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-soft">Kembalian</span>
                  <span className="num font-bold text-positive">
                    {formatRupiah(lastReceipt.change)}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-md border border-positive/25 bg-positive-soft px-3 py-2.5">
              <p className="flex items-center gap-1.5 text-[11.5px] font-semibold text-positive">
                <CheckCircle2 className="h-3.5 w-3.5" /> Pembukuan otomatis selesai
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-ink-soft">
                Jurnal #{lastReceipt.journalEntryNumber} mencatat penjualan, kas, HPP, dan
                persediaan tanpa input manual.
              </p>
            </div>
          </div>
        )}
      </SidePanel>
    </div>
  );
}
