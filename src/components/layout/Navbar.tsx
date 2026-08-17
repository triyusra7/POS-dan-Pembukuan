"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  ShoppingCart,
  Clock,
  Package,
  BookOpen,
  LayoutDashboard,
  Wallet,
  Store,
  Settings,
  Type,
} from "lucide-react";
import { SPRING_SNAPPY, SPRING_BOUNCY } from "@/components/motion/motion-primitives";
import SettingsPanel from "@/components/layout/SettingsPanel";
import { useTextSize } from "@/components/layout/AccessibilityProvider";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Ringkasan", icon: LayoutDashboard },
  { href: "/pos", label: "Kasir", icon: ShoppingCart },
  { href: "/cashflow", label: "Uang Kas & Biaya", icon: Wallet },
  { href: "/inventory", label: "Stok Barang", icon: Package },
  { href: "/shift", label: "Shift Kerja", icon: Clock },
  { href: "/accounting", label: "Buku Keuangan", icon: BookOpen },
];

type NavbarProps = {
  storeName: string;
  outletName: string;
};

export default function Navbar({ storeName, outletName }: NavbarProps) {
  const pathname = usePathname();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { textSize, cycleTextSize } = useTextSize();

  const textSizeLabels = {
    normal: "Teks: Sedang",
    large: "Teks: Besar",
    extra: "Teks: Sangat Besar",
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-line bg-surface">
        <div className="flex h-14 items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-5">
            <Link href="/dashboard" className="flex min-w-0 items-center gap-2.5">
              <motion.span
                whileHover={{ rotate: -8, scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                transition={SPRING_BOUNCY}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand text-[#F3E8BC] shadow-xs border border-[#F3E8BC]/30"
              >
                <Store className="h-5 w-5" />
              </motion.span>
              <span className="min-w-0">
                <span className="block truncate text-[14px] font-bold leading-tight tracking-tight text-ink">
                  {storeName}
                </span>
                {outletName && (
                  <span className="block truncate text-[11px] leading-tight text-ink-muted">
                    {outletName}
                  </span>
                )}
              </span>
            </Link>

            <nav aria-label="Navigasi utama" className="hidden items-center gap-0.5 md:flex">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href || (item.href === "/dashboard" && pathname === "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={`relative flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[13px] transition-colors duration-150 ${
                      isActive
                        ? "font-semibold text-ink"
                        : "font-medium text-ink-soft hover:bg-surface-muted hover:text-ink"
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="navbar-active"
                        transition={SPRING_SNAPPY}
                        className="absolute inset-0 rounded-md bg-surface-muted"
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-1.5">
                      <Icon className="h-[15px] w-[15px]" />
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {/* Tombol Perbesar Tulisan (Ramah Lansia / Penglihatan) */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.95 }}
              transition={SPRING_BOUNCY}
              onClick={cycleTextSize}
              title="Klik untuk memperbesar ukuran tulisan di layar"
              aria-label={`Ubah ukuran tulisan. Sekarang: ${textSizeLabels[textSize]}`}
              className="flex items-center gap-1.5 rounded-lg border border-line bg-surface-muted/60 px-2.5 py-1.5 text-[12px] font-semibold text-ink transition-colors hover:border-brand hover:bg-[#F3E8BC]/30 hover:text-brand cursor-pointer"
            >
              <Type className="h-4 w-4 text-brand" />
              <span className="hidden sm:inline font-bold">{textSizeLabels[textSize]}</span>
              <span className="sm:hidden font-bold">
                {textSize === "normal" ? "A" : textSize === "large" ? "A+" : "A++"}
              </span>
            </motion.button>

            {/* Pengaturan Toko */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.95 }}
              transition={SPRING_BOUNCY}
              onClick={() => setSettingsOpen(true)}
              aria-label="Buka Pengaturan"
              className="flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-[12px] font-medium text-ink-soft transition-colors hover:bg-surface-muted hover:text-ink cursor-pointer"
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Pengaturan</span>
            </motion.button>
          </div>
        </div>

        {/* Navigasi mobile */}
        <nav
          aria-label="Navigasi utama mobile"
          className="flex gap-0.5 overflow-x-auto border-t border-line px-3 py-1.5 md:hidden"
        >
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href || (item.href === "/dashboard" && pathname === "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap rounded-md px-2.5 py-1.5 text-[12px] transition-colors ${
                  isActive ? "bg-surface-muted font-semibold text-ink" : "font-medium text-ink-soft"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        currentStoreName={storeName}
        currentOutletName={outletName}
      />
    </>
  );
}
