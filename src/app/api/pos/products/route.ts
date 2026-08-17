import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const categoryId = searchParams.get("categoryId") || "";

    const whereClause: any = {
      isActive: true,
    };

    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
        { barcode: { contains: search } },
      ];
    }

    if (categoryId && categoryId !== "all") {
      whereClause.categoryId = categoryId;
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      include: {
        category: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      success: true,
      products,
      categories,
    });
  } catch (error: any) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Gagal mengambil data produk" },
      { status: 500 }
    );
  }
}
