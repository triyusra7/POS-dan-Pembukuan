import {
  Prisma,
  PaymentMethod,
  ReferenceType,
  StockAdjustmentReason,
  AccountCategory,
  NormalBalance,
  ExpenseCategory,
  FundSource,
  PurchasePaymentType,
} from "@prisma/client";

export const STANDARD_ACCOUNTS = {
  KAS_TOKO: "1101",
  BANK_QRIS: "1102",
  PIUTANG_KASBON: "1103",
  PERSEDIAAN: "1300",
  HUTANG_SUPPLIER: "2101",
  PENDAPATAN_PENJUALAN: "4100",
  HPP: "5100",
  BEBAN_PENYUSUTAN_KERUSAKAN: "6020",
} as const;

/// Setiap jenis pengeluaran punya akun beban sendiri agar laporan laba rugi terbaca jelas
export const EXPENSE_ACCOUNTS: Record<
  ExpenseCategory,
  { code: string; name: string; description: string }
> = {
  UTILITY: {
    code: "6010",
    name: "Beban Operasional & Listrik Toko",
    description: "Biaya listrik, air, internet",
  },
  RENT: {
    code: "6030",
    name: "Beban Sewa Tempat Usaha",
    description: "Sewa ruko, kios, atau lapak",
  },
  SALARY: {
    code: "6040",
    name: "Beban Gaji & Upah Pegawai",
    description: "Gaji, bonus, dan upah harian pegawai",
  },
  TRANSPORT: {
    code: "6050",
    name: "Beban Transport & Pengiriman",
    description: "Bensin, ongkos kirim, parkir",
  },
  SUPPLIES: {
    code: "6060",
    name: "Beban Perlengkapan Toko",
    description: "Kantong plastik, kertas struk, alat kebersihan",
  },
  OTHER: {
    code: "6090",
    name: "Beban Lain-lain",
    description: "Pengeluaran operasional lainnya",
  },
};

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  UTILITY: "Listrik, Air & Internet",
  RENT: "Sewa Tempat",
  SALARY: "Gaji & Upah Pegawai",
  TRANSPORT: "Transport & Pengiriman",
  SUPPLIES: "Perlengkapan Toko",
  OTHER: "Lain-lain",
};

/**
 * Ambil akun COA berdasarkan kode; buat otomatis bila belum ada.
 * Dipakai untuk akun beban yang baru diperkenalkan setelah seed awal berjalan.
 */
async function ensureAccount(
  tx: Prisma.TransactionClient,
  companyId: string,
  account: { code: string; name: string; description: string },
  category: AccountCategory,
  normalBalance: NormalBalance
): Promise<string> {
  const existing = await tx.chartOfAccount.findUnique({
    where: { companyId_accountCode: { companyId, accountCode: account.code } },
  });
  if (existing) return existing.id;

  const created = await tx.chartOfAccount.create({
    data: {
      companyId,
      accountCode: account.code,
      accountName: account.name,
      category,
      normalBalance,
      description: account.description,
      isSystem: true,
    },
  });
  return created.id;
}

async function requireAccountId(
  tx: Prisma.TransactionClient,
  companyId: string,
  accountCode: string
): Promise<string> {
  const account = await tx.chartOfAccount.findUnique({
    where: { companyId_accountCode: { companyId, accountCode } },
  });
  if (!account) {
    throw new Error(`Akun COA ${accountCode} tidak ditemukan.`);
  }
  return account.id;
}

async function nextEntryNumber(tx: Prisma.TransactionClient, prefix: string): Promise<string> {
  const entryCount = await tx.journalEntry.count();
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `${prefix}-${dateStr}-${String(entryCount + 1).padStart(4, "0")}`;
}

