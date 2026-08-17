import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ShiftStatus } from "@prisma/client";

export async function GET() {
  try {
    const activeShift = await prisma.shift.findFirst({
      where: { status: ShiftStatus.OPEN },
      include: {
        cashier: { select: { id: true, name: true, username: true } },
        outlet: { select: { id: true, name: true, code: true } },
        assignments: {
          where: { isActive: true },
          include: { user: { select: { id: true, name: true, username: true, role: true } } },
          orderBy: { joinedAt: "asc" },
        },
        salesOrders: {
          include: {
            items: { include: { product: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { startTime: "desc" },
    });

    if (!activeShift) {
      return NextResponse.json({
        success: true,
        hasActiveShift: false,
        shift: null,
      });
    }

    // Shift lama (sebelum fitur multi-kasir) belum punya baris penugasan — buat dari kasir utama
    if (activeShift.assignments.length === 0) {
      await prisma.shiftCashier.upsert({
        where: { shiftId_userId: { shiftId: activeShift.id, userId: activeShift.cashierId } },
        update: { isActive: true, leftAt: null },
        create: {
          shiftId: activeShift.id,
          userId: activeShift.cashierId,
          joinedAt: activeShift.startTime,
        },
      });

      activeShift.assignments = await prisma.shiftCashier.findMany({
        where: { shiftId: activeShift.id, isActive: true },
        include: { user: { select: { id: true, name: true, username: true, role: true } } },
        orderBy: { joinedAt: "asc" },
      });
    }

    const validOrders = activeShift.salesOrders.filter((o) => !o.isVoid);
    const sumBy = (method: string) =>
      validOrders.filter((o) => o.paymentMethod === method).reduce((sum, o) => sum + o.totalAmount, 0);

    const totalCashSales = sumBy("CASH");
    const totalQrisSales = sumBy("QRIS");
    const totalTransferSales = sumBy("TRANSFER");
    const totalKasbonSales = sumBy("KASBON");
    const totalSales = totalCashSales + totalQrisSales + totalTransferSales + totalKasbonSales;

    // Uang yang keluar dari laci selama shift berjalan ikut mengurangi kas yang seharusnya ada
    const [cashExpenses, cashPurchases] = await Promise.all([
      prisma.expense.findMany({
        where: { fundSource: "CASH", expenseDate: { gte: activeShift.startTime } },
        select: { amount: true, description: true, expenseDate: true },
      }),
      prisma.purchase.findMany({
        where: {
          paymentType: "CASH",
          fundSource: "CASH",
          purchaseDate: { gte: activeShift.startTime },
        },
        select: { totalAmount: true, supplierName: true, purchaseDate: true },
      }),
    ]);

    const totalCashExpense = cashExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalCashPurchase = cashPurchases.reduce((sum, p) => sum + p.totalAmount, 0);
    const totalCashOut = totalCashExpense + totalCashPurchase;

    const expectedCashInDrawer = activeShift.initialCash + totalCashSales - totalCashOut;

    return NextResponse.json({
      success: true,
      hasActiveShift: true,
      shift: {
        ...activeShift,
        stats: {
          totalTransactions: validOrders.length,
          totalSales,
          totalCashSales,
          totalQrisSales,
          totalTransferSales,
          totalKasbonSales,
          totalCashExpense,
          totalCashPurchase,
          totalCashOut,
          expectedCashInDrawer,
        },
      },
    });
  } catch (error: any) {
    console.error("Error fetching current shift:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Gagal mengambil data shift" },
      { status: 500 }
    );
  }
}
