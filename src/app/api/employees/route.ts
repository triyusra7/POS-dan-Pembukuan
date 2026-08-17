import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Role } from "@prisma/client";

export async function GET() {
  try {
    const employees = await prisma.user.findMany({
      orderBy: [{ isActive: "desc" }, { createdAt: "asc" }],
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, employees });
  } catch (error: any) {
    console.error("Error fetching employees:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Gagal memuat data pegawai" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, username, role = "CASHIER", pin } = body;

    const trimmedName = String(name ?? "").trim();
    const trimmedUsername = String(username ?? "").trim().toLowerCase();

    if (!trimmedName) {
      return NextResponse.json(
        { success: false, message: "Nama pegawai wajib diisi" },
        { status: 400 }
      );
    }

    if (!trimmedUsername) {
      return NextResponse.json(
        { success: false, message: "Username wajib diisi" },
        { status: 400 }
      );
    }

    if (!Object.values(Role).includes(role)) {
      return NextResponse.json({ success: false, message: "Peran tidak dikenali" }, { status: 400 });
    }

    const duplicate = await prisma.user.findUnique({ where: { username: trimmedUsername } });
    if (duplicate) {
      return NextResponse.json(
        { success: false, message: `Username "${trimmedUsername}" sudah dipakai` },
        { status: 409 }
      );
    }

    const company = await prisma.company.findFirst();
    if (!company) {
      return NextResponse.json(
        { success: false, message: "Data perusahaan belum ada" },
        { status: 404 }
      );
    }

    const employee = await prisma.user.create({
      data: {
        companyId: company.id,
        name: trimmedName,
        username: trimmedUsername,
        // Demo internal: kata sandi belum dipakai untuk login apa pun
        password: "demo",
        pin: String(pin ?? "").trim() || null,
        role,
      },
      select: { id: true, name: true, username: true, role: true, isActive: true },
    });

    return NextResponse.json({
      success: true,
      message: `Pegawai "${employee.name}" berhasil ditambahkan`,
      data: employee,
    });
  } catch (error: any) {
    console.error("Error creating employee:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Gagal menambah pegawai" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, role, isActive } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: "ID pegawai wajib" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Pegawai tidak ditemukan" },
        { status: 404 }
      );
    }

    // Pegawai yang sedang bertugas di shift aktif tidak boleh dinonaktifkan
    if (isActive === false) {
      const onDuty = await prisma.shiftCashier.findFirst({
        where: { userId: id, isActive: true, shift: { status: "OPEN" } },
      });
      if (onDuty) {
        return NextResponse.json(
          {
            success: false,
            message: `${existing.name} masih bertugas di shift aktif. Keluarkan dari shift dulu.`,
          },
          { status: 400 }
        );
      }
    }

    const data: Record<string, unknown> = {};
    if (name !== undefined) {
      const trimmed = String(name).trim();
      if (!trimmed) {
        return NextResponse.json(
          { success: false, message: "Nama pegawai tidak boleh kosong" },
          { status: 400 }
        );
      }
      data.name = trimmed;
    }
    if (role !== undefined) data.role = role;
    if (isActive !== undefined) data.isActive = Boolean(isActive);

    const employee = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, name: true, username: true, role: true, isActive: true },
    });

    return NextResponse.json({
      success: true,
      message: `Data "${employee.name}" berhasil diperbarui`,
      data: employee,
    });
  } catch (error: any) {
    console.error("Error updating employee:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Gagal memperbarui pegawai" },
      { status: 500 }
    );
  }
}
