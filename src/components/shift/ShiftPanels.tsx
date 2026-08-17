"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { SidePanel, PanelField } from "@/components/ui/side-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatNumber, parseNumberFromInput, formatRupiah } from "@/lib/format";

type Employee = { id: string; name: string; username: string; role: string; isActive: boolean };

/* ------------------------------------------------------------------ */
/* Buka shift — pilih modal awal dan pegawai yang bertugas             */
/* ------------------------------------------------------------------ */

export function OpenShiftPanel({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [initialCashInput, setInitialCashInput] = useState("200.000");
  const [notes, setNotes] = useState("Shift Pagi");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setInitialCashInput("200.000");
    setNotes("Shift Pagi");

    fetch("/api/employees")
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) return;
        const active = data.employees.filter((e: Employee) => e.isActive);
        setEmployees(active);
        const firstCashier = active.find((e: Employee) => e.role === "CASHIER") ?? active[0];
        setSelectedIds(firstCashier ? [firstCashier.id] : []);
      })
      .catch(() => toast.error("Gagal memuat daftar pegawai"));
  }, [open]);

  function toggleEmployee(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  async function handleSubmit() {
    if (selectedIds.length === 0) {
      toast.error("Pilih minimal satu pegawai yang bertugas");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/shift/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          initialCash: parseNumberFromInput(initialCashInput),
          notes,
          cashierIds: selectedIds,
        }),
      });
      const data = await res.json();

      if (!data.success) {
        toast.error("Gagal membuka shift", { description: data.message });
        return;
      }

      toast.success("Shift dibuka", { description: data.message });
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
      title="Buka Shift Kasir"
      description="Tentukan modal uang kembalian di laci dan siapa saja yang bertugas."
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
            {isSaving ? "Membuka..." : "Mulai Shift"}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <PanelField label="Modal Awal di Laci" htmlFor="initial-cash">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] font-semibold text-ink-muted">
              Rp
            </span>
            <Input
              id="initial-cash"
              value={initialCashInput}
              onChange={(e) =>
                setInitialCashInput(formatNumber(parseNumberFromInput(e.target.value)))
              }
              className="num h-10 pl-9 text-right text-[15px] font-bold"
            />
          </div>
        </PanelField>

        <PanelField
          label="Pegawai yang Bertugas"
          hint="Boleh lebih dari satu. Bisa ditambah atau diganti saat shift berjalan."
        >
          <ul className="divide-y divide-line rounded-md border border-line">
            {employees.map((employee) => {
              const isSelected = selectedIds.includes(employee.id);
              return (
                <li key={employee.id}>
                  <button
                    type="button"
                    onClick={() => toggleEmployee(employee.id)}
                    className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left transition-colors hover:bg-surface-muted cursor-pointer"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[12.5px] font-medium text-ink">
                        {employee.name}
                      </span>
                      <span className="num block text-[11px] text-ink-muted">
                        @{employee.username}
                      </span>
                    </span>
                    <span
                      className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded border transition-colors ${
                        isSelected ? "border-brand bg-brand text-white" : "border-line-strong"
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                    </span>
                  </button>
                </li>
              );
            })}
            {employees.length === 0 && (
              <li className="px-3 py-4 text-center text-[12px] text-ink-muted">
                Belum ada pegawai aktif
              </li>
            )}
          </ul>
        </PanelField>

        <PanelField label="Nama / Keterangan Shift" htmlFor="shift-notes">
          <Input
            id="shift-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Shift Pagi / Shift Sore"
            className="h-9"
          />
        </PanelField>
      </div>
    </SidePanel>
  );
}

/* ------------------------------------------------------------------ */
/* Tutup shift — cocokkan kas fisik dengan catatan sistem              */
/* ------------------------------------------------------------------ */

