import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ShiftStatus } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      initialCash = 0,
      notes = "Buka Shift Baru",
      cashierIds = [],
    } = body as { initialCash?: number; notes?: string; cashierIds?: string[] };

    // Cek apakah ada shift aktif
    const existingOpenShift = await prisma.shift.findFirst({
      where: { status: ShiftStatus.OPEN },
    });

    if (existingOpenShift) {
      return NextResponse.json(
        { success: false, message: "Masih ada shift yang aktif. Tutup shift terlebih dahulu sebelum membuka shift baru." },
        { status: 400 }
      );
    }

    const defaultOutlet = await prisma.outlet.findFirst();

    // Pegawai yang dipilih di form; bila kosong pakai kasir pertama yang aktif
    const selectedIds = Array.isArray(cashierIds) ? cashierIds.filter(Boolean) : [];
    const selectedEmployees = selectedIds.length
      ? await prisma.user.findMany({ where: { id: { in: selectedIds }, isActive: true } })
      : await prisma.user.findMany({ where: { role: "CASHIER", isActive: true }, take: 1 });

    if (!defaultOutlet || selectedEmployees.length === 0) {
      return NextResponse.json(
        { success: false, message: "Outlet atau pegawai kasir tidak ditemukan." },
        { status: 400 }
      );
    }

    const primaryCashier = selectedEmployees[0];

    const newShift = await prisma.shift.create({
      data: {
        outletId: defaultOutlet.id,
        cashierId: primaryCashier.id,
        startTime: new Date(),
        initialCash: Number(initialCash),
        expectedEndingCash: Number(initialCash),
        status: ShiftStatus.OPEN,
        notes,
        assignments: {
          create: selectedEmployees.map((employee) => ({ userId: employee.id })),
        },
      },
      include: {
        cashier: { select: { name: true } },
        outlet: { select: { name: true } },
        assignments: { include: { user: { select: { name: true } } } },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Shift dibuka dengan ${selectedEmployees.length} pegawai bertugas`,
      data: newShift,
    });
  } catch (error: any) {
    console.error("Error opening shift:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Gagal membuka shift" },
      { status: 500 }
    );
  }
}
