import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Tambah produk baru ke katalog */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      sku,
      barcode,
      categoryId,
      newCategoryName,
      costPrice,
      sellingPrice,
      currentStock = 0,
      minStock = 5,
      unit = "pcs",
    } = body;

    const trimmedName = String(name ?? "").trim();
    const trimmedSku = String(sku ?? "").trim().toUpperCase();
    const cost = Number(costPrice);
    const price = Number(sellingPrice);
    const stock = Math.max(0, Math.floor(Number(currentStock) || 0));
    const min = Math.max(0, Math.floor(Number(minStock) || 0));

    if (!trimmedName) {
      return NextResponse.json(
        { success: false, message: "Nama produk wajib diisi" },
        { status: 400 }
      );
    }

    if (!trimmedSku) {
      return NextResponse.json({ success: false, message: "SKU wajib diisi" }, { status: 400 });
    }

    if (!Number.isFinite(cost) || cost < 0 || !Number.isFinite(price) || price < 0) {
      return NextResponse.json(
        { success: false, message: "Harga modal dan harga jual harus berupa angka positif" },
        { status: 400 }
      );
    }

    const duplicate = await prisma.product.findUnique({ where: { sku: trimmedSku } });
    if (duplicate) {
      return NextResponse.json(
        { success: false, message: `SKU ${trimmedSku} sudah dipakai produk lain` },
        { status: 409 }
      );
    }

    let resolvedCategoryId: string | null = categoryId || null;
    const trimmedNewCategory = String(newCategoryName ?? "").trim();
    if (!resolvedCategoryId && trimmedNewCategory) {
      const category = await prisma.category.upsert({
        where: { slug: slugify(trimmedNewCategory) },
        update: {},
        create: { name: trimmedNewCategory, slug: slugify(trimmedNewCategory) },
      });
      resolvedCategoryId = category.id;
    }

    const product = await prisma.product.create({
      data: {
        name: trimmedName,
        sku: trimmedSku,
        barcode: String(barcode ?? "").trim() || null,
        categoryId: resolvedCategoryId,
        costPrice: cost,
        sellingPrice: price,
        currentStock: stock,
        minStock: min,
        unit: String(unit ?? "pcs").trim() || "pcs",
      },
      include: { category: true },
    });

    return NextResponse.json({
      success: true,
      message: `Produk "${product.name}" berhasil ditambahkan ke katalog`,
      data: product,
    });
  } catch (error: any) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Gagal menambah produk" },
      { status: 500 }
    );
  }
}

/** Ubah detail produk (harga, nama, batas stok minimum, status aktif) */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, costPrice, sellingPrice, minStock, unit, barcode, categoryId, isActive } =
      body;

    if (!id) {
      return NextResponse.json({ success: false, message: "ID produk wajib" }, { status: 400 });
    }

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Produk tidak ditemukan" },
        { status: 404 }
      );
    }

    const data: Record<string, unknown> = {};

    if (name !== undefined) {
      const trimmed = String(name).trim();
      if (!trimmed) {
        return NextResponse.json(
          { success: false, message: "Nama produk tidak boleh kosong" },
          { status: 400 }
        );
      }
      data.name = trimmed;
    }

    for (const [key, value] of [
      ["costPrice", costPrice],
      ["sellingPrice", sellingPrice],
    ] as const) {
      if (value !== undefined) {
        const numeric = Number(value);
        if (!Number.isFinite(numeric) || numeric < 0) {
          return NextResponse.json(
            { success: false, message: "Harga harus berupa angka positif" },
            { status: 400 }
          );
        }
        data[key] = numeric;
      }
    }

    if (minStock !== undefined) {
      data.minStock = Math.max(0, Math.floor(Number(minStock) || 0));
    }
    if (unit !== undefined) data.unit = String(unit).trim() || "pcs";
    if (barcode !== undefined) data.barcode = String(barcode).trim() || null;
    if (categoryId !== undefined) data.categoryId = categoryId || null;
    if (isActive !== undefined) data.isActive = Boolean(isActive);

    const product = await prisma.product.update({
      where: { id },
      data,
      include: { category: true },
    });

    return NextResponse.json({
      success: true,
      message: `Produk "${product.name}" berhasil diperbarui`,
      data: product,
    });
  } catch (error: any) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Gagal memperbarui produk" },
      { status: 500 }
    );
  }
}
