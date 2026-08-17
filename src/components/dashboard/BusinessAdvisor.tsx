"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lightbulb,
  TrendingUp,
  TrendingDown,
  BookOpen,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowRight,
  Calculator,
  ShieldCheck,
} from "lucide-react";
import { formatRupiah } from "@/lib/format";

type BusinessAdvisorProps = {
  kpis: {
    omzetHariIni?: number;
    labaKotorHariIni?: number;
    labaBersihHariIni?: number;
    uangKeluarHariIni?: number;
    biayaOperasionalHariIni?: number;
    belanjaStokHariIni?: number;
    arusKasBersihHariIni?: number;
    kasTokoAktual?: number;
    totalTransaksi?: number;
  };
  topProducts?: Array<{ name: string; qty: number; revenue: number }>;
  lowStockProducts?: Array<{ id: string; name: string; currentStock: number; minStock: number; unit: string }>;
};

export default function BusinessAdvisor({
  kpis,
  topProducts = [],
  lowStockProducts = [],
}: BusinessAdvisorProps) {
  const [activeTab, setActiveTab] = useState<"advisor" | "learning" | "calculator">("advisor");
  const [openGuideId, setOpenGuideId] = useState<string | null>("guide-1");

  const omzet = kpis.omzetHariIni ?? 0;
  const labaKotor = kpis.labaKotorHariIni ?? 0;
  const biayaOperasional = kpis.biayaOperasionalHariIni ?? 0;
  const belanjaStok = kpis.belanjaStokHariIni ?? 0;
  const labaBersih = kpis.labaBersihHariIni ?? (labaKotor - biayaOperasional);
  const totalTransaksi = kpis.totalTransaksi ?? 0;

  // Analisis Kondisi Keuangan
  const isProfit = labaBersih > 0;
  const isBreakEven = labaBersih === 0;
  const isLoss = labaBersih < 0;

  // Rata-rata belanja per pembeli (Basket Size)
  const averageOrderValue = totalTransaksi > 0 ? omzet / totalTransaksi : 0;

  // Rekomendasi Pintar Dinamis
  const suggestions = [];

  // 1. Rekomendasi Stok Kritis
  if (lowStockProducts.length > 0) {
    suggestions.push({
      type: "warning",
      title: `${lowStockProducts.length} Barang Mau Habis`,
      desc: `Ada barang seperti "${lowStockProducts[0].name}" yang stoknya menipis (sisa ${lowStockProducts[0].currentStock}). Segera belanja stok ke supplier agar calon pembeli tidak kecewa dan pindah ke toko lain.`,
      actionText: "Buka Menu Stok Barang",
      actionLink: "/inventory",
    });
  }

  // 2. Rekomendasi Penjualan & Produk Terlaris
  if (topProducts.length > 0) {
    suggestions.push({
      type: "opportunity",
      title: `Manfaatkan Produk Terlaris: ${topProducts[0].name}`,
      desc: `Produk "${topProducts[0].name}" telah terjual ${topProducts[0].qty} pcs. Coba buat paket bundling (misal: "${topProducts[0].name}" + barang pelengkap) dengan harga promo untuk mendongkrak rata-rata belanja per pelanggan!`,
      actionText: "Lihat Kasir POS",
      actionLink: "/pos",
    });
  } else {
    suggestions.push({
      type: "opportunity",
      title: "Mulai Catat Penjualan di Kasir",
      desc: "Belum ada transaksi hari ini. Setiap transaksi kasir akan otomatis menghitung keuntungan kotor dan memperbarui sisa stok barang secara real-time.",
      actionText: "Buka Layar Kasir",
      actionLink: "/pos",
    });
  }

  // 3. Rekomendasi Beban Operasional & Laba
  if (biayaOperasional > 0 && isLoss) {
    suggestions.push({
      type: "finance",
      title: "Biaya Operasional Melebihi Laba Kotor",
      desc: `Hari ini tercatat biaya operasional ${formatRupiah(biayaOperasional)} (seperti sewa ruko/listrik/gaji). Untuk menutup biaya ini, Anda perlu mengejar omzet penjualan tambahan agar toko kembali mencatat Laba Bersih positif.`,
      actionText: "Lihat Rincian Biaya",
      actionLink: "/cashflow",
    });
  } else if (isProfit) {
    suggestions.push({
      type: "success",
      title: "Kondisi Usaha Sehat (Untung Bersih)",
      desc: `Selamat! Toko berhasil mencetak untung bersih ${formatRupiah(labaBersih)} setelah dipotong seluruh modal barang dan biaya operasional hari ini. Pertahankan margin keuntungan ini!`,
      actionText: "Lihat Buku Keuangan",
      actionLink: "/accounting",
    });
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-xs">
      {/* Header Interaktif */}
      <div className="border-b border-line bg-gradient-to-r from-brand/10 via-[#F3E8BC]/30 to-brand/5 p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand text-[#F3E8BC] shadow-sm">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-ink sm:text-lg">
                  Asisten Pintar Bisnis & Keuangan
                </h3>
                <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-[11px] font-bold text-brand">
                  Otomatis
                </span>
              </div>
              <p className="mt-0.5 text-xs text-ink-soft">
                Pelajari kondisi keuntungan tokomu dan dapatkan saran praktis untuk meningkatkan omzet penjualan.
              </p>
            </div>
          </div>

          {/* Tab Navigasi Sederhana */}
          <div className="inline-flex rounded-xl border border-line bg-surface p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveTab("advisor")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                activeTab === "advisor"
                  ? "bg-brand text-white shadow-xs"
                  : "text-ink-soft hover:text-ink hover:bg-surface-muted"
              }`}
            >
              <Lightbulb className="h-3.5 w-3.5" />
              <span>Saran Usaha</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("calculator")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                activeTab === "calculator"
                  ? "bg-brand text-white shadow-xs"
                  : "text-ink-soft hover:text-ink hover:bg-surface-muted"
              }`}
            >
              <Calculator className="h-3.5 w-3.5" />
              <span>Hitung Untung / Rugi</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("learning")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                activeTab === "learning"
                  ? "bg-brand text-white shadow-xs"
                  : "text-ink-soft hover:text-ink hover:bg-surface-muted"
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>Belajar Keuangan</span>
            </button>
          </div>
        </div>
      </div>

      {/* Konten Tab 1: Saran Usaha */}
      {activeTab === "advisor" && (
        <div className="p-5 sm:p-6 space-y-5">
          {/* Kartu Status Laba Cepat */}
          <div
            className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl p-4 border ${
              isProfit
                ? "border-positive/30 bg-positive-soft/40 text-ink"
                : isLoss
                ? "border-negative/30 bg-negative-soft/40 text-ink"
                : "border-line bg-surface-muted/50 text-ink"
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold ${
                  isProfit
                    ? "bg-positive text-white"
                    : isLoss
                    ? "bg-negative text-white"
                    : "bg-ink-muted text-white"
                }`}
              >
                {isProfit ? (
                  <TrendingUp className="h-5 w-5" />
                ) : isLoss ? (
                  <TrendingDown className="h-5 w-5" />
                ) : (
                  <DollarSign className="h-5 w-5" />
                )}
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                  Status Keuntungan Bersih Hari Ini
                </p>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span
                    className={`text-lg sm:text-xl font-black ${
                      isProfit ? "text-positive" : isLoss ? "text-negative" : "text-ink"
                    }`}
                  >
                    {isProfit ? "UNTUNG " : isLoss ? "RUGI " : "TITIK IMPAS "}
                    {formatRupiah(Math.abs(labaBersih))}
                  </span>
                  <span className="text-xs text-ink-soft">
                    (setelah dikurangi modal barang & biaya sewa/listrik/gaji)
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab("calculator")}
              className="inline-flex items-center gap-1 text-xs font-bold text-brand hover:underline cursor-pointer"
            >
              Lihat Rincian Rumusnya <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Daftar Rekomendasi Praktis */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-ink-muted">
              💡 Rekomendasi Langkah Praktis Toko Anda:
            </h4>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {suggestions.map((s, idx) => (
                <div
                  key={idx}
                  className="flex flex-col justify-between rounded-xl border border-line bg-surface p-4 shadow-2xs hover:border-brand/40 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="flex h-2 w-2 rounded-full bg-brand" />
                      <h5 className="text-xs font-bold text-ink">{s.title}</h5>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-ink-soft">{s.desc}</p>
                  </div>
                  {s.actionLink && (
                    <div className="mt-3.5 pt-3 border-t border-line">
                      <a
                        href={s.actionLink}
                        className="inline-flex items-center gap-1 text-xs font-bold text-brand hover:underline"
                      >
                        {s.actionText} <ArrowRight className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Konten Tab 2: Kalkulator & Rincian Untung Rugi */}
      {activeTab === "calculator" && (
        <div className="p-5 sm:p-6 space-y-6">
          <div>
            <h4 className="text-sm font-bold text-ink">
              Rincian Rumus Keuntungan (Laba / Rugi) Bersih Toko
            </h4>
            <p className="mt-0.5 text-xs text-ink-soft">
              Bagaimana angka untung atau rugi ini dihitung secara transparan dari data penjualan kasir dan catatan pengeluaran toko Anda:
            </p>
          </div>

          {/* Alur Perhitungan Visual */}
          <div className="space-y-3 rounded-xl border border-line bg-surface-muted/30 p-4 sm:p-5">
            {/* Baris 1: Total Omzet */}
            <div className="flex items-center justify-between py-2 border-b border-line">
              <div>
                <span className="text-xs font-bold text-ink">1. Total Penjualan (Omzet)</span>
                <p className="text-[11px] text-ink-muted">Uang yang diterima dari kasir atas transaksi penjualan</p>
              </div>
              <span className="text-sm font-bold text-brand">{formatRupiah(omzet)}</span>
            </div>

            {/* Baris 2: Modal Pokok Produk (HPP) */}
            <div className="flex items-center justify-between py-2 border-b border-line">
              <div>
                <span className="text-xs font-bold text-negative">2. Dikurangi: Modal Barang Terjual (HPP)</span>
                <p className="text-[11px] text-ink-muted">Harga kulakan/beli barang yang laku hari ini</p>
              </div>
              <span className="text-sm font-bold text-negative">− {formatRupiah(omzet - labaKotor)}</span>
            </div>

            {/* Baris 3: Laba Kotor */}
            <div className="flex items-center justify-between py-2.5 bg-surface rounded-lg px-3 border border-line">
              <div>
                <span className="text-xs font-bold text-ink">3. Keuntungan Kotor (Laba Kotor)</span>
                <p className="text-[11px] text-ink-muted">Selisih harga jual dengan harga modal barang</p>
              </div>
              <span className="text-sm font-extrabold text-ink">{formatRupiah(labaKotor)}</span>
            </div>

            {/* Baris 4: Biaya Operasional (Sewa, Listrik, Gaji) */}
            <div className="flex items-center justify-between py-2 border-b border-line">
              <div>
                <span className="text-xs font-bold text-negative">
                  4. Dikurangi: Biaya Operasional Toko (Sewa, Listrik, Gaji, dll)
                </span>
                <p className="text-[11px] text-ink-muted">Biaya harian/bulanan agar toko bisa beroperasi</p>
              </div>
              <span className="text-sm font-bold text-negative">− {formatRupiah(biayaOperasional)}</span>
            </div>

            {/* Baris 5: Hasil Akhir (Laba Bersih) */}
            <div
              className={`flex items-center justify-between p-3.5 rounded-xl border ${
                isProfit
                  ? "border-positive/40 bg-positive-soft text-positive"
                  : isLoss
                  ? "border-negative/40 bg-negative-soft text-negative"
                  : "border-line bg-surface text-ink"
              }`}
            >
              <div>
                <p className="text-xs font-extrabold uppercase tracking-wider">
                  Hasil Akhir: {isProfit ? "UNTUNG BERSIH" : isLoss ? "RUGI BERSIH" : "TITIK IMPAS"}
                </p>
                <p className="text-[11px] opacity-85">
                  {isProfit
                    ? "Uang murni keuntungan yang siap dinikmati pemilik usaha"
                    : isLoss
                    ? "Toko mengeluarkan biaya operasional lebih besar dari laba kotor hari ini"
                    : "Pemasukan dan pengeluaran sama persis"}
                </p>
              </div>
              <span className="text-lg font-black">{formatRupiah(Math.abs(labaBersih))}</span>
            </div>
          </div>
        </div>
      )}

      {/* Konten Tab 3: Belajar Keuangan Usaha */}
      {activeTab === "learning" && (
        <div className="p-5 sm:p-6 space-y-4">
          <div>
            <h4 className="text-sm font-bold text-ink">
              🎓 Pojok Belajar Keuangan & Pengelolaan Toko
            </h4>
            <p className="mt-0.5 text-xs text-ink-soft">
              Panduan praktis agar Anda makin mahir mengelola uang usaha tanpa perlu pusing dengan istilah akuntansi rumit:
            </p>
          </div>

          <div className="space-y-2.5">
            {/* Materi 1 */}
            <div className="rounded-xl border border-line bg-surface overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenGuideId(openGuideId === "guide-1" ? null : "guide-1")}
                className="flex w-full items-center justify-between p-3.5 text-left font-bold text-xs text-ink hover:bg-surface-muted/50 cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="h-4 w-4 text-brand" />
                  <span>1. Bagaimana Jurnal Otomatis Bekerja Saat Saya Bayar Sewa / Biaya Toko?</span>
                </div>
                {openGuideId === "guide-1" ? <ChevronUp className="h-4 w-4 text-ink-muted" /> : <ChevronDown className="h-4 w-4 text-ink-muted" />}
              </button>
              {openGuideId === "guide-1" && (
                <div className="border-t border-line bg-surface-muted/30 p-4 text-xs leading-relaxed text-ink-soft space-y-2">
                  <p>
                    <strong>Cukup bayar seperti biasa:</strong> Saat Anda mencatat <em>Bayar Sewa Ruko Rp 500.000</em> di menu <strong>Uang Kas & Biaya</strong>, sistem di balik layar langsung membuat entri jurnal akuntansi ganda (*double-entry*) secara otomatis:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-ink">
                    <li><strong>Debit (Beban Sewa):</strong> Mencatat bahwa biaya sewa ruko toko Anda bertambah Rp 500.000.</li>
                    <li><strong>Kredit (Kas Laci / Bank):</strong> Mencatat bahwa uang kas toko Anda berkurang Rp 500.000.</li>
                  </ul>
                  <p className="text-[11px] text-ink-muted">
                    ✨ Anda tidak perlu menghafal debit atau kredit sama sekali! Program ini mengerjakannya otomatis agar pembukuan toko Anda selalu rapi sesuai standar akuntansi Indonesia.
                  </p>
                </div>
              )}
            </div>

            {/* Materi 2 */}
            <div className="rounded-xl border border-line bg-surface overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenGuideId(openGuideId === "guide-2" ? null : "guide-2")}
                className="flex w-full items-center justify-between p-3.5 text-left font-bold text-xs text-ink hover:bg-surface-muted/50 cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <DollarSign className="h-4 w-4 text-positive" />
                  <span>2. Apa Bedanya "Uang Kas di Laci" dengan "Keuntungan Bersih (Laba)"?</span>
                </div>
                {openGuideId === "guide-2" ? <ChevronUp className="h-4 w-4 text-ink-muted" /> : <ChevronDown className="h-4 w-4 text-ink-muted" />}
              </button>
              {openGuideId === "guide-2" && (
                <div className="border-t border-line bg-surface-muted/30 p-4 text-xs leading-relaxed text-ink-soft space-y-2">
                  <p>
                    Banyak pemilik usaha terkecoh mengira uang fisik di laci kasir adalah semua keuntungan milik pribadi. Padahal:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-ink">
                    <li><strong>Uang Kas di Laci (Arus Kas):</strong> Uang tunai yang ada sekarang. Uang ini masih harus dipakai untuk kulakan belanja stok lagi dan bayar sewa/listrik berikutnya.</li>
                    <li><strong>Laba Bersih (Untung Bersih):</strong> Sisa uang murni setelah omzet dikurangi harga modal barang yang laku dan biaya operasional. Inilah keuntungan riil usaha Anda!</li>
                  </ul>
                </div>
              )}
            </div>

            {/* Materi 3 */}
            <div className="rounded-xl border border-line bg-surface overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenGuideId(openGuideId === "guide-3" ? null : "guide-3")}
                className="flex w-full items-center justify-between p-3.5 text-left font-bold text-xs text-ink hover:bg-surface-muted/50 cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Lightbulb className="h-4 w-4 text-warning" />
                  <span>3. Tips Meningkatkan Penjualan & Mempercepat Putaran Modal Toko</span>
                </div>
                {openGuideId === "guide-3" ? <ChevronUp className="h-4 w-4 text-ink-muted" /> : <ChevronDown className="h-4 w-4 text-ink-muted" />}
              </button>
              {openGuideId === "guide-3" && (
                <div className="border-t border-line bg-surface-muted/30 p-4 text-xs leading-relaxed text-ink-soft space-y-2">
                  <p>
                    Berikut 3 strategi praktis yang bisa langsung diterapkan:
                  </p>
                  <ol className="list-decimal pl-5 space-y-1.5 text-ink">
                    <li><strong>Strategi Bundling:</strong> Gabungkan produk paling laris dengan produk yang perputarannya agak lambat dengan sedikit diskon. Pelanggan senang hemat, stok lama Anda ikut berputar.</li>
                    <li><strong>Jaga Stok Barang Laris:</strong> Jangan sampai produk yang paling sering dicari kehabisan stok. Pantau selalu kartu <em>Peringatan Barang Mau Habis</em> di dashboard.</li>
                    <li><strong>Pisahkan Uang Pribadi dan Uang Toko:</strong> Jangan mengambil uang kasir untuk keperluan rumah tangga tanpa mencatatnya. Catat setiap pengambilan uang agar pembukuan tidak selisih saat tutup shift kasir.</li>
                  </ol>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
