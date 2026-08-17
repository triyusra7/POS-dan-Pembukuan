import prisma from "@/lib/prisma";

/**
 * Uang tunai yang saat ini benar-benar ada di laci kasir:
 * modal awal + penjualan tunai − pengeluaran tunai − belanja tunai.
 * Mengembalikan null bila tidak ada shift yang sedang berjalan.
 */
export async function getAvailableCashInDrawer(): Promise<number | null> {
  const activeShift = await prisma.shift.findFirst({
    where: { status: "OPEN" },
    orderBy: { startTime: "desc" },
  });

  if (!activeShift) return null;

  const [cashOrders, cashExpenses, cashPurchases] = await Promise.all([
    prisma.salesOrder.findMany({
      where: { shiftId: activeShift.id, paymentMethod: "CASH", isVoid: false },
      select: { totalAmount: true },
    }),
    prisma.expense.findMany({
      where: { fundSource: "CASH", expenseDate: { gte: activeShift.startTime } },
      select: { amount: true },
    }),
    prisma.purchase.findMany({
      where: {
        paymentType: "CASH",
        fundSource: "CASH",
        purchaseDate: { gte: activeShift.startTime },
      },
      select: { totalAmount: true },
    }),
  ]);

  const cashIn = cashOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const cashOut =
    cashExpenses.reduce((sum, e) => sum + e.amount, 0) +
    cashPurchases.reduce((sum, p) => sum + p.totalAmount, 0);

  return activeShift.initialCash + cashIn - cashOut;
}

/**
 * Menolak pengeluaran tunai yang melebihi isi laci, karena uang fisik
 * tidak mungkin diambil melebihi yang tersedia.
 */
export async function assertCashAvailable(amount: number): Promise<string | null> {
  const available = await getAvailableCashInDrawer();

  if (available === null) {
    return "Belum ada shift kasir yang berjalan. Buka shift dulu, atau pilih sumber dana transfer bank.";
  }

  if (amount > available) {
    return `Uang tunai di laci hanya ${formatRupiahPlain(
      available
    )}. Kurangi nominalnya atau pilih sumber dana transfer bank.`;
  }

  return null;
}

function formatRupiahPlain(value: number): string {
  return `Rp ${Math.round(value).toLocaleString("id-ID")}`;
}
