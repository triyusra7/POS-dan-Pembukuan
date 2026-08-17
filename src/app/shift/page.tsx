"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Lock, Unlock, Users, UserPlus, UserMinus, Wallet } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/layout/PageHeader";
import { SectionCard, EmptyState, StatusDot } from "@/components/ui/data-display";
import { FadeIn, AnimatedNumber, SPRING_SNAPPY } from "@/components/motion/motion-primitives";
import { Button } from "@/components/ui/button";
import EmployeePanel from "@/components/shift/EmployeePanel";
import {
  OpenShiftPanel,
  CloseShiftPanel,
  AddCashierPanel,
} from "@/components/shift/ShiftPanels";
import { formatRupiah, formatDateTime } from "@/lib/format";

const ROLE_LABELS: Record<string, string> = {
  CASHIER: "Kasir",
  ADMIN: "Admin",
  OWNER: "Pemilik",
};

export default function ShiftPage() {
  const [shiftData, setShiftData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [openPanelOpen, setOpenPanelOpen] = useState(false);
  const [closePanelOpen, setClosePanelOpen] = useState(false);
  const [employeePanelOpen, setEmployeePanelOpen] = useState(false);
  const [addCashierOpen, setAddCashierOpen] = useState(false);

  const loadShift = useCallback(async () => {
    try {
      const res = await fetch("/api/shift/current");
      const data = await res.json();
      if (data.success) setShiftData(data);
    } catch {
      toast.error("Gagal memuat status shift");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadShift();
  }, [loadShift]);

  const shift = shiftData?.shift;
  const hasActiveShift = Boolean(shiftData?.hasActiveShift && shift);
  const stats = shift?.stats ?? {};
  const assignments = shift?.assignments ?? [];
  const expectedCash = stats.expectedCashInDrawer ?? shift?.initialCash ?? 0;

  async function removeCashier(userId: string, name: string) {
    try {
      const res = await fetch(
        `/api/shift/cashiers?shiftId=${shift.id}&userId=${userId}`,
        { method: "DELETE" }
      );
      const data = await res.json();

      if (!data.success) {
        toast.error("Gagal mengeluarkan pegawai", { description: data.message });
        return;
      }

      toast.success(`${name} keluar dari shift`);
      loadShift();
    } catch (error: any) {
      toast.error("Terjadi kesalahan", { description: error.message });
    }
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-5xl p-4 sm:p-6 lg:p-8">
        <div className="skeleton h-16 rounded-lg" />
        <div className="skeleton mt-6 h-64 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Shift Kerja Kasir"
        description="Atur pegawai yang bertugas, tentukan modal uang kembalian di laci, dan hitung uang fisik saat tutup shift."
      >
        <Button
          variant="outline"
          onClick={() => setEmployeePanelOpen(true)}
          className="cursor-pointer rounded-xl font-bold"
        >
          <Users className="h-4 w-4" /> Daftar Pegawai
        </Button>
        {hasActiveShift ? (
          <Button
            onClick={() => setClosePanelOpen(true)}
            className="bg-negative text-white hover:bg-negative/90 cursor-pointer rounded-xl font-bold"
          >
            <Lock className="h-4 w-4" /> Tutup Shift & Hitung Kas
          </Button>
        ) : (
          <Button
            onClick={() => setOpenPanelOpen(true)}
            className="bg-brand text-white hover:bg-brand/90 cursor-pointer rounded-xl font-bold"
          >
            <Unlock className="h-4 w-4" /> Buka Shift Kasir Baru
          </Button>
        )}
      </PageHeader>

      {!hasActiveShift ? (
        <FadeIn delay={0.1} className="mt-6">
          <SectionCard>
            <EmptyState
              icon={Clock}
              title="Belum ada shift kasir yang aktif"
              description="Buka shift kasir dengan memasukkan jumlah modal uang kembalian di laci dan memilih pegawai yang bertugas."
              action={
                <Button
                  onClick={() => setOpenPanelOpen(true)}
                  className="bg-brand text-white hover:bg-brand/90 cursor-pointer rounded-xl font-bold mt-2"
                >
                  <Unlock className="h-4 w-4" /> Buka Shift Kasir Sekarang
                </Button>
              }
            />
          </SectionCard>
        </FadeIn>
      ) : (
        <div className="mt-6 space-y-4">
          {/* Kas laci: angka paling penting saat shift berjalan */}
          <FadeIn delay={0.08}>
            <SectionCard>
              <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="flex items-center gap-2 text-[12px] font-medium text-ink-soft">
                    <Wallet className="h-4 w-4 text-brand" />
                    Uang yang seharusnya ada di laci sekarang
                  </p>
                  <p className="num mt-2 text-[30px] font-bold leading-none text-ink">
                    <AnimatedNumber
                      value={expectedCash}
                      format={(v) => formatRupiah(Math.round(v))}
                      duration={0.8}
                    />
                  </p>
                  <p className="num mt-2 text-[11.5px] text-ink-muted">
                    Modal {formatRupiah(shift.initialCash)} + tunai{" "}
                    {formatRupiah(stats.totalCashSales ?? 0)} − keluar{" "}
                    {formatRupiah(stats.totalCashOut ?? 0)}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:w-72">
                  {[
                    { label: "Transaksi", value: `${stats.totalTransactions ?? 0} nota` },
                    { label: "Penjualan tunai", value: formatRupiah(stats.totalCashSales ?? 0) },
                    {
                      label: "QRIS & transfer",
                      value: formatRupiah(
                        (stats.totalQrisSales ?? 0) + (stats.totalTransferSales ?? 0)
                      ),
                    },
                    { label: "Kasbon", value: formatRupiah(stats.totalKasbonSales ?? 0) },
                  ].map((item) => (
                    <div key={item.label} className="rounded-md border border-line px-3 py-2">
                      <p className="text-[10.5px] text-ink-muted">{item.label}</p>
                      <p className="num mt-0.5 text-[12.5px] font-semibold text-ink">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </SectionCard>
          </FadeIn>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Pegawai yang bertugas */}
            <FadeIn delay={0.14}>
              <SectionCard
                title={`Pegawai Bertugas (${assignments.length})`}
                className="h-full"
                action={
                  <button
                    type="button"
                    onClick={() => setAddCashierOpen(true)}
                    className="flex items-center gap-1 text-[11.5px] font-medium text-brand transition-colors hover:underline cursor-pointer"
                  >
                    <UserPlus className="h-3.5 w-3.5" /> Tambah
                  </button>
                }
              >
                <ul className="divide-y divide-line">
                  <AnimatePresence initial={false}>
                    {assignments.map((assignment: any) => (
                      <motion.li
                        key={assignment.id}
                        layout
                        initial={{ opacity: 0, x: 12 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -12 }}
                        transition={SPRING_SNAPPY}
                        className="flex items-center justify-between gap-3 px-4 py-2.5"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-[12.5px] font-semibold text-ink">
                            {assignment.user.name}
                          </p>
                          <p className="num flex items-center gap-1.5 text-[11px] text-ink-muted">
                            <StatusDot tone="positive" />
                            {ROLE_LABELS[assignment.user.role] ?? assignment.user.role} • masuk{" "}
                            {new Date(assignment.joinedAt).toLocaleTimeString("id-ID", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                        {assignments.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeCashier(assignment.user.id, assignment.user.name)}
                            aria-label={`Keluarkan ${assignment.user.name} dari shift`}
                            className="flex shrink-0 items-center gap-1 rounded-md border border-line px-2 py-1 text-[11px] font-medium text-ink-soft transition-colors hover:border-negative hover:bg-negative-soft hover:text-negative cursor-pointer"
                          >
                            <UserMinus className="h-3 w-3" /> Keluar
                          </button>
                        )}
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              </SectionCard>
            </FadeIn>

            {/* Detail shift */}
            <FadeIn delay={0.2}>
              <SectionCard title="Detail Shift" className="h-full">
                <dl className="divide-y divide-line">
                  {[
                    { label: "Outlet", value: shift.outlet?.name },
                    { label: "Waktu mulai", value: formatDateTime(shift.startTime) },
                    { label: "Keterangan", value: shift.notes || "—" },
                    {
                      label: "Uang keluar dari laci",
                      value: formatRupiah(stats.totalCashOut ?? 0),
                    },
                  ].map((row) => (
                    <div
                      key={row.label}
                      className="flex items-center justify-between gap-3 px-4 py-2.5"
                    >
                      <dt className="text-[12px] text-ink-soft">{row.label}</dt>
                      <dd className="num truncate text-[12.5px] font-semibold text-ink">
                        {row.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </SectionCard>
            </FadeIn>
          </div>
        </div>
      )}

      <OpenShiftPanel
        open={openPanelOpen}
        onClose={() => setOpenPanelOpen(false)}
        onSaved={loadShift}
      />
      {shift && (
        <>
          <CloseShiftPanel
            open={closePanelOpen}
            onClose={() => setClosePanelOpen(false)}
            onSaved={loadShift}
            shift={shift}
            expectedCash={expectedCash}
          />
          <AddCashierPanel
            open={addCashierOpen}
            onClose={() => setAddCashierOpen(false)}
            onSaved={loadShift}
            shiftId={shift.id}
            activeCashierIds={assignments.map((a: any) => a.user.id)}
          />
        </>
      )}
      <EmployeePanel
        open={employeePanelOpen}
        onClose={() => setEmployeePanelOpen(false)}
        onChanged={loadShift}
      />
    </div>
  );
}
