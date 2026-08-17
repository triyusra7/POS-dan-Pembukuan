"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ShoppingBag,
  AlertTriangle,
  ArrowRight,
  Package,
} from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { StatCard, SectionCard, EmptyState } from "@/components/ui/data-display";
import { FadeIn, Stagger, StaggerItem, EASE_OUT_EXPO } from "@/components/motion/motion-primitives";
import { formatRupiah } from "@/lib/format";
import BusinessAdvisor from "@/components/dashboard/BusinessAdvisor";

type CashflowTrendPoint = { label: string; masuk: number; keluar: number };

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [cashflow, setCashflow] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [dashboardRes, cashflowRes] = await Promise.all([
        fetch("/api/reports/dashboard"),
        fetch("/api/reports/cashflow?days=7"),
      ]);
      const [dashboardJson, cashflowJson] = await Promise.all([
        dashboardRes.json(),
        cashflowRes.json(),
      ]);
      if (dashboardJson.success) setData(dashboardJson);
      if (cashflowJson.success) setCashflow(cashflowJson);
    } catch (err) {
      console.error("Gagal memuat ringkasan:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const kpis = data?.kpis ?? {};
  const topProducts = data?.topProducts ?? [];
  const lowStockProducts = data?.lowStockProducts ?? [];
  const trend: CashflowTrendPoint[] = cashflow?.trend ?? [];
  const breakdown = cashflow?.breakdown ?? [];

  const maxFlow = Math.max(
    ...trend.flatMap((t) => [t.masuk, t.keluar]),
    100000
  );

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:p-8">
        <div className="skeleton h-16 rounded-lg" />
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-28 rounded-lg" />
          ))}
        </div>
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="skeleton h-72 rounded-lg lg:col-span-2" />
          <div className="skeleton h-72 rounded-lg" />
        </div>
      </div>
    );
  }

  const arusKas = kpis.arusKasBersihHariIni ?? 0;

  return (
    <div className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Ringkasan Toko Hari Ini"
        description="Pantau uang hasil penjualan kasir, pengeluaran belanja stok atau biaya toko, dan total sisa uang tunai di laci."
      >
        <Link
          href="/cashflow"
          className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-xs font-semibold text-ink-soft transition-colors hover:border-brand hover:bg-[#F3E8BC]/30 hover:text-brand"
        >
          Catat Pengeluaran & Biaya <ArrowRight className="h-4 w-4" />
        </Link>
      </PageHeader>

      {/* Empat angka pokok yang dicari pemilik toko */}
      <Stagger className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" gap={0.07}>
        <StaggerItem>
          <StatCard
            label="Total Penjualan Hari Ini"
            value={kpis.omzetHariIni ?? 0}
            icon={TrendingUp}
            tone="brand"
            emphasis
            caption={`${kpis.totalTransaksi ?? 0} transaksi berhasil • untung kotor ${formatRupiah(
              kpis.labaKotorHariIni ?? 0
            )}`}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Total Uang Keluar Hari Ini"
            value={kpis.uangKeluarHariIni ?? 0}
            icon={TrendingDown}
            tone="negative"
            emphasis
            caption={`Belanja barang ${formatRupiah(
              kpis.belanjaStokHariIni ?? 0
            )} • biaya operasional ${formatRupiah(kpis.biayaOperasionalHariIni ?? 0)}`}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Sisa Uang Masuk Hari Ini"
            value={arusKas}
            icon={Wallet}
            tone={arusKas >= 0 ? "positive" : "negative"}
            caption={
              arusKas >= 0
                ? "Pemasukan hari ini lebih besar dari pengeluaran"
                : "Pengeluaran hari ini lebih besar dari pemasukan"
            }
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Uang Tunai di Laci Kasir"
            value={kpis.kasTokoAktual ?? 0}
            icon={ShoppingBag}
            caption="Modal awal kasir + tunai masuk − uang keluar"
          />
        </StaggerItem>
      </Stagger>

      {/* Asisten Pintar Bisnis, Hitung Untung/Rugi & Belajar Keuangan */}
      <FadeIn delay={0.1} className="mt-6">
        <BusinessAdvisor
          kpis={kpis}
          topProducts={topProducts}
          lowStockProducts={lowStockProducts}
        />
      </FadeIn>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Perputaran uang 7 hari */}
        <FadeIn delay={0.12} className="lg:col-span-2">
          <SectionCard
            title="Grafik Keluar Masuk Uang (7 Hari Terakhir)"
            className="h-full"
            action={
              <div className="flex items-center gap-3 text-xs font-semibold text-ink-soft">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-brand" /> Uang Masuk
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-negative" /> Uang Keluar
                </span>
              </div>
            }
          >
            <div className="px-4 py-5">
              <div className="flex h-44 items-end gap-3">
                {trend.map((point, idx) => {
                  const masukHeight = (point.masuk / maxFlow) * 100;
                  const keluarHeight = (point.keluar / maxFlow) * 100;
                  return (
                    <div key={point.label} className="flex h-full flex-1 flex-col justify-end gap-2">
                      <div className="flex h-full items-end justify-center gap-1">
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${Math.max(2, masukHeight)}%` }}
                          transition={{ duration: 0.6, ease: EASE_OUT_EXPO, delay: 0.2 + idx * 0.05 }}
                          className="w-full max-w-[16px] rounded-sm bg-brand"
                          title={`Masuk ${point.label}: ${formatRupiah(point.masuk)}`}
                        />
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${Math.max(2, keluarHeight)}%` }}
                          transition={{ duration: 0.6, ease: EASE_OUT_EXPO, delay: 0.25 + idx * 0.05 }}
                          className="w-full max-w-[16px] rounded-sm bg-negative"
                          title={`Keluar ${point.label}: ${formatRupiah(point.keluar)}`}
                        />
                      </div>
                      <span className="truncate text-center text-[10.5px] font-medium text-ink-muted">
                        {point.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3 border-t border-line pt-4">
                <div>
                  <p className="text-[11px] text-ink-muted">Masuk 7 hari</p>
                  <p className="num mt-1 text-[14px] font-bold text-brand">
                    {formatRupiah(cashflow?.range?.totalMasuk ?? 0)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-ink-muted">Keluar 7 hari</p>
                  <p className="num mt-1 text-[14px] font-bold text-negative">
                    {formatRupiah(cashflow?.range?.totalKeluar ?? 0)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-ink-muted">Selisih bersih</p>
                  <p
                    className={`num mt-1 text-[14px] font-bold ${
                      (cashflow?.range?.arusKasBersih ?? 0) >= 0 ? "text-positive" : "text-negative"
                    }`}
                  >
                    {formatRupiah(cashflow?.range?.arusKasBersih ?? 0)}
                  </p>
                </div>
              </div>
            </div>
          </SectionCard>
        </FadeIn>

        {/* Ke mana uang keluar */}
        <FadeIn delay={0.2}>
          <SectionCard title="Uang Keluar Ke Mana" className="h-full">
            {breakdown.length === 0 ? (
              <EmptyState
                icon={TrendingDown}
                title="Belum ada pengeluaran"
                description="Catat biaya operasional atau belanja stok untuk melihat rinciannya di sini."
              />
            ) : (
              <ul className="divide-y divide-line">
                {breakdown.map((item: any, idx: number) => {
                  const share = cashflow?.range?.totalKeluar
                    ? (item.amount / cashflow.range.totalKeluar) * 100
                    : 0;
                  return (
                    <motion.li
                      key={item.label}
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.35, ease: EASE_OUT_EXPO, delay: 0.25 + idx * 0.05 }}
                      className="px-4 py-3"
                    >
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="truncate text-[12.5px] font-medium text-ink">
                          {item.label}
                        </span>
                        <span className="num shrink-0 text-[12.5px] font-bold text-ink">
                          {formatRupiah(item.amount)}
                        </span>
                      </div>
                      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-surface-muted">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${share}%` }}
                          transition={{ duration: 0.6, ease: EASE_OUT_EXPO, delay: 0.3 + idx * 0.05 }}
                          className="h-full rounded-full bg-negative"
                        />
                      </div>
                    </motion.li>
                  );
                })}
              </ul>
            )}
          </SectionCard>
        </FadeIn>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <FadeIn delay={0.26}>
          <SectionCard title="Daftar Produk Paling Laris" className="h-full">
            {topProducts.length === 0 ? (
              <EmptyState icon={ShoppingBag} title="Belum ada transaksi penjualan" />
            ) : (
              <ul className="divide-y divide-line">
                {topProducts.map((p: any, idx: number) => (
                  <li key={idx} className="flex items-center justify-between gap-3 px-4 py-2.5">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="num w-4 text-xs font-bold text-ink-muted">
                        {idx + 1}
                      </span>
                      <span className="truncate text-xs font-bold text-ink">{p.name}</span>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="num text-xs font-extrabold text-ink">{p.qty} terjual</p>
                      <p className="num text-[11.5px] text-ink-muted">{formatRupiah(p.revenue)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </FadeIn>

        <FadeIn delay={0.32}>
          <SectionCard
            title="Peringatan Barang Mau Habis"
            className="h-full"
            action={
              <Link
                href="/inventory"
                className="flex items-center gap-1 text-xs font-bold text-brand hover:underline"
              >
                Lihat semua stok <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            }
          >
            {lowStockProducts.length === 0 ? (
              <EmptyState
                icon={Package}
                title="Semua stok barang masih aman"
                description="Tidak ada barang yang berada di bawah jumlah batas minimum."
              />
            ) : (
              <ul className="divide-y divide-line">
                {lowStockProducts.map((product: any) => (
                  <li
                    key={product.id}
                    className="flex items-center justify-between gap-3 px-4 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[12.5px] font-medium text-ink">{product.name}</p>
                      <p className="num text-[11px] text-ink-muted">
                        {product.sku} • minimum {product.minStock} {product.unit}
                      </p>
                    </div>
                    <span className="num flex shrink-0 items-center gap-1.5 text-[12px] font-bold text-warning">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      sisa {product.currentStock}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </FadeIn>
      </div>
    </div>
  );
}
