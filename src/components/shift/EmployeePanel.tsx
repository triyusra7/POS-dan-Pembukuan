"use client";

import { useEffect, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { UserPlus, Check, X } from "lucide-react";
import { toast } from "sonner";
import { SidePanel, PanelField } from "@/components/ui/side-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusDot } from "@/components/ui/data-display";
import { SPRING_SNAPPY } from "@/components/motion/motion-primitives";

const ROLES = [
  { value: "CASHIER", label: "Kasir" },
  { value: "ADMIN", label: "Admin" },
  { value: "OWNER", label: "Pemilik" },
] as const;

const ROLE_LABELS: Record<string, string> = {
  CASHIER: "Kasir",
  ADMIN: "Admin",
  OWNER: "Pemilik",
};

type EmployeePanelProps = {
  open: boolean;
  onClose: () => void;
  onChanged: () => void;
};

export default function EmployeePanel({ open, onClose, onChanged }: EmployeePanelProps) {
  const [employees, setEmployees] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState<string>("CASHIER");
  const [isSaving, setIsSaving] = useState(false);

  const loadEmployees = useCallback(async () => {
    try {
      const res = await fetch("/api/employees");
      const data = await res.json();
      if (data.success) setEmployees(data.employees);
    } catch {
      toast.error("Gagal memuat daftar pegawai");
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    loadEmployees();
    setShowForm(false);
    setName("");
    setUsername("");
    setRole("CASHIER");
  }, [open, loadEmployees]);

  async function handleAdd() {
    if (!name.trim()) {
      toast.error("Nama pegawai wajib diisi");
      return;
    }
    if (!username.trim()) {
      toast.error("Username wajib diisi");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, username, role }),
      });
      const data = await res.json();

      if (!data.success) {
        toast.error("Gagal menambah pegawai", { description: data.message });
        return;
      }

      toast.success("Pegawai ditambahkan", { description: data.message });
      setName("");
      setUsername("");
      setRole("CASHIER");
      setShowForm(false);
      await loadEmployees();
      onChanged();
    } catch (error: any) {
      toast.error("Terjadi kesalahan", { description: error.message });
    } finally {
      setIsSaving(false);
    }
  }

  async function toggleActive(employee: any) {
    try {
      const res = await fetch("/api/employees", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: employee.id, isActive: !employee.isActive }),
      });
      const data = await res.json();

      if (!data.success) {
        toast.error("Gagal memperbarui", { description: data.message });
        return;
      }

      toast.success(employee.isActive ? "Pegawai dinonaktifkan" : "Pegawai diaktifkan kembali");
      await loadEmployees();
      onChanged();
    } catch (error: any) {
      toast.error("Terjadi kesalahan", { description: error.message });
    }
  }

  return (
    <SidePanel
      open={open}
      onClose={onClose}
      title="Kelola Pegawai"
      description="Daftar pegawai yang bisa ditugaskan sebagai kasir pada shift."
      footer={
        <Button variant="outline" size="sm" onClick={onClose} className="cursor-pointer">
          Tutup
        </Button>
      }
    >
      <div className="space-y-4">
        <AnimatePresence initial={false}>
          {showForm ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <div className="space-y-4 rounded-md border border-line bg-surface-muted p-3.5">
                <PanelField label="Nama Pegawai" htmlFor="employee-name">
                  <Input
                    id="employee-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Misal: Rina Wulandari"
                    className="h-9 bg-surface"
                  />
                </PanelField>

                <PanelField
                  label="Username"
                  htmlFor="employee-username"
                  hint="Dipakai sebagai identitas singkat pegawai."
                >
                  <Input
                    id="employee-username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase())}
                    placeholder="kasir2"
                    className="h-9 bg-surface"
                  />
                </PanelField>

                <PanelField label="Peran">
                  <div className="grid grid-cols-3 gap-1.5">
                    {ROLES.map((item) => {
                      const isSelected = role === item.value;
                      return (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => setRole(item.value)}
                          className={`rounded-md border px-2 py-1.5 text-[12px] font-medium transition-colors cursor-pointer ${
                            isSelected
                              ? "border-brand bg-brand-soft text-brand"
                              : "border-line bg-surface text-ink-soft hover:text-ink"
                          }`}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </PanelField>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowForm(false)}
                    className="cursor-pointer"
                  >
                    Batal
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleAdd}
                    disabled={isSaving}
                    className="bg-brand text-white hover:bg-brand/90 cursor-pointer"
                  >
                    {isSaving ? "Menyimpan..." : "Simpan Pegawai"}
                  </Button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.button
              key="trigger"
              type="button"
              onClick={() => setShowForm(true)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-line-strong px-3 py-2.5 text-[12.5px] font-medium text-ink-soft transition-colors hover:border-brand hover:bg-brand-soft hover:text-brand cursor-pointer"
            >
              <UserPlus className="h-3.5 w-3.5" /> Tambah Pegawai Baru
            </motion.button>
          )}
        </AnimatePresence>

        <ul className="divide-y divide-line rounded-md border border-line">
          {employees.map((employee) => (
            <motion.li
              key={employee.id}
              layout
              transition={SPRING_SNAPPY}
              className="flex items-center justify-between gap-3 px-3 py-2.5"
            >
              <div className="min-w-0">
                <p
                  className={`truncate text-[12.5px] font-semibold ${
                    employee.isActive ? "text-ink" : "text-ink-muted line-through"
                  }`}
                >
                  {employee.name}
                </p>
                <p className="num flex items-center gap-1.5 text-[11px] text-ink-muted">
                  <StatusDot tone={employee.isActive ? "positive" : "muted"} />
                  {ROLE_LABELS[employee.role] ?? employee.role} • @{employee.username}
                </p>
              </div>
              <button
                type="button"
                onClick={() => toggleActive(employee)}
                className={`flex shrink-0 items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
                  employee.isActive
                    ? "border-line text-ink-soft hover:border-negative hover:bg-negative-soft hover:text-negative"
                    : "border-line text-ink-soft hover:border-positive hover:bg-positive-soft hover:text-positive"
                }`}
              >
                {employee.isActive ? (
                  <>
                    <X className="h-3 w-3" /> Nonaktifkan
                  </>
                ) : (
                  <>
                    <Check className="h-3 w-3" /> Aktifkan
                  </>
                )}
              </button>
            </motion.li>
          ))}
        </ul>
      </div>
    </SidePanel>
  );
}
