import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { PaymentMethod, PaymentStatus, ReferenceType, ShiftStatus } from "@prisma/client";
import { createSalesOrderJournalEntry } from "@/lib/accounting/ledger";

interface CheckoutItem {
  productId: string;
  qty: number;
  unitPrice: number;
  unitCost: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      shiftId,
      items,
      paymentMethod = PaymentMethod.CASH,
      amountPaid = 0,
      discount = 0,
    } = body as {
      shiftId?: string;
      items: CheckoutItem[];
      paymentMethod: PaymentMethod;
      amountPaid: number;
      discount?: number;
    };

    if (!items || items.length === 0) {
      return NextResponse.json(
        { success: false, message: "Keranjang belanja tidak boleh kosong" },
        { status: 400 }
      );
    }

    // 1. Dapatkan Shift Aktif
    let activeShift;
    if (shiftId) {
      activeShift = await prisma.shift.findUnique({
        where: { id: shiftId },
        include: { outlet: { include: { company: true } }, cashier: true },
      });
    } else {
      activeShift = await prisma.shift.findFirst({
        where: { status: ShiftStatus.OPEN },
        include: { outlet: { include: { company: true } }, cashier: true },
        orderBy: { startTime: "desc" },
      });
    }

    if (!activeShift || activeShift.status !== ShiftStatus.OPEN) {
      return NextResponse.json(
        { success: false, message: "Tidak ada shift kasir yang aktif. Harap buka shift terlebih dahulu." },
        { status: 400 }
      );
    }

    const companyId = activeShift.outlet.companyId;
    const outletId = activeShift.outletId;
    const cashierId = activeShift.cashierId;

    // 2. Hitung Subtotal, Total Cost, Total Amount, Kembalian
    const subtotal = items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);
    const totalCost = items.reduce((sum, item) => sum + item.qty * item.unitCost, 0);
    const totalAmount = Math.max(0, subtotal - discount);

    if (paymentMethod === PaymentMethod.CASH && amountPaid < totalAmount) {
      return NextResponse.json(
        { success: false, message: `Nominal bayar kurang! Total belanja: ${totalAmount}, dibayar: ${amountPaid}` },
        { status: 400 }
      );
    }

    const changeAmount = paymentMethod === PaymentMethod.CASH ? Math.max(0, amountPaid - totalAmount) : 0;

    // 3. Jalankan Database ACID Transaction
    const result = await prisma.$transaction(async (tx) => {
      const orderCount = await tx.salesOrder.count();
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const orderNumber = `SO-${dateStr}-${String(orderCount + 1).padStart(4, "0")}`;

      const salesOrder = await tx.salesOrder.create({
        data: {
          orderNumber,
          outletId,
          shiftId: activeShift.id,
          cashierId,
          paymentMethod,
          paymentStatus: PaymentStatus.PAID,
          subtotal,
          discount,
          tax: 0,
          totalAmount,
          amountPaid: paymentMethod === PaymentMethod.CASH ? amountPaid : totalAmount,
          changeAmount,
          items: {
            create: items.map((item) => ({
              productId: item.productId,
              qty: item.qty,
              unitPrice: item.unitPrice,
              unitCost: item.unitCost,
              subtotal: item.qty * item.unitPrice,
            })),
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          cashier: {
            select: { name: true, username: true },
          },
          outlet: true,
        },
      });

      for (const item of items) {
        const prod = await tx.product.findUnique({
          where: { id: item.productId },
        });

        const newStock = (prod?.currentStock || 0) - item.qty;

        await tx.product.update({
          where: { id: item.productId },
          data: { currentStock: newStock },
        });

        await tx.stockMutation.create({
          data: {
            productId: item.productId,
            outletId,
            userId: cashierId,
            referenceType: ReferenceType.SALES,
            referenceId: salesOrder.id,
            qtyIn: 0,
            qtyOut: item.qty,
            balanceStock: newStock,
            note: `Penjualan Kasir #${orderNumber}`,
          },
        });
      }

      if (paymentMethod === PaymentMethod.CASH) {
        await tx.shift.update({
          where: { id: activeShift.id },
          data: {
            expectedEndingCash: {
              increment: totalAmount,
            },
          },
        });
      }

      const journal = await createSalesOrderJournalEntry(
        tx,
        companyId,
        salesOrder.id,
        orderNumber,
        paymentMethod,
        totalAmount,
        totalCost
      );

      return {
        salesOrder,
        journalId: journal.id,
        entryNumber: journal.entryNumber,
      };
    });

    return NextResponse.json({
      success: true,
      message: "Transaksi berhasil dan jurnal otomatis dibukukan",
      data: result.salesOrder,
      journalEntryNumber: result.entryNumber,
      receipt: {
        orderNumber: result.salesOrder.orderNumber,
        date: result.salesOrder.createdAt,
        cashier: result.salesOrder.cashier.name,
        outlet: result.salesOrder.outlet.name,
        items: result.salesOrder.items.map((it: any) => ({
          name: it.product.name,
          qty: it.qty,
          price: it.unitPrice,
          subtotal: it.subtotal,
        })),
        subtotal,
        discount,
        total: totalAmount,
        amountPaid: result.salesOrder.amountPaid,
        change: changeAmount,
        paymentMethod,
      },
    });
  } catch (error: any) {
    console.error("Error POS checkout:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Gagal memproses transaksi checkout" },
      { status: 500 }
    );
  }
}