export async function createSalesOrderJournalEntry(
  tx: Prisma.TransactionClient,
  companyId: string,
  salesOrderId: string,
  orderNumber: string,
  paymentMethod: PaymentMethod,
  totalAmount: number,
  totalCost: number
) {
  const accounts = await tx.chartOfAccount.findMany({
    where: {
      companyId,
      accountCode: {
        in: [
          STANDARD_ACCOUNTS.KAS_TOKO,
          STANDARD_ACCOUNTS.BANK_QRIS,
          STANDARD_ACCOUNTS.PIUTANG_KASBON,
          STANDARD_ACCOUNTS.PERSEDIAAN,
          STANDARD_ACCOUNTS.PENDAPATAN_PENJUALAN,
          STANDARD_ACCOUNTS.HPP,
        ],
      },
    },
  });

  const accountMap = new Map(accounts.map((a) => [a.accountCode, a.id]));

  let debitAccountId = accountMap.get(STANDARD_ACCOUNTS.KAS_TOKO);
  if (paymentMethod === PaymentMethod.QRIS || paymentMethod === PaymentMethod.TRANSFER) {
    debitAccountId = accountMap.get(STANDARD_ACCOUNTS.BANK_QRIS) || debitAccountId;
  } else if (paymentMethod === PaymentMethod.KASBON) {
    debitAccountId = accountMap.get(STANDARD_ACCOUNTS.PIUTANG_KASBON) || debitAccountId;
  }

  const revenueAccountId = accountMap.get(STANDARD_ACCOUNTS.PENDAPATAN_PENJUALAN);
  const hppAccountId = accountMap.get(STANDARD_ACCOUNTS.HPP);
  const inventoryAccountId = accountMap.get(STANDARD_ACCOUNTS.PERSEDIAAN);

  if (!debitAccountId || !revenueAccountId || !hppAccountId || !inventoryAccountId) {
    throw new Error("Akun COA standar tidak lengkap.");
  }

  const entryCount = await tx.journalEntry.count();
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const entryNumber = `JV-${dateStr}-${String(entryCount + 1).padStart(4, "0")}`;

  const journalEntry = await tx.journalEntry.create({
    data: {
      entryNumber,
      transactionDate: new Date(),
      referenceType: ReferenceType.SALES,
      referenceId: salesOrderId,
      salesOrderId,
      memo: `Jurnal Otomatis Penjualan Nota #${orderNumber} (${paymentMethod})`,
      isPosted: true,
      journalLines: {
        create: [
          {
            account: { connect: { id: debitAccountId } },
            debitAmount: totalAmount,
            creditAmount: 0,
          },
          {
            account: { connect: { id: revenueAccountId } },
            debitAmount: 0,
            creditAmount: totalAmount,
          },
          {
            account: { connect: { id: hppAccountId } },
            debitAmount: totalCost,
            creditAmount: 0,
          },
          {
            account: { connect: { id: inventoryAccountId } },
            debitAmount: 0,
            creditAmount: totalCost,
          },
        ],
      },
    },
    include: {
      journalLines: {
        include: {
          account: true,
        },
      },
    },
  });

  return journalEntry;
}

export async function createStockAdjustmentJournalEntry(
  tx: Prisma.TransactionClient,
  companyId: string,
  productId: string,
  productName: string,
  qty: number,
  unitCost: number,
  reason: StockAdjustmentReason,
  note?: string
) {
  const accounts = await tx.chartOfAccount.findMany({
    where: {
      companyId,
      accountCode: {
        in: [STANDARD_ACCOUNTS.BEBAN_PENYUSUTAN_KERUSAKAN, STANDARD_ACCOUNTS.PERSEDIAAN],
      },
    },
  });

  const accountMap = new Map(accounts.map((a) => [a.accountCode, a.id]));
  const expenseAccountId = accountMap.get(STANDARD_ACCOUNTS.BEBAN_PENYUSUTAN_KERUSAKAN);
  const inventoryAccountId = accountMap.get(STANDARD_ACCOUNTS.PERSEDIAAN);

  if (!expenseAccountId || !inventoryAccountId) {
    throw new Error("Akun COA standar untuk penyesuaian stok tidak ditemukan (6020 & 1300).");
  }

  const totalLoss = Math.abs(qty) * unitCost;
  const entryCount = await tx.journalEntry.count();
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const entryNumber = `JV-ADJ-${dateStr}-${String(entryCount + 1).padStart(4, "0")}`;

  const reasonLabels: Record<StockAdjustmentReason, string> = {
    DAMAGE: "Barang Rusak",
    EXPIRED: "Barang Basi/Kadaluarsa",
    LOST: "Barang Hilang",
    CORRECTION: "Koreksi Stok Fisik",
  };

  const journalEntry = await tx.journalEntry.create({
    data: {
      entryNumber,
      transactionDate: new Date(),
      referenceType: ReferenceType.STOCK_ADJUSTMENT,
      referenceId: productId,
      memo: `Penyesuaian Stok: ${productName} (${reasonLabels[reason]} ${qty} unit) - ${note || ""}`,
      isPosted: true,
      journalLines: {
        create: [
          {
            account: { connect: { id: expenseAccountId } },
            debitAmount: totalLoss,
            creditAmount: 0,
          },
          {
            account: { connect: { id: inventoryAccountId } },
            debitAmount: 0,
            creditAmount: totalLoss,
          },
        ],
      },
    },
  });

  return journalEntry;
}

