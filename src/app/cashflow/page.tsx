"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Receipt,
  ShoppingCart,
  Plus,
  FileText,
} from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { StatCard, SectionCard, EmptyState } from "@/components/ui/data-display";
import { FadeIn, Stagger, StaggerItem, EASE_OUT_EXPO } from "@/components/motion/motion-primitives";
import { Button } from "@/components/ui/button";
import ExpensePanel from "@/components/cashflow/ExpensePanel";
import PurchasePanel from "@/components/cashflow/PurchasePanel";
import { formatRupiah, formatDateTime } from "@/lib/format";

const EXPENSE_LABELS: Record<string, string> = {
  UTILITY: "Listrik, Air & Internet",
  RENT: "Sewa Tempat",
  SALARY: "Gaji & Upah",
  TRANSPORT: "Transport",
  SUPPLIES: "Perlengkapan",
  OTHER: "Lain-lain",
};

type TabKey = "all" | "expenses" | "purchases";

export default function CashflowPage() {
  const [cashflow, setCashflow] = useState<any>(null);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>("all");
  const [expensePanelOpen, setExpensePanelOpen] = useState(false);
  const [purchasePanelOpen, setPurchasePanelOpen] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [cashflowRes, expensesRes, purchasesRes] = await Promise.all([
        fetch("/api/reports/cashflow?days=7"),
        fetch("/api/expenses"),
        fetch("/api/purchases"),
      ]);
      const [cashflowJson, expensesJson, purchasesJson] = await Promise.all([
        cashflowRes.json(),
        expensesRes.json(),
        purchasesRes.json(),
      ]);
      if (cashflowJson.success) setCashflow(cashflowJson);
      if (expensesJson.success) setExpenses(expensesJson.expenses);
      if (purchasesJson.success) setPurchases(purchasesJson.purchases);
    } catch (err) {
      console.error("Gagal memuat data kas:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const today = cashflow?.today ?? {};
  const range = cashflow?.range ?? {};

  // Gabungkan biaya dan pembelian menjadi satu riwayat berurut waktu
  const timeline = [
    ...expenses.map((e) => ({
      id: e.id,
      kind: "expense" as const,
      number: e.expenseNumber,
      title: e.description,
      subtitle: EXPENSE_LABELS[e.category] ?? e.category,
      amount: e.amount,
      date: e.expenseDate,
      badge: e.fundSource === "BANK" ? "Transfer bank" : "Kas laci",
    })),
    ...purchases.map((p) => ({
      id: p.id,
      kind: "purchase" as const,
      number: p.purchaseNumber,
      title: `Belanja stok — ${p.supplierName ?? "Supplier"}`,
      subtitle: `${p.items?.length ?? 0} jenis barang`,
      amount: p.totalAmount,
      date: p.purchaseDate,
      badge: p.paymentType === "CREDIT" ? "Tempo / hutang" : "Bayar tunai",
    })),
  ]
    .filter((item) => (tab === "all" ? true : tab === "expenses" ? item.kind === "expense" : item.kind === "purchase"))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:p-8">
        <div className="skeleton h-16 rounded-lg" />
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-28 rounded-lg" />
          ))}
        </div>
        <div className="skeleton mt-6 h-80 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Catatan Uang Kas & Biaya Toko"
        description="Pantau seluruh pengeluaran toko: belanja stok barang ke supplier dan biaya operasional (listrik, sewa, gaji, transport)."
      >
        <Button
          variant="outline"
          onClick={() => setPurchasePanelOpen(true)}
          className="cursor-pointer rounded-xl font-bold"
        >
          <ShoppingCart className="h-4 w-4" /> Belanja Stok Barang
        </Button>
        <Button
          onClick={() => setExpensePanelOpen(true)}
          className="bg-brand text-white hover:bg-brand/90 cursor-pointer rounded-xl font-bold"
        >
          <Plus className="h-4 w-4" /> Catat Biaya Operasional
        </Button>
      </PageHeader>

      <Stagger className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" gap={0.07}>
        <StaggerItem>
          <StatCard
            label="Uang Masuk Hari Ini"
            value={today.uangMasuk ?? 0}
            icon={TrendingUp}
            tone="brand"
            caption={`${today.jumlahTransaksi ?? 0} transaksi kasir`}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Uang Keluar Hari Ini"
            value={today.uangKeluar ?? 0}
            icon={TrendingDown}
            tone="negative"
            caption={`Biaya ${formatRupiah(today.biayaOperasional ?? 0)} • stok ${formatRupiah(
              today.belanjaStok ?? 0
            )}`}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Arus Kas Hari Ini"
            value={today.arusKasBersih ?? 0}
            icon={Wallet}
            tone={(today.arusKasBersih ?? 0) >= 0 ? "positive" : "negative"}
            caption="Selisih uang masuk dan uang keluar"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Hutang Supplier Baru"
            value={range.hutangSupplierBaru ?? 0}
            icon={Receipt}
            tone={(range.hutangSupplierBaru ?? 0) > 0 ? "negative" : "neutral"}
            caption="Pembelian tempo 7 hari terakhir"
          />
        </StaggerItem>
      </Stagger>

      <FadeIn delay={0.15} className="mt-6">
        <SectionCard
          title="Riwayat Uang Keluar"
          action={
            <div className="flex gap-0.5 rounded-md bg-surface-muted p-0.5">
              {(
                [
                  { key: "all", label: "Semua" },
                  { key: "expenses", label: "Biaya" },
                  { key: "purchases", label: "Belanja Stok" },
                ] as const
              ).map((item) => {
                const isActive = tab === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setTab(item.key)}
                    className={`relative rounded px-2.5 py-1 text-[11.5px] font-medium transition-colors cursor-pointer ${
                      isActive ? "text-ink" : "text-ink-soft hover:text-ink"
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="cashflow-tab"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        className="absolute inset-0 rounded bg-surface shadow-sm"
                      />
                    )}
                    <span className="relative z-10">{item.label}</span>
                  </button>
                );
              })}
            </div>
          }
        >
          {timeline.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Belum ada pengeluaran tercatat"
              description="Catat biaya operasional atau belanja stok untuk melihat perputaran uang toko."
              action={
                <Button
                  size="sm"
                  onClick={() => setExpensePanelOpen(true)}
                  className="bg-brand text-white hover:bg-brand/90 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" /> Catat Biaya Pertama
                </Button>
              }
            />
          ) : (
            <ul className="divide-y divide-line">
              {timeline.map((item, idx) => (
                <motion.li
                  key={`${item.kind}-${item.id}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.3,
                    ease: EASE_OUT_EXPO,
                    delay: Math.min(idx * 0.03, 0.3),
                  }}
                  className="flex items-center justify-between gap-4 px-4 py-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${
                        item.kind === "purchase"
                          ? "bg-brand-soft text-brand"
                          : "bg-negative-soft text-negative"
                      }`}
                    >
                      {item.kind === "purchase" ? (
                        <ShoppingCart className="h-[15px] w-[15px]" />
                      ) : (
                        <Receipt className="h-[15px] w-[15px]" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[12.5px] font-semibold text-ink">{item.title}</p>
                      <p className="num truncate text-[11px] text-ink-muted">
                        {item.number} • {item.subtitle} • {formatDateTime(item.date)}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="num text-[13px] font-bold text-negative">
                      −{formatRupiah(item.amount)}
                    </p>
                    <p className="text-[10.5px] text-ink-muted">{item.badge}</p>
                  </div>
                </motion.li>
              ))}
            </ul>
          )}
        </SectionCard>
      </FadeIn>

      <ExpensePanel
        open={expensePanelOpen}
        onClose={() => setExpensePanelOpen(false)}
        onSaved={loadData}
      />
      <PurchasePanel
        open={purchasePanelOpen}
        onClose={() => setPurchasePanelOpen(false)}
        onSaved={loadData}
      />
    </div>
  );
}
