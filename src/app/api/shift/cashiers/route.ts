import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/** Tambahkan pegawai ke shift yang sedang berjalan */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shiftId, userId } = body as { shiftId: string; userId: string };

    if (!shiftId || !userId) {
      return NextResponse.json(
        { success: false, message: "Shift dan pegawai wajib dipilih" },
        { status: 400 }
      );
    }

    const shift = await prisma.shift.findUnique({ where: { id: shiftId } });
    if (!shift || shift.status !== "OPEN") {
      return NextResponse.json(
        { success: false, message: "Shift tidak ditemukan atau sudah ditutup" },
        { status: 400 }
      );
    }

    const employee = await prisma.user.findUnique({ where: { id: userId } });
    if (!employee || !employee.isActive) {
      return NextResponse.json(
        { success: false, message: "Pegawai tidak ditemukan atau sudah nonaktif" },
        { status: 404 }
      );
    }

    const existing = await prisma.shiftCashier.findUnique({
      where: { shiftId_userId: { shiftId, userId } },
    });

    if (existing?.isActive) {
      return NextResponse.json(
        { success: false, message: `${employee.name} sudah bertugas di shift ini` },
        { status: 409 }
      );
    }

    // Pegawai yang pernah keluar bisa masuk lagi tanpa membuat baris baru
    const assignment = existing
      ? await prisma.shiftCashier.update({
          where: { id: existing.id },
          data: { isActive: true, leftAt: null, joinedAt: new Date() },
          include: { user: { select: { name: true, role: true } } },
        })
      : await prisma.shiftCashier.create({
          data: { shiftId, userId },
          include: { user: { select: { name: true, role: true } } },
        });

    return NextResponse.json({
      success: true,
      message: `${employee.name} ditambahkan ke shift`,
      data: assignment,
    });
  } catch (error: any) {
    console.error("Error adding shift cashier:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Gagal menambah pegawai ke shift" },
      { status: 500 }
    );
  }
}

/** Keluarkan pegawai dari shift (serah terima di tengah jam kerja) */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shiftId = searchParams.get("shiftId");
    const userId = searchParams.get("userId");

    if (!shiftId || !userId) {
      return NextResponse.json(
        { success: false, message: "Shift dan pegawai wajib dipilih" },
        { status: 400 }
      );
    }

    const assignment = await prisma.shiftCashier.findUnique({
      where: { shiftId_userId: { shiftId, userId } },
      include: { user: { select: { name: true } } },
    });

    if (!assignment || !assignment.isActive) {
      return NextResponse.json(
        { success: false, message: "Pegawai tidak sedang bertugas di shift ini" },
        { status: 404 }
      );
    }

    const activeCount = await prisma.shiftCashier.count({
      where: { shiftId, isActive: true },
    });

    if (activeCount <= 1) {
      return NextResponse.json(
        {
          success: false,
          message: "Minimal satu pegawai harus tetap bertugas. Tambahkan pengganti dulu.",
        },
        { status: 400 }
      );
    }

    await prisma.shiftCashier.update({
      where: { id: assignment.id },
      data: { isActive: false, leftAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      message: `${assignment.user.name} keluar dari shift`,
    });
  } catch (error: any) {
    console.error("Error removing shift cashier:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Gagal mengeluarkan pegawai dari shift" },
      { status: 500 }
    );
  }
}
