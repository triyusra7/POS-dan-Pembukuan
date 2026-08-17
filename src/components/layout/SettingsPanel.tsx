"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { SidePanel, PanelField } from "@/components/ui/side-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type SettingsPanelProps = {
  open: boolean;
  onClose: () => void;
  currentStoreName: string;
  currentOutletName: string;
};

export default function SettingsPanel({
  open,
  onClose,
  currentStoreName,
  currentOutletName,
}: SettingsPanelProps) {
  const router = useRouter();
  const [storeName, setStoreName] = useState(currentStoreName);
  const [outletName, setOutletName] = useState(currentOutletName);
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Muat detail lengkap tiap kali panel dibuka agar tidak menampilkan data basi
  useEffect(() => {
    if (!open) return;
    setStoreName(currentStoreName);
    setOutletName(currentOutletName);

    let cancelled = false;
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled || !data.success) return;
        setAddress(data.settings.address ?? "");
        setPhone(data.settings.phone ?? "");
      })
      .catch(() => {
        /* biarkan form memakai nilai yang sudah tampil di navbar */
      });

    return () => {
      cancelled = true;
    };
  }, [open, currentStoreName, currentOutletName]);

  async function handleSave() {
    if (!storeName.trim()) {
      toast.error("Nama toko tidak boleh kosong");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: storeName,
          outletName: outletName || undefined,
          address,
          phone,
        }),
      });
      const data = await res.json();

      if (!data.success) {
        toast.error("Gagal menyimpan", { description: data.message });
        return;
      }

      toast.success("Pengaturan tersimpan", { description: data.message });
      onClose();
      router.refresh();
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
      title="Pengaturan Toko"
      description="Nama ini tampil di navigasi, struk belanja, dan header laporan."
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} className="cursor-pointer">
            Batal
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="bg-brand text-white hover:bg-brand/90 cursor-pointer"
          >
            {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <PanelField label="Nama Toko" htmlFor="store-name">
          <Input
            id="store-name"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            placeholder="Misal: Toko Berkah Retail"
          />
        </PanelField>

        <PanelField
          label="Nama Outlet / Cabang"
          htmlFor="outlet-name"
          hint="Berguna bila punya lebih dari satu lokasi."
        >
          <Input
            id="outlet-name"
            value={outletName}
            onChange={(e) => setOutletName(e.target.value)}
            placeholder="Misal: Cabang Sudirman"
          />
        </PanelField>

        <PanelField label="Alamat" htmlFor="store-address">
          <Input
            id="store-address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Alamat lengkap toko"
          />
        </PanelField>

        <PanelField label="Nomor Telepon" htmlFor="store-phone">
          <Input
            id="store-phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="08xxxxxxxxxx"
          />
        </PanelField>

        <div className="rounded-xl border border-line bg-surface-muted/50 p-3.5 space-y-2">
          <label className="block text-xs font-bold text-ink">
            Ukuran Tulisan di Layar (Ramah Penglihatan / Orang Tua)
          </label>
          <p className="text-[11.5px] text-ink-muted leading-relaxed">
            Pilih ukuran teks yang paling nyaman dibaca saat mengoperasikan kasir dan melihat laporan.
          </p>
          <div className="grid grid-cols-3 gap-2 pt-1">
            {[
              { id: "normal", label: "Sedang (100%)" },
              { id: "large", label: "Besar (115%)" },
              { id: "extra", label: "Ekstra (130%)" },
            ].map((size) => (
              <button
                key={size.id}
                type="button"
                onClick={() => {
                  try {
                    localStorage.setItem("pos_text_size", size.id);
                    document.documentElement.setAttribute("data-text-size", size.id);
                    toast.success(`Ukuran tulisan diubah ke ${size.label}`);
                  } catch {}
                }}
                className="rounded-lg border border-line bg-surface py-2 px-2 text-xs font-bold text-ink transition-all hover:border-brand hover:bg-[#F3E8BC]/30 hover:text-brand cursor-pointer"
              >
                {size.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </SidePanel>
  );
}
