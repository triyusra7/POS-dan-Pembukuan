"use client";

import { useEffect, useRef } from "react";
import {
  motion,
  animate,
  useMotionValue,
  useReducedMotion,
  MotionConfig,
  type Variants,
} from "framer-motion";

/** Easing & durasi standar seluruh aplikasi (lihat rules: 150-300ms micro, <600ms entrance) */
export const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

export const SPRING_SNAPPY = {
  type: "spring",
  stiffness: 380,
  damping: 30,
} as const;

/** Redaman rendah supaya gerakan sedikit memantul — dipakai untuk umpan balik yang harus terasa */
export const SPRING_BOUNCY = {
  type: "spring",
  stiffness: 520,
  damping: 17,
} as const;

/** Bungkus aplikasi agar semua animasi menghormati prefers-reduced-motion */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

/* ------------------------------------------------------------------ */
/* Stagger container + item                                            */
/* ------------------------------------------------------------------ */

export const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: EASE_OUT_EXPO },
  },
};

type StaggerProps = {
  children: React.ReactNode;
  className?: string;
  /** Jeda antar anak, default 0.06s */
  gap?: number;
};

export function Stagger({ children, className, gap = 0.06 }: StaggerProps) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: gap, delayChildren: 0.05 } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div className={className} variants={staggerItem}>
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* FadeIn sederhana untuk section tunggal                              */
/* ------------------------------------------------------------------ */

type FadeInProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  /** Jarak slide dari bawah dalam px, default 14 */
  y?: number;
};

export function FadeIn({ children, className, delay = 0, y = 14 }: FadeInProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE_OUT_EXPO, delay }}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* AnimatedNumber — angka berhitung naik/turun (count-up)              */
/* ------------------------------------------------------------------ */

type AnimatedNumberProps = {
  value: number;
  format?: (value: number) => string;
  className?: string;
  /** Durasi animasi hitung dalam detik, default 0.7 */
  duration?: number;
};

export function AnimatedNumber({
  value,
  format = (v) => String(Math.round(v)),
  className,
  duration = 0.7,
}: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(value);
  const prefersReducedMotion = useReducedMotion();
  // Tulis langsung ke textContent agar tidak re-render tiap frame
  const formatRef = useRef(format);
  formatRef.current = format;

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (prefersReducedMotion) {
      motionValue.set(value);
      node.textContent = formatRef.current(value);
      return;
    }

    const controls = animate(motionValue, value, {
      duration,
      ease: EASE_OUT_EXPO,
      onUpdate: (latest: number) => {
        node.textContent = formatRef.current(latest);
      },
    });
    return () => controls.stop();
  }, [value, duration, motionValue, prefersReducedMotion]);

  return <span ref={ref} className={className}>{format(value)}</span>;
}
