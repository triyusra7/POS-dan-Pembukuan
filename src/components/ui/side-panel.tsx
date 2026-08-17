"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { EASE_OUT_EXPO } from "@/components/motion/motion-primitives";

type SidePanelProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  /** Lebar panel; "wide" untuk form dengan tabel di dalamnya */
  size?: "default" | "wide";
  /** Tombol aksi di kaki panel */
  footer?: React.ReactNode;
  children: React.ReactNode;
};

const WIDTH_CLASS: Record<NonNullable<SidePanelProps["size"]>, string> = {
  default: "w-full sm:w-[420px]",
  wide: "w-full sm:w-[560px]",
};

export function SidePanel({
  open,
  onClose,
  title,
  description,
  size = "default",
  footer,
  children,
}: SidePanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Esc menutup panel, dan fokus berpindah ke dalam panel saat dibuka
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
      }
    };

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    const focusTimer = window.setTimeout(() => {
      const firstField = panelRef.current?.querySelector<HTMLElement>(
        "input:not([type=hidden]), textarea, select, button"
      );
      firstField?.focus();
    }, 120);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.clearTimeout(focusTimer);
      document.body.style.overflow = originalOverflow;
      previouslyFocused?.focus?.();
    };
  }, [open, onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            onClick={onClose}
            className="absolute inset-0 bg-ink/25"
            aria-hidden="true"
          />

          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
            className={`relative flex h-full flex-col bg-surface shadow-2xl border-l border-line ${WIDTH_CLASS[size]}`}
          >
            <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
              <div className="min-w-0">
                <h2 className="text-[15px] font-bold tracking-tight text-ink">{title}</h2>
                {description && (
                  <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">{description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Tutup panel"
                className="-mr-1 shrink-0 rounded-md p-1.5 text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>

            {footer && (
              <footer className="flex items-center justify-end gap-2 border-t border-line bg-surface-muted/60 px-5 py-3.5">
                {footer}
              </footer>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

/** Baris label + input yang dipakai berulang di dalam panel */
export function PanelField({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={htmlFor} className="block text-xs sm:text-[13px] font-bold text-ink">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs leading-relaxed text-ink-muted">{hint}</p>}
    </div>
  );
}
