import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ShiftStatus } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shiftId, actualCash, notes } = body as {
      shiftId: string;
      actualCash: number;
      notes?: string;
    };

    if (!shiftId || actualCash === undefined || actualCash === null) {
      return NextResponse.json(
        { success: false, message: "Parameter shiftId dan actualCash wajib diisi" },
        { status: 400 }
      );
    }

    const shift = await prisma.shift.findUnique({
      where: { id: shiftId },
      include: {
        salesOrders: {
          where: { isVoid: false },
        },
      },
    });

    if (!shift || shift.status === ShiftStatus.CLOSED) {
      return NextResponse.json(
        { success: false, message: "Shift tidak ditemukan atau sudah ditutup sebelumnya" },
        { status: 400 }
      );
    }

    // Hitung total kas sistem = Modal Awal + Total Penjualan Tunai
    const cashSales = shift.salesOrders
      .filter((o) => o.paymentMethod === "CASH")
      .reduce((sum, o) => sum + o.totalAmount, 0);

    const expectedEndingCash = shift.initialCash + cashSales;
    const difference = actualCash - expectedEndingCash; // Minus = Selisih Kurang, Plus = Selisih Lebih, 0 = Sesuai

    const updatedShift = await prisma.shift.update({
      where: { id: shiftId },
      data: {
        endTime: new Date(),
        expectedEndingCash,
        actualEndingCash: actualCash,
        difference,
        status: ShiftStatus.CLOSED,
        notes: notes || shift.notes,
      },
      include: {
        cashier: { select: { name: true, username: true } },
        outlet: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Shift berhasil ditutup dan direkap",
      data: {
        shiftId: updatedShift.id,
        cashier: updatedShift.cashier.name,
        startTime: updatedShift.startTime,
        endTime: updatedShift.endTime,
        initialCash: updatedShift.initialCash,
        cashSales,
        expectedEndingCash,
        actualEndingCash: actualCash,
        difference,
        status: difference === 0 ? "SESUAI" : difference < 0 ? "SELISIH_KURANG" : "SELISIH_LEBIH",
      },
    });
  } catch (error: any) {
    console.error("Error closing shift:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Gagal menutup shift" },
      { status: 500 }
    );
  }
}
