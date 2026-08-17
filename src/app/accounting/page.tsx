"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, FileText, Layers, Scale } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { SectionCard, EmptyState, StatusDot } from "@/components/ui/data-display";
import { FadeIn, EASE_OUT_EXPO } from "@/components/motion/motion-primitives";
import { formatRupiah, formatDateTime } from "@/lib/format";

type TabKey = "journals" | "accounts";

const CATEGORY_TONE: Record<string, "brand" | "positive" | "negative" | "warning" | "muted"> = {
  ASSET: "brand",
  REVENUE: "positive",
  EXPENSE: "negative",
  LIABILITY: "warning",
  EQUITY: "muted",
};

export default function AccountingPage() {
  const [journals, setJournals] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>("journals");

  useEffect(() => {
    fetch("/api/accounting/journals")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setJournals(data.journals);
          setAccounts(data.accounts);
          setSummary(data.summary);
        }
      })
      .catch((err) => console.error("Gagal memuat jurnal:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Buku Keuangan Otomatis"
        description="Semua transaksi penjualan kasir, belanja stok barang, dan pengeluaran biaya toko otomatis dicatat berpasangan tanpa perlu hitung pembukuan manual."
      >
        <div className="flex items-center gap-2.5 rounded-xl border border-line bg-surface px-3.5 py-2 shadow-2xs">
          <Scale className="h-4 w-4 text-brand" />
          <div>
            <p className="flex items-center gap-1.5 text-xs font-bold text-ink-muted">
              <StatusDot tone="positive" /> Pembukuan Seimbang (Balance)
            </p>
            <p className="num mt-0.5 text-xs font-extrabold text-ink">
              Total: {formatRupiah(summary.totalDebit ?? 0)}
            </p>
          </div>
        </div>
      </PageHeader>

      <FadeIn delay={0.08} className="mt-5">
        <div className="flex w-fit gap-1 rounded-xl bg-surface-muted p-1 border border-line">
          {(
            [
              { key: "journals", label: `Catatan Transaksi (${journals.length})`, Icon: FileText },
              { key: "accounts", label: `Daftar Akun Keuangan (${accounts.length})`, Icon: Layers },
            ] as const
          ).map((item) => {
            const isActive = tab === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setTab(item.key)}
                className={`relative flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition-colors cursor-pointer ${
                  isActive ? "text-ink" : "text-ink-soft hover:text-ink"
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="accounting-tab"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    className="absolute inset-0 rounded-lg bg-surface shadow-xs"
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <item.Icon className="h-4 w-4" /> {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </FadeIn>

      {loading ? (
        <div className="mt-4 space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton h-40 rounded-lg" />
          ))}
        </div>
      ) : tab === "journals" ? (
        <div className="mt-4 space-y-3">
          {journals.length === 0 ? (
            <SectionCard>
              <EmptyState
                icon={FileText}
                title="Belum ada entri jurnal"
                description="Transaksi kasir, belanja stok, atau biaya operasional akan otomatis muncul di sini."
              />
            </SectionCard>
          ) : (
            journals.map((entry, idx) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.3,
                  ease: EASE_OUT_EXPO,
                  delay: Math.min(idx * 0.04, 0.35),
                }}
              >
                <SectionCard>
                  <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="num shrink-0 rounded border border-line bg-surface-muted px-2 py-1 text-[11px] font-bold text-brand">
                        {entry.entryNumber}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[12.5px] font-semibold text-ink">{entry.memo}</p>
                        <p className="num text-[10.5px] text-ink-muted">
                          {formatDateTime(entry.transactionDate)} • {entry.referenceType}
                        </p>
                      </div>
                    </div>
                    <span className="flex shrink-0 items-center gap-1.5 text-xs font-bold text-positive">
                      <CheckCircle2 className="h-4 w-4" /> Tercatat Otomatis
                    </span>
                  </header>

                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[560px] border-collapse">
                      <thead>
                        <tr className="border-b border-line text-left bg-surface-muted/30">
                          <th className="w-[110px] px-4 py-2.5 text-xs font-bold text-ink-muted">
                            Nomor Akun
                          </th>
                          <th className="px-4 py-2.5 text-xs font-bold text-ink-muted">
                            Pos Keuangan (Nama Akun)
                          </th>
                          <th className="w-[160px] px-4 py-2.5 text-right text-xs font-bold text-ink-muted">
                            Masuk / Tambah (Debit)
                          </th>
                          <th className="w-[160px] px-4 py-2.5 text-right text-xs font-bold text-ink-muted">
                            Keluar / Kurang (Kredit)
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {entry.journalLines.map((line: any) => (
                          <tr key={line.id} className="border-b border-line last:border-0">
                            <td className="num px-4 py-2 text-[11.5px] text-ink-muted">
                              {line.account.accountCode}
                            </td>
                            <td className="px-4 py-2 text-[12px] text-ink">
                              {line.account.accountName}
                            </td>
                            <td className="num px-4 py-2 text-right text-[12px] font-semibold text-ink">
                              {line.debitAmount > 0 ? formatRupiah(line.debitAmount) : "—"}
                            </td>
                            <td className="num px-4 py-2 text-right text-[12px] font-semibold text-ink">
                              {line.creditAmount > 0 ? formatRupiah(line.creditAmount) : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </SectionCard>
              </motion.div>
            ))
          )}
        </div>
      ) : (
        <FadeIn className="mt-4">
          <SectionCard>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse">
                <thead>
                  <tr className="border-b border-line text-left">
                    {["Kode", "Nama Akun", "Kategori", "Saldo Normal", "Keterangan"].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-wide text-ink-muted"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((acc, idx) => (
                    <motion.tr
                      key={acc.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.25,
                        ease: EASE_OUT_EXPO,
                        delay: Math.min(idx * 0.02, 0.25),
                      }}
                      className="border-b border-line last:border-0 transition-colors hover:bg-surface-muted/60"
                    >
                      <td className="num px-4 py-2.5 text-[12px] font-bold text-brand">
                        {acc.accountCode}
                      </td>
                      <td className="px-4 py-2.5 text-[12.5px] font-semibold text-ink">
                        {acc.accountName}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="flex items-center gap-1.5 text-[11.5px] font-medium text-ink-soft">
                          <StatusDot tone={CATEGORY_TONE[acc.category] ?? "muted"} />
                          {acc.category}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-[11.5px] font-medium text-ink-soft">
                        {acc.normalBalance}
                      </td>
                      <td className="px-4 py-2.5 text-[11.5px] text-ink-muted">
                        {acc.description || "—"}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </FadeIn>
      )}
    </div>
  );
}
