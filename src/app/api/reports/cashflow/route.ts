import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { EXPENSE_CATEGORY_LABELS } from "@/lib/accounting/ledger";
import { ExpenseCategory } from "@prisma/client";

function startOfDay(offsetDays = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Perputaran uang: uang masuk dari penjualan vs uang keluar dari belanja & biaya */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = Math.min(Math.max(Number(searchParams.get("days")) || 7, 1), 31);
    const rangeStart = startOfDay(days - 1);
    const todayStart = startOfDay(0);

    const [orders, expenses, purchases] = await Promise.all([
      prisma.salesOrder.findMany({
        where: { createdAt: { gte: rangeStart }, isVoid: false },
        select: { createdAt: true, totalAmount: true, paymentMethod: true },
      }),
      prisma.expense.findMany({
        where: { expenseDate: { gte: rangeStart } },
        select: { expenseDate: true, amount: true, category: true, description: true },
      }),
      prisma.purchase.findMany({
        where: { purchaseDate: { gte: rangeStart } },
        select: {
          purchaseDate: true,
          totalAmount: true,
          paymentType: true,
          supplierName: true,
        },
      }),
    ]);

    // Ringkasan hari ini
    const todayOrders = orders.filter((o) => o.createdAt >= todayStart);
    const todayExpenses = expenses.filter((e) => e.expenseDate >= todayStart);
    const todayPurchases = purchases.filter((p) => p.purchaseDate >= todayStart);

    const uangMasukHariIni = todayOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const biayaHariIni = todayExpenses.reduce((sum, e) => sum + e.amount, 0);
    // Pembelian tempo belum mengeluarkan uang, jadi tidak dihitung sebagai arus kas keluar
    const belanjaHariIni = todayPurchases
      .filter((p) => p.paymentType === "CASH")
      .reduce((sum, p) => sum + p.totalAmount, 0);
    const uangKeluarHariIni = biayaHariIni + belanjaHariIni;

    // Tren harian
    const buckets = new Map<string, { label: string; masuk: number; keluar: number }>();
    for (let i = days - 1; i >= 0; i--) {
      const d = startOfDay(i);
      const key = d.toISOString().slice(0, 10);
      buckets.set(key, {
        label: d.toLocaleDateString("id-ID", { weekday: "short", day: "numeric" }),
        masuk: 0,
        keluar: 0,
      });
    }

    const bucketKey = (date: Date) => {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      return d.toISOString().slice(0, 10);
    };

    orders.forEach((o) => {
      const bucket = buckets.get(bucketKey(o.createdAt));
      if (bucket) bucket.masuk += o.totalAmount;
    });
    expenses.forEach((e) => {
      const bucket = buckets.get(bucketKey(e.expenseDate));
      if (bucket) bucket.keluar += e.amount;
    });
    purchases
      .filter((p) => p.paymentType === "CASH")
      .forEach((p) => {
        const bucket = buckets.get(bucketKey(p.purchaseDate));
        if (bucket) bucket.keluar += p.totalAmount;
      });

    const trend = Array.from(buckets.values());

    // Rincian pengeluaran per kategori sepanjang rentang
    const categoryMap = new Map<string, number>();
    expenses.forEach((e) => {
      categoryMap.set(e.category, (categoryMap.get(e.category) || 0) + e.amount);
    });
    const totalBelanjaStok = purchases
      .filter((p) => p.paymentType === "CASH")
      .reduce((sum, p) => sum + p.totalAmount, 0);

    const breakdown = [
      ...Array.from(categoryMap.entries()).map(([category, amount]) => ({
        label: EXPENSE_CATEGORY_LABELS[category as ExpenseCategory] ?? category,
        amount,
      })),
      ...(totalBelanjaStok > 0 ? [{ label: "Belanja Stok Barang", amount: totalBelanjaStok }] : []),
    ].sort((a, b) => b.amount - a.amount);

    const totalMasuk = trend.reduce((sum, t) => sum + t.masuk, 0);
    const totalKeluar = trend.reduce((sum, t) => sum + t.keluar, 0);
    const hutangSupplier = purchases
      .filter((p) => p.paymentType === "CREDIT")
      .reduce((sum, p) => sum + p.totalAmount, 0);

    return NextResponse.json({
      success: true,
      periodDays: days,
      today: {
        uangMasuk: uangMasukHariIni,
        uangKeluar: uangKeluarHariIni,
        biayaOperasional: biayaHariIni,
        belanjaStok: belanjaHariIni,
        arusKasBersih: uangMasukHariIni - uangKeluarHariIni,
        jumlahTransaksi: todayOrders.length,
      },
      range: {
        totalMasuk,
        totalKeluar,
        arusKasBersih: totalMasuk - totalKeluar,
        hutangSupplierBaru: hutangSupplier,
      },
      trend,
      breakdown,
    });
  } catch (error: any) {
    console.error("Error building cashflow report:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Gagal menyusun laporan arus kas" },
      { status: 500 }
    );
  }
}