export function CloseShiftPanel({
  open,
  onClose,
  onSaved,
  shift,
  expectedCash,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  shift: any;
  expectedCash: number;
}) {
  const [actualCashInput, setActualCashInput] = useState("");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setActualCashInput(formatNumber(expectedCash));
    setNotes("");
  }, [open, expectedCash]);

  const actualCash = parseNumberFromInput(actualCashInput);
  const difference = actualCash - expectedCash;

  async function handleSubmit() {
    if (!shift) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/shift/close", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shiftId: shift.id, actualCash, notes }),
      });
      const data = await res.json();

      if (!data.success) {
        toast.error("Gagal menutup shift", { description: data.message });
        return;
      }

      toast.success("Shift ditutup", {
        description: `Kas fisik ${formatRupiah(actualCash)} • selisih ${formatRupiah(difference)}`,
      });
      onSaved();
      onClose();
    } catch (error: any) {
      toast.error("Terjadi kesalahan", { description: error.message });
    } finally {
      setIsSaving(false);
    }
  }

  const stats = shift?.stats ?? {};

  return (
    <SidePanel
      open={open}
      onClose={onClose}
      title="Tutup Shift & Rekap Kas"
      description="Hitung uang fisik di laci, lalu cocokkan dengan catatan sistem."
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
            {isSaving ? "Menutup..." : "Kunci & Tutup Shift"}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="rounded-md border border-line">
          {[
            { label: "Modal awal laci", value: shift?.initialCash ?? 0 },
            { label: "Penjualan tunai", value: stats.totalCashSales ?? 0 },
            { label: "Uang keluar dari laci", value: -(stats.totalCashOut ?? 0) },
          ].map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between gap-3 border-b border-line px-3 py-2 last:border-0"
            >
              <span className="text-[12px] text-ink-soft">{row.label}</span>
              <span className="num text-[12.5px] font-semibold text-ink">
                {formatRupiah(row.value)}
              </span>
            </div>
          ))}
          <div className="flex items-center justify-between gap-3 border-t border-line-strong bg-surface-muted px-3 py-2.5">
            <span className="text-[12px] font-semibold text-ink">Seharusnya ada di laci</span>
            <span className="num text-[14px] font-bold text-brand">
              {formatRupiah(expectedCash)}
            </span>
          </div>
        </div>

        <PanelField label="Hitungan Uang Fisik di Laci" htmlFor="actual-cash">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] font-semibold text-ink-muted">
              Rp
            </span>
            <Input
              id="actual-cash"
              value={actualCashInput}
              onChange={(e) =>
                setActualCashInput(formatNumber(parseNumberFromInput(e.target.value)))
              }
              className="num h-10 pl-9 text-right text-[15px] font-bold"
            />
          </div>
        </PanelField>

        <div
          className={`rounded-md border px-3 py-3 ${
            difference === 0
              ? "border-positive/30 bg-positive-soft"
              : difference < 0
              ? "border-negative/30 bg-negative-soft"
              : "border-warning/30 bg-warning-soft"
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <span
              className={`text-[12.5px] font-semibold ${
                difference === 0
                  ? "text-positive"
                  : difference < 0
                  ? "text-negative"
                  : "text-warning"
              }`}
            >
              {difference === 0
                ? "Kas cocok dengan sistem"
                : difference < 0
                ? "Kas kurang dari catatan"
                : "Kas lebih dari catatan"}
            </span>
            <span
              className={`num text-[14px] font-bold ${
                difference === 0
                  ? "text-positive"
                  : difference < 0
                  ? "text-negative"
                  : "text-warning"
              }`}
            >
              {formatRupiah(Math.abs(difference))}
            </span>
          </div>
        </div>

        <PanelField label="Catatan Serah Terima" htmlFor="close-notes" hint="Opsional">
          <Input
            id="close-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Misal: uang receh sudah dirapikan"
            className="h-9"
          />
        </PanelField>
      </div>
    </SidePanel>
  );
}

/* ------------------------------------------------------------------ */
/* Tambah pegawai ke shift yang sedang berjalan                        */
/* ------------------------------------------------------------------ */

export function AddCashierPanel({
  open,
  onClose,
  onSaved,
  shiftId,
  activeCashierIds,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  shiftId: string;
  activeCashierIds: string[];
}) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    fetch("/api/employees")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setEmployees(data.employees.filter((e: Employee) => e.isActive));
      })
      .catch(() => toast.error("Gagal memuat daftar pegawai"));
  }, [open]);

  async function addToShift(employee: Employee) {
    setSavingId(employee.id);
    try {
      const res = await fetch("/api/shift/cashiers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shiftId, userId: employee.id }),
      });
      const data = await res.json();

      if (!data.success) {
        toast.error("Gagal menambahkan", { description: data.message });
        return;
      }

      toast.success(data.message);
      onSaved();
      onClose();
    } catch (error: any) {
      toast.error("Terjadi kesalahan", { description: error.message });
    } finally {
      setSavingId(null);
    }
  }

  const available = employees.filter((e) => !activeCashierIds.includes(e.id));

  return (
    <SidePanel
      open={open}
      onClose={onClose}
      title="Tambah Pegawai ke Shift"
      description="Pegawai yang dipilih langsung tercatat bertugas pada shift yang sedang berjalan."
      footer={
        <Button variant="outline" size="sm" onClick={onClose} className="cursor-pointer">
          Tutup
        </Button>
      }
    >
      <ul className="divide-y divide-line rounded-md border border-line">
        {available.map((employee) => (
          <li key={employee.id}>
            <button
              type="button"
              onClick={() => addToShift(employee)}
              disabled={savingId === employee.id}
              className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left transition-colors hover:bg-surface-muted disabled:opacity-50 cursor-pointer"
            >
              <span className="min-w-0">
                <span className="block truncate text-[12.5px] font-medium text-ink">
                  {employee.name}
                </span>
                <span className="num block text-[11px] text-ink-muted">@{employee.username}</span>
              </span>
              <span className="shrink-0 text-[11.5px] font-medium text-brand">
                {savingId === employee.id ? "Menambahkan..." : "Tambahkan"}
              </span>
            </button>
          </li>
        ))}
        {available.length === 0 && (
          <li className="px-3 py-5 text-center text-[12px] text-ink-muted">
            Semua pegawai aktif sudah bertugas di shift ini.
          </li>
        )}
      </ul>
    </SidePanel>
  );
}
