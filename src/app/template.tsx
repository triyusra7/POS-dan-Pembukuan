"use client";

import { motion } from "framer-motion";
import { EASE_OUT_EXPO } from "@/components/motion/motion-primitives";

/**
 * Template me-remount di tiap navigasi sehingga setiap halaman
 * mendapat transisi masuk yang halus (fade + slide + blur ringan).
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      className="flex-1 flex flex-col"
      initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
    >
      {children}
    </motion.div>
  );
}
