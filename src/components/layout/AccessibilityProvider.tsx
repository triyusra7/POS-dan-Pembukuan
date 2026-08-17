"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type TextSize = "normal" | "large" | "extra";

type TextSizeContextType = {
  textSize: TextSize;
  setTextSize: (size: TextSize) => void;
  cycleTextSize: () => void;
};

const TextSizeContext = createContext<TextSizeContextType>({
  textSize: "normal",
  setTextSize: () => {},
  cycleTextSize: () => {},
});

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [textSize, setTextSizeState] = useState<TextSize>("normal");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("pos_text_size") as TextSize | null;
      if (saved && (saved === "normal" || saved === "large" || saved === "extra")) {
        setTextSizeState(saved);
        document.documentElement.setAttribute("data-text-size", saved);
      } else {
        document.documentElement.setAttribute("data-text-size", "normal");
      }
    } catch {
      // localStorage fallback
    }
  }, []);

  const setTextSize = (size: TextSize) => {
    setTextSizeState(size);
    try {
      localStorage.setItem("pos_text_size", size);
      document.documentElement.setAttribute("data-text-size", size);
    } catch {
      // localStorage fallback
    }
  };

  const cycleTextSize = () => {
    if (textSize === "normal") setTextSize("large");
    else if (textSize === "large") setTextSize("extra");
    else setTextSize("normal");
  };

  return (
    <TextSizeContext.Provider value={{ textSize, setTextSize, cycleTextSize }}>
      {children}
    </TextSizeContext.Provider>
  );
}

export function useTextSize() {
  return useContext(TextSizeContext);
}