/**
 * Jurnal pengeluaran operasional.
 * Debit  : akun beban sesuai kategori
 * Kredit : Kas Toko (bila dibayar dari laci) atau Bank (bila via transfer)
 */
export async function createExpenseJournalEntry(
  tx: Prisma.TransactionClient,
  companyId: string,
  expenseId: string,
  expenseNumber: string,
  category: ExpenseCategory,
  description: string,
  amount: number,
  fundSource: FundSource
) {
  const expenseAccountId = await ensureAccount(
    tx,
    companyId,
    EXPENSE_ACCOUNTS[category],
    AccountCategory.EXPENSE,
    NormalBalance.DEBIT
  );

  const creditAccountId = await requireAccountId(
    tx,
    companyId,
    fundSource === FundSource.BANK ? STANDARD_ACCOUNTS.BANK_QRIS : STANDARD_ACCOUNTS.KAS_TOKO
  );

  const sourceLabel = fundSource === FundSource.BANK ? "Bank/Transfer" : "Kas Laci";

  return tx.journalEntry.create({
    data: {
      entryNumber: await nextEntryNumber(tx, "JV-EXP"),
      transactionDate: new Date(),
      referenceType: ReferenceType.EXPENSE,
      referenceId: expenseId,
      memo: `Pengeluaran ${expenseNumber}: ${description} (${sourceLabel})`,
      isPosted: true,
      journalLines: {
        create: [
          { account: { connect: { id: expenseAccountId } }, debitAmount: amount, creditAmount: 0 },
          { account: { connect: { id: creditAccountId } }, debitAmount: 0, creditAmount: amount },
        ],
      },
    },
  });
}

/**
 * Jurnal pembelian stok ke supplier.
 * Debit  : Persediaan Barang Dagang
 * Kredit : Kas/Bank bila tunai, atau Hutang Usaha bila tempo
 */
export async function createPurchaseJournalEntry(
  tx: Prisma.TransactionClient,
  companyId: string,
  purchaseId: string,
  purchaseNumber: string,
  supplierName: string,
  totalAmount: number,
  paymentType: PurchasePaymentType,
  fundSource: FundSource
) {
  const inventoryAccountId = await requireAccountId(tx, companyId, STANDARD_ACCOUNTS.PERSEDIAAN);

  let creditAccountCode: string = STANDARD_ACCOUNTS.HUTANG_SUPPLIER;
  let paymentLabel = "Tempo / Hutang";

  if (paymentType === PurchasePaymentType.CASH) {
    const isBank = fundSource === FundSource.BANK;
    creditAccountCode = isBank ? STANDARD_ACCOUNTS.BANK_QRIS : STANDARD_ACCOUNTS.KAS_TOKO;
    paymentLabel = isBank ? "Transfer Bank" : "Tunai dari Laci";
  }

  const creditAccountId = await requireAccountId(tx, companyId, creditAccountCode);

  return tx.journalEntry.create({
    data: {
      entryNumber: await nextEntryNumber(tx, "JV-PO"),
      transactionDate: new Date(),
      referenceType: ReferenceType.PURCHASE,
      referenceId: purchaseId,
      memo: `Pembelian Stok ${purchaseNumber} dari ${supplierName} (${paymentLabel})`,
      isPosted: true,
      journalLines: {
        create: [
          { account: { connect: { id: inventoryAccountId } }, debitAmount: totalAmount, creditAmount: 0 },
          { account: { connect: { id: creditAccountId } }, debitAmount: 0, creditAmount: totalAmount },
        ],
      },
    },
  });
}
