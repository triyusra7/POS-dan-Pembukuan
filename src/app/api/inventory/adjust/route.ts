import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ReferenceType, StockAdjustmentReason } from "@prisma/client";
import { createStockAdjustmentJournalEntry } from "@/lib/accounting/ledger";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, qty, reason, note } = body as {
      productId: string;
      qty: number; // Jumlah yang dikurangi (misal: 2)
      reason: StockAdjustmentReason;
      note?: string;
    };

    if (!productId || !qty || qty <= 0 || !reason) {
      return NextResponse.json(
        { success: false, message: "Data penyesuaian stok tidak valid" },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, message: "Produk tidak ditemukan" },
        { status: 404 }
      );
    }

    const outlet = await prisma.outlet.findFirst({
      include: { company: true },
    });

    if (!outlet) {
      return NextResponse.json(
        { success: false, message: "Outlet tidak ditemukan" },
        { status: 404 }
      );
    }

    const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });

    // Jalankan transaksi database
    const result = await prisma.$transaction(async (tx) => {
      const newStock = Math.max(0, product.currentStock - qty);

      // 1. Update Product stock
      await tx.product.update({
        where: { id: productId },
        data: { currentStock: newStock },
      });

      // 2. Catat Stock Mutation
      const mutation = await tx.stockMutation.create({
        data: {
          productId,
          outletId: outlet.id,
          userId: admin?.id,
          referenceType: ReferenceType.STOCK_ADJUSTMENT,
          reason,
          qtyIn: 0,
          qtyOut: qty,
          balanceStock: newStock,
          note: note || `Penyesuaian stok (${reason})`,
        },
      });

      // 3. Otomatisasi Jurnal Beban Kerusakan / Penyusutan
      const journal = await createStockAdjustmentJournalEntry(
        tx,
        outlet.companyId,
        productId,
        product.name,
        qty,
        product.costPrice,
        reason,
        note
      );

      return {
        productName: product.name,
        oldStock: product.currentStock,
        newStock,
        lossAmount: qty * product.costPrice,
        journalEntryNumber: journal.entryNumber,
      };
    });

    return NextResponse.json({
      success: true,
      message: `Stok ${result.productName} berhasil disesuaikan. Beban kerugian sebesar Rp ${result.lossAmount.toLocaleString("id-ID")} telah dibukukan otomatis ke jurnal #${result.journalEntryNumber}.`,
      data: result,
    });
  } catch (error: any) {
    console.error("Error adjusting stock:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Gagal melakukan penyesuaian stok" },
      { status: 500 }
    );
  }
}
