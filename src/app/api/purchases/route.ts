import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { FundSource, PurchasePaymentType, ReferenceType } from "@prisma/client";
import { createPurchaseJournalEntry } from "@/lib/accounting/ledger";
import { assertCashAvailable } from "@/lib/accounting/cash-drawer";

type IncomingItem = {
  productId: string;
  qty: number;
  unitCost: number;
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get("limit")) || 50, 200);

    const purchases = await prisma.purchase.findMany({
      orderBy: { purchaseDate: "desc" },
      take: limit,
      include: {
        items: { include: { product: { select: { name: true, unit: true } } } },
        user: { select: { name: true } },
      },
    });

    const total = purchases.reduce((sum, p) => sum + p.totalAmount, 0);

    return NextResponse.json({ success: true, purchases, total });
  } catch (error: any) {
    console.error("Error fetching purchases:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Gagal memuat data pembelian" },
      { status: 500 }
    );
  }
}

/** Pembelian stok: menambah persediaan sekaligus mencatat uang keluar atau hutang supplier */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      supplierName = "Supplier Umum",
      items,
      paymentType = "CASH",
      fundSource = "CASH",
      note,
    } = body as {
      supplierName?: string;
      items: IncomingItem[];
      paymentType?: PurchasePaymentType;
      fundSource?: FundSource;
      note?: string;
    };

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, message: "Minimal satu barang harus dipilih" },
        { status: 400 }
      );
    }

    const normalizedItems = items.map((item) => ({
      productId: item.productId,
      qty: Math.floor(Number(item.qty)),
      unitCost: Number(item.unitCost),
    }));

    const hasInvalidItem = normalizedItems.some(
      (item) =>
        !item.productId ||
        !Number.isFinite(item.qty) ||
        item.qty <= 0 ||
        !Number.isFinite(item.unitCost) ||
        item.unitCost < 0
    );

    if (hasInvalidItem) {
      return NextResponse.json(
        { success: false, message: "Jumlah dan harga beli barang tidak valid" },
        { status: 400 }
      );
    }

    const outlet = await prisma.outlet.findFirst({ include: { company: true } });
    if (!outlet) {
      return NextResponse.json(
        { success: false, message: "Outlet tidak ditemukan" },
        { status: 404 }
      );
    }

    const products = await prisma.product.findMany({
      where: { id: { in: normalizedItems.map((i) => i.productId) } },
    });

    if (products.length !== normalizedItems.length) {
      return NextResponse.json(
        { success: false, message: "Ada produk yang tidak ditemukan" },
        { status: 404 }
      );
    }

    const productMap = new Map(products.map((p) => [p.id, p]));
    const totalAmount = normalizedItems.reduce((sum, i) => sum + i.qty * i.unitCost, 0);

    if (paymentType === PurchasePaymentType.CASH && fundSource === FundSource.CASH) {
      const cashError = await assertCashAvailable(totalAmount);
      if (cashError) {
        return NextResponse.json(
          { success: false, message: `${cashError} Bisa juga pilih pembayaran tempo.` },
          { status: 400 }
        );
      }
    }

    const actor = await prisma.user.findFirst({ where: { role: "ADMIN", isActive: true } });
    const resolvedSupplier = supplierName?.trim() || "Supplier Umum";

    const result = await prisma.$transaction(async (tx) => {
      const count = await tx.purchase.count();
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const purchaseNumber = `PO-${dateStr}-${String(count + 1).padStart(4, "0")}`;

      const purchase = await tx.purchase.create({
        data: {
          purchaseNumber,
          outletId: outlet.id,
          userId: actor?.id,
          supplierName: resolvedSupplier,
          paymentType,
          fundSource,
          totalAmount,
          note: note?.trim() || null,
          items: {
            create: normalizedItems.map((item) => ({
              productId: item.productId,
              qty: item.qty,
              unitCost: item.unitCost,
              subtotal: item.qty * item.unitCost,
            })),
          },
        },
      });

      // Tambah stok dan catat mutasi per produk
      for (const item of normalizedItems) {
        const product = productMap.get(item.productId)!;
        const newStock = product.currentStock + item.qty;

        await tx.product.update({
          where: { id: item.productId },
          // HPP ikut diperbarui agar laba kotor memakai harga beli terbaru
          data: { currentStock: newStock, costPrice: item.unitCost },
        });

        await tx.stockMutation.create({
          data: {
            productId: item.productId,
            outletId: outlet.id,
            userId: actor?.id,
            referenceType: ReferenceType.PURCHASE,
            referenceId: purchase.id,
            qtyIn: item.qty,
            qtyOut: 0,
            balanceStock: newStock,
            note: `Pembelian ${purchaseNumber} dari ${resolvedSupplier}`,
          },
        });
      }

      const journal = await createPurchaseJournalEntry(
        tx,
        outlet.companyId,
        purchase.id,
        purchaseNumber,
        resolvedSupplier,
        totalAmount,
        paymentType,
        fundSource
      );

      // Bayar tunai dari laci mengurangi kas shift berjalan
      if (paymentType === PurchasePaymentType.CASH && fundSource === FundSource.CASH) {
        const activeShift = await tx.shift.findFirst({ where: { status: "OPEN" } });
        if (activeShift) {
          await tx.shift.update({
            where: { id: activeShift.id },
            data: { expectedEndingCash: activeShift.expectedEndingCash - totalAmount },
          });
        }
      }

      return { purchase, journalEntryNumber: journal.entryNumber };
    });

    return NextResponse.json({
      success: true,
      message: `Pembelian ${result.purchase.purchaseNumber} tersimpan. Stok bertambah dan jurnal #${result.journalEntryNumber} dibukukan.`,
      data: result.purchase,
    });
  } catch (error: any) {
    console.error("Error creating purchase:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Gagal menyimpan pembelian" },
      { status: 500 }
    );
  }
}
