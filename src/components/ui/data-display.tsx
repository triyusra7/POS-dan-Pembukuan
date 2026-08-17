"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { AnimatedNumber } from "@/components/motion/motion-primitives";
import { formatRupiah } from "@/lib/format";

type Tone = "neutral" | "positive" | "negative" | "brand" | "sidecar";

const VALUE_TONE: Record<Tone, string> = {
  neutral: "text-ink",
  positive: "text-positive",
  negative: "text-negative",
  brand: "text-brand",
  sidecar: "text-[#035352]",
};

const ICON_TONE: Record<Tone, string> = {
  neutral: "text-ink-muted",
  positive: "text-positive",
  negative: "text-negative",
  brand: "text-brand",
  sidecar: "text-[#7a6414]",
};

type StatCardProps = {
  label: string;
  value: number;
  /** Default memformat sebagai rupiah */
  format?: (value: number) => string;
  caption?: string;
  icon?: LucideIcon;
  tone?: Tone;
  /** Tampilkan lebih menonjol sebagai angka utama halaman */
  emphasis?: boolean;
};

export function StatCard({
  label,
  value,
  format = (v) => formatRupiah(Math.round(v)),
  caption,
  icon: Icon,
  tone = "neutral",
  emphasis = false,
}: StatCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.015 }}
      transition={{ type: "spring", stiffness: 400, damping: 22 }}
      className="h-full rounded-lg border border-line bg-surface p-4 transition-shadow hover:border-line-strong hover:shadow-md"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[12px] font-medium text-ink-soft">{label}</span>
        {Icon && <Icon className={`h-4 w-4 ${ICON_TONE[tone]}`} />}
      </div>
      <p
        className={`num mt-2.5 font-bold leading-none ${VALUE_TONE[tone]} ${
          emphasis ? "text-[26px]" : "text-[19px]"
        }`}
      >
        <AnimatedNumber value={value} format={format} duration={0.8} />
      </p>
      {caption && <p className="mt-2 text-[11.5px] leading-snug text-ink-muted">{caption}</p>}
    </motion.div>
  );
}

export function SectionCard({
  title,
  action,
  children,
  className = "",
}: {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-lg border border-line bg-surface ${className}`}>
      {title && (
        <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
          <h2 className="text-[13.5px] font-bold tracking-tight text-ink">{title}</h2>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-muted">
        <Icon className="h-[18px] w-[18px] text-ink-muted" />
      </span>
      <p className="mt-3 text-[13px] font-semibold text-ink">{title}</p>
      {description && (
        <p className="mt-1 max-w-sm text-[12.5px] leading-relaxed text-ink-muted">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/** Titik status kecil — dipakai untuk stok, kategori akun, dan status shift */
export function StatusDot({ tone }: { tone: "positive" | "negative" | "warning" | "brand" | "muted" }) {
  const color = {
    positive: "bg-positive",
    negative: "bg-negative",
    warning: "bg-warning",
    brand: "bg-brand",
    muted: "bg-ink-muted",
  }[tone];
  return <span aria-hidden="true" className={`inline-block h-1.5 w-1.5 rounded-full ${color}`} />;
}
