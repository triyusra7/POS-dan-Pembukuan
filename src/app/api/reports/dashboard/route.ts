import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Ambil order hari ini
    const todayOrders = await prisma.salesOrder.findMany({
      where: {
        createdAt: { gte: today },
        isVoid: false,
      },
      include: {
        items: true,
      },
    });

    const omzetHariIni = todayOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalTransaksi = todayOrders.length;

    let totalCostHariIni = 0;
    todayOrders.forEach((o) => {
      o.items.forEach((it) => {
        totalCostHariIni += it.qty * it.unitCost;
      });
    });

    const labaKotorHariIni = omzetHariIni - totalCostHariIni;

    // 1b. Uang keluar hari ini: biaya operasional + belanja stok yang dibayar langsung
    const [expensesToday, purchasesToday] = await Promise.all([
      prisma.expense.findMany({
        where: { expenseDate: { gte: today } },
        select: { amount: true },
      }),
      prisma.purchase.findMany({
        where: { purchaseDate: { gte: today }, paymentType: "CASH" },
        select: { totalAmount: true },
      }),
    ]);

    const biayaOperasionalHariIni = expensesToday.reduce((sum, e) => sum + e.amount, 0);
    const belanjaStokHariIni = purchasesToday.reduce((sum, p) => sum + p.totalAmount, 0);
    const uangKeluarHariIni = biayaOperasionalHariIni + belanjaStokHariIni;
    // Laba bersih memperhitungkan biaya operasional; belanja stok bukan beban sampai barang terjual
    const labaBersihHariIni = labaKotorHariIni - biayaOperasionalHariIni;

    // 2. Ambil Shift Aktif untuk menghitung Kas Aktual Toko
    const activeShift = await prisma.shift.findFirst({
      where: { status: "OPEN" },
    });

    const kasTokoAktual = activeShift ? activeShift.expectedEndingCash : 0;

    // 3. Low stock alerts (currentStock <= minStock)
    const lowStockProducts = await prisma.product.findMany({
      where: {
        currentStock: { lte: prisma.product.fields.minStock },
      },
      include: { category: true },
      orderBy: { currentStock: "asc" },
      take: 10,
    });

    // 4. Top 5 Produk Terlaris
    const orderItems = await prisma.salesOrderItem.findMany({
      include: { product: true },
    });

    const productSalesMap = new Map<string, { name: string; qty: number; revenue: number }>();
    orderItems.forEach((item) => {
      const existing = productSalesMap.get(item.productId) || {
        name: item.product.name,
        qty: 0,
        revenue: 0,
      };
      existing.qty += item.qty;
      existing.revenue += item.subtotal;
      productSalesMap.set(item.productId, existing);
    });

    const topProducts = Array.from(productSalesMap.values())
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    // 5. Tren 7 Hari
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const pastOrders = await prisma.salesOrder.findMany({
      where: {
        createdAt: { gte: sevenDaysAgo },
        isVoid: false,
      },
      select: {
        createdAt: true,
        totalAmount: true,
      },
    });

    const daySalesMap: Record<string, number> = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const key = d.toLocaleDateString("id-ID", { weekday: "short", day: "numeric" });
      daySalesMap[key] = 0;
    }

    pastOrders.forEach((o) => {
      const key = new Date(o.createdAt).toLocaleDateString("id-ID", {
        weekday: "short",
        day: "numeric",
      });
      if (daySalesMap[key] !== undefined) {
        daySalesMap[key] += o.totalAmount;
      }
    });

    const salesTrend = Object.entries(daySalesMap).map(([date, amount]) => ({
      date,
      amount,
    }));

    return NextResponse.json({
      success: true,
      kpis: {
        omzetHariIni,
        labaKotorHariIni,
        labaBersihHariIni,
        uangKeluarHariIni,
        biayaOperasionalHariIni,
        belanjaStokHariIni,
        arusKasBersihHariIni: omzetHariIni - uangKeluarHariIni,
        kasTokoAktual,
        totalTransaksi,
      },
      salesTrend,
      topProducts,
      lowStockProducts,
    });
  } catch (error: any) {
    console.error("Error fetching dashboard reports:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Gagal mengambil data dashboard" },
      { status: 500 }
    );
  }
}
