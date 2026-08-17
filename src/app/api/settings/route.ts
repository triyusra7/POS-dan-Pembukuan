import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/** Identitas toko dipakai di navbar, struk, dan header laporan */
export async function GET() {
  try {
    const company = await prisma.company.findFirst({
      include: { outlets: { orderBy: { createdAt: "asc" } } },
    });

    if (!company) {
      return NextResponse.json(
        { success: false, message: "Data perusahaan belum ada" },
        { status: 404 }
      );
    }

    const outlet = company.outlets[0] ?? null;

    return NextResponse.json({
      success: true,
      settings: {
        companyId: company.id,
        companyName: company.name,
        companyCode: company.code,
        address: company.address ?? "",
        phone: company.phone ?? "",
        outletId: outlet?.id ?? null,
        outletName: outlet?.name ?? "",
      },
    });
  } catch (error: any) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Gagal memuat pengaturan" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyName, outletName, address, phone } = body as {
      companyName?: string;
      outletName?: string;
      address?: string;
      phone?: string;
    };

    const company = await prisma.company.findFirst({
      include: { outlets: { orderBy: { createdAt: "asc" } } },
    });

    if (!company) {
      return NextResponse.json(
        { success: false, message: "Data perusahaan belum ada" },
        { status: 404 }
      );
    }

    const trimmedCompanyName = companyName?.trim();
    if (companyName !== undefined && !trimmedCompanyName) {
      return NextResponse.json(
        { success: false, message: "Nama toko tidak boleh kosong" },
        { status: 400 }
      );
    }

    const trimmedOutletName = outletName?.trim();
    if (outletName !== undefined && !trimmedOutletName) {
      return NextResponse.json(
        { success: false, message: "Nama outlet tidak boleh kosong" },
        { status: 400 }
      );
    }

    const updated = await prisma.company.update({
      where: { id: company.id },
      data: {
        ...(trimmedCompanyName ? { name: trimmedCompanyName } : {}),
        ...(address !== undefined ? { address: address.trim() || null } : {}),
        ...(phone !== undefined ? { phone: phone.trim() || null } : {}),
      },
    });

    const outlet = company.outlets[0];
    if (outlet && trimmedOutletName) {
      await prisma.outlet.update({
        where: { id: outlet.id },
        data: { name: trimmedOutletName },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Identitas toko berhasil diperbarui menjadi "${updated.name}"`,
    });
  } catch (error: any) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Gagal menyimpan pengaturan" },
      { status: 500 }
    );
  }
}
