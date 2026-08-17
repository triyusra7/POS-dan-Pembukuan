import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import { Toaster } from "@/components/ui/sonner";
import { MotionProvider } from "@/components/motion/motion-primitives";
import { StoreProvider } from "@/components/layout/StoreProvider";
import prisma from "@/lib/prisma";

const jakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "SimplePOS & Pembukuan Otomatis UMKM",
  description:
    "Aplikasi POS Kasir Cepat dengan Automated Double-Entry Accounting Ledger untuk UMKM Retail & F&B",
};

async function getStoreIdentity() {
  try {
    const company = await prisma.company.findFirst({
      include: { outlets: { orderBy: { createdAt: "asc" }, take: 1 } },
    });
    return {
      storeName: company?.name ?? "SimplePOS",
      outletName: company?.outlets[0]?.name ?? "",
    };
  } catch {
    return { storeName: "SimplePOS", outletName: "" };
  }
}

import { AccessibilityProvider } from "@/components/layout/AccessibilityProvider";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { storeName, outletName } = await getStoreIdentity();

  return (
    <html lang="id" className={`${jakartaSans.variable} h-full antialiased`} data-text-size="normal">
      <body className="min-h-full flex flex-col font-sans">
        <AccessibilityProvider>
          <StoreProvider value={{ storeName, outletName }}>
            <MotionProvider>
              <Navbar storeName={storeName} outletName={outletName} />
              <main className="flex-1 flex flex-col">{children}</main>
              <Toaster position="top-right" richColors />
            </MotionProvider>
          </StoreProvider>
        </AccessibilityProvider>
      </body>
    </html>
  );
}
