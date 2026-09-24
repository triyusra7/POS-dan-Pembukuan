export interface MockDataStore {
  company: any[];
  outlet: any[];
  user: any[];
  category: any[];
  product: any[];
  productStock: any[];
  stockMutation: any[];
  shift: any[];
  shiftCashier: any[];
  salesOrder: any[];
  salesOrderItem: any[];
  expense: any[];
  purchase: any[];
  purchaseItem: any[];
  chartOfAccount: any[];
  journalEntry: any[];
  journalLine: any[];
  customer: any[];
  supplier: any[];
}

export function getInitialMockData(): MockDataStore {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10).replace(/-/g, "");

  const company = [
    {
      id: "comp-1",
      name: "Toko Berkah Retail",
      code: "BJR",
      address: "Jl. Sudirman No. 45, Jakarta Selatan",
      phone: "0812-3456-7890",
      createdAt: new Date("2026-01-01T08:00:00.000Z"),
      updatedAt: now,
    },
  ];

  const outlet = [
    {
      id: "out-1",
      companyId: "comp-1",
      name: "Outlet Utama - Sudirman",
      code: "BJR-01",
      address: "Jl. Sudirman No. 45, Jakarta Selatan",
      phone: "0812-3456-7890",
      createdAt: new Date("2026-01-01T08:00:00.000Z"),
      updatedAt: now,
    },
  ];

  const user = [
    {
      id: "usr-1",
      companyId: "comp-1",
      name: "Pak Hendra (Owner)",
      username: "owner",
      email: "owner@toko-berkah.id",
      password: "password123",
      pin: "123456",
      role: "OWNER",
      isActive: true,
      createdAt: new Date("2026-01-01T08:00:00.000Z"),
      updatedAt: now,
    },
    {
      id: "usr-2",
      companyId: "comp-1",
      name: "Siti Rahma (Admin)",
      username: "admin",
      email: "admin@toko-berkah.id",
      password: "password123",
      pin: "112233",
      role: "ADMIN",
      isActive: true,
      createdAt: new Date("2026-01-01T08:00:00.000Z"),
      updatedAt: now,
    },
    {
      id: "usr-3",
      companyId: "comp-1",
      name: "Budi Santoso (Kasir)",
      username: "kasir1",
      email: "kasir1@toko-berkah.id",
      password: "password123",
      pin: "000000",
      role: "CASHIER",
      isActive: true,
      createdAt: new Date("2026-01-01T08:00:00.000Z"),
      updatedAt: now,
    },
  ];

  const category = [
    { id: "cat-1", name: "Minuman", slug: "minuman", createdAt: now },
    { id: "cat-2", name: "Makanan & Snack", slug: "makanan-snack", createdAt: now },
    { id: "cat-3", name: "Sembako", slug: "sembako", createdAt: now },
    { id: "cat-4", name: "Perlengkapan & Lainnya", slug: "lainnya", createdAt: now },
  ];

  const product = [
    {
      id: "prod-1",
      sku: "KOP-001",
      barcode: "899123456001",
      name: "Kopi Susu Gula Aren 250ml",
      categoryId: "cat-1",
      costPrice: 12000,
      sellingPrice: 20000,
      currentStock: 48,
      minStock: 10,
      unit: "botol",
      imageUrl: null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "prod-2",
      sku: "SUS-001",
      barcode: "899123456002",
      name: "Susu UHT Full Cream 1L",
      categoryId: "cat-1",
      costPrice: 18000,
      sellingPrice: 24000,
      currentStock: 25,
      minStock: 5,
      unit: "kotak",
      imageUrl: null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "prod-3",
      sku: "AIR-001",
      barcode: "899123456003",
      name: "Air Mineral Botol 600ml",
      categoryId: "cat-1",
      costPrice: 2500,
      sellingPrice: 4000,
      currentStock: 116,
      minStock: 20,
      unit: "botol",
      imageUrl: null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "prod-4",
      sku: "BER-001",
      barcode: "899123456004",
      name: "Beras Pandan Wangi Premium 5kg",
      categoryId: "cat-3",
      costPrice: 68000,
      sellingPrice: 78000,
      currentStock: 30,
      minStock: 5,
      unit: "karung",
      imageUrl: null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "prod-5",
      sku: "MYK-001",
      barcode: "899123456005",
      name: "Minyak Goreng Refill 2L",
      categoryId: "cat-3",
      costPrice: 32000,
      sellingPrice: 36500,
      currentStock: 40,
      minStock: 10,
      unit: "pouch",
      imageUrl: null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "prod-6",
      sku: "GUL-001",
      barcode: "899123456006",
      name: "Gula Pasir Kristal Putih 1kg",
      categoryId: "cat-3",
      costPrice: 14500,
      sellingPrice: 17000,
      currentStock: 45,
      minStock: 8,
      unit: "bungkus",
      imageUrl: null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "prod-7",
      sku: "ROT-001",
      barcode: "899123456007",
      name: "Roti Tawar Gandum Spesial",
      categoryId: "cat-2",
      costPrice: 14000,
      sellingPrice: 18000,
      currentStock: 14,
      minStock: 5,
      unit: "bungkus",
      imageUrl: null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "prod-8",
      sku: "SNK-001",
      barcode: "899123456008",
      name: "Keripik Singkong Balado 150g",
      categoryId: "cat-2",
      costPrice: 8000,
      sellingPrice: 12500,
      currentStock: 35,
      minStock: 10,
      unit: "bungkus",
      imageUrl: null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "prod-9",
      sku: "MIE-001",
      barcode: "899123456009",
      name: "Mie Instan Goreng Spesial",
      categoryId: "cat-2",
      costPrice: 2800,
      sellingPrice: 3500,
      currentStock: 196,
      minStock: 30,
      unit: "bungkus",
      imageUrl: null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "prod-10",
      sku: "SAB-001",
      barcode: "899123456010",
      name: "Sabun Mandi Cair Refill 450ml",
      categoryId: "cat-4",
      costPrice: 19000,
      sellingPrice: 25000,
      currentStock: 3, // sengaja dibuat low stock (minStock: 5)
      minStock: 5,
      unit: "pouch",
      imageUrl: null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const productStock = product.map((p) => ({
    id: `ps-${p.id}`,
    productId: p.id,
    outletId: "out-1",
    stockQty: p.currentStock,
    updatedAt: now,
  }));

  const stockMutation = product.map((p) => ({
    id: `sm-${p.id}`,
    productId: p.id,
    outletId: "out-1",
    userId: "usr-2",
    referenceType: "INITIAL",
    referenceId: null,
    reason: null,
    qtyIn: p.currentStock,
    qtyOut: 0,
    balanceStock: p.currentStock,
    note: "Stok awal produk retail",
    createdAt: new Date(Date.now() - 86400000 * 2),
  }));

  const chartOfAccount = [
    { id: "coa-1101", companyId: "comp-1", accountCode: "1101", accountName: "Kas Toko (Laci Kasir)", category: "ASSET", normalBalance: "DEBIT", description: "Kas fisik di kasir", isSystem: true, createdAt: now, updatedAt: now },
    { id: "coa-1102", companyId: "comp-1", accountCode: "1102", accountName: "Bank & QRIS Settlement", category: "ASSET", normalBalance: "DEBIT", description: "Penerimaan via QRIS / EDC / Transfer", isSystem: true, createdAt: now, updatedAt: now },
    { id: "coa-1103", companyId: "comp-1", accountCode: "1103", accountName: "Piutang Usaha / Kasbon Pelanggan", category: "ASSET", normalBalance: "DEBIT", description: "Kasbon / bon belanja", isSystem: true, createdAt: now, updatedAt: now },
    { id: "coa-1300", companyId: "comp-1", accountCode: "1300", accountName: "Persediaan Barang Dagang", category: "ASSET", normalBalance: "DEBIT", description: "Aset persediaan produk retail", isSystem: true, createdAt: now, updatedAt: now },
    { id: "coa-2101", companyId: "comp-1", accountCode: "2101", accountName: "Hutang Usaha (Supplier)", category: "LIABILITY", normalBalance: "CREDIT", description: "Kewajiban pembelian tempo", isSystem: true, createdAt: now, updatedAt: now },
    { id: "coa-3100", companyId: "comp-1", accountCode: "3100", accountName: "Modal Pemilik Usaha", category: "EQUITY", normalBalance: "CREDIT", description: "Ekuitas modal disetor", isSystem: true, createdAt: now, updatedAt: now },
    { id: "coa-3200", companyId: "comp-1", accountCode: "3200", accountName: "Laba Ditahan / Saldo Laba", category: "EQUITY", normalBalance: "CREDIT", description: "Akumulasi profit operasional", isSystem: true, createdAt: now, updatedAt: now },
    { id: "coa-4100", companyId: "comp-1", accountCode: "4100", accountName: "Pendapatan Penjualan POS", category: "REVENUE", normalBalance: "CREDIT", description: "Omzet penjualan kasir", isSystem: true, createdAt: now, updatedAt: now },
    { id: "coa-5100", companyId: "comp-1", accountCode: "5100", accountName: "Beban Pokok Penjualan (HPP)", category: "EXPENSE", normalBalance: "DEBIT", description: "Harga pokok barang terjual", isSystem: true, createdAt: now, updatedAt: now },
    { id: "coa-6010", companyId: "comp-1", accountCode: "6010", accountName: "Beban Operasional & Listrik Toko", category: "EXPENSE", normalBalance: "DEBIT", description: "Biaya listrik, sewa, air", isSystem: true, createdAt: now, updatedAt: now },
    { id: "coa-6020", companyId: "comp-1", accountCode: "6020", accountName: "Beban Kerusakan & Penyusutan Barang", category: "EXPENSE", normalBalance: "DEBIT", description: "Barang rusak, basi, expired, hilang", isSystem: true, createdAt: now, updatedAt: now },
    { id: "coa-6030", companyId: "comp-1", accountCode: "6030", accountName: "Beban Sewa Tempat Usaha", category: "EXPENSE", normalBalance: "DEBIT", description: "Sewa ruko, kios, atau lapak", isSystem: true, createdAt: now, updatedAt: now },
    { id: "coa-6040", companyId: "comp-1", accountCode: "6040", accountName: "Beban Gaji & Upah Pegawai", category: "EXPENSE", normalBalance: "DEBIT", description: "Gaji, bonus, dan upah harian pegawai", isSystem: true, createdAt: now, updatedAt: now },
    { id: "coa-6050", companyId: "comp-1", accountCode: "6050", accountName: "Beban Transport & Pengiriman", category: "EXPENSE", normalBalance: "DEBIT", description: "Bensin, ongkos kirim, parkir", isSystem: true, createdAt: now, updatedAt: now },
    { id: "coa-6060", companyId: "comp-1", accountCode: "6060", accountName: "Beban Perlengkapan Toko", category: "EXPENSE", normalBalance: "DEBIT", description: "Kantong plastik, kertas struk, alat kebersihan", isSystem: true, createdAt: now, updatedAt: now },
    { id: "coa-6090", companyId: "comp-1", accountCode: "6090", accountName: "Beban Lain-lain", category: "EXPENSE", normalBalance: "DEBIT", description: "Pengeluaran operasional lainnya", isSystem: true, createdAt: now, updatedAt: now },
  ];

  const shiftStart = new Date(Date.now() - 5 * 3600 * 1000);
  const shift = [
    {
      id: "shift-1",
      outletId: "out-1",
      cashierId: "usr-3",
      startTime: shiftStart,
      endTime: null,
      initialCash: 200000,
      expectedEndingCash: 270000, // 200rb awal + 70rb penjualan tunai awal
      actualEndingCash: null,
      difference: null,
      status: "OPEN",
      notes: "Shift Pagi Kasir 1",
      createdAt: shiftStart,
      updatedAt: now,
    },
  ];

  const shiftCashier = [
    {
      id: "sc-1",
      shiftId: "shift-1",
      userId: "usr-3",
      joinedAt: shiftStart,
      leftAt: null,
      isActive: true,
      createdAt: shiftStart,
    },
  ];

  // Sample order 1 (Tunai)
  const order1Date = new Date(Date.now() - 3 * 3600 * 1000);
  const order1Id = "so-sample-1";
  const order1Number = `SO-${todayStr}-0001`;

  // Sample order 2 (QRIS)
  const order2Date = new Date(Date.now() - 1 * 3600 * 1000);
  const order2Id = "so-sample-2";
  const order2Number = `SO-${todayStr}-0002`;

  const salesOrder = [
    {
      id: order1Id,
      orderNumber: order1Number,
      outletId: "out-1",
      shiftId: "shift-1",
      cashierId: "usr-3",
      customerId: null,
      paymentMethod: "CASH",
      paymentStatus: "PAID",
      subtotal: 70000,
      discount: 0,
      tax: 0,
      totalAmount: 70000,
      amountPaid: 100000,
      changeAmount: 30000,
      isVoid: false,
      voidReason: null,
      voidByUserId: null,
      createdAt: order1Date,
      updatedAt: order1Date,
    },
    {
      id: order2Id,
      orderNumber: order2Number,
      outletId: "out-1",
      shiftId: "shift-1",
      cashierId: "usr-3",
      customerId: null,
      paymentMethod: "QRIS",
      paymentStatus: "PAID",
      subtotal: 32000,
      discount: 0,
      tax: 0,
      totalAmount: 32000,
      amountPaid: 32000,
      changeAmount: 0,
      isVoid: false,
      voidReason: null,
      voidByUserId: null,
      createdAt: order2Date,
      updatedAt: order2Date,
    },
  ];

  const salesOrderItem = [
    // Order 1 items: 2x Kopi Susu (40rb, cost 24rb), 1x Roti Tawar (18rb, cost 14rb), 3x Air Mineral (12rb, cost 7.5rb) = 70rb (cost 45.5rb)
    {
      id: "soi-1",
      salesOrderId: order1Id,
      productId: "prod-1",
      qty: 2,
      unitPrice: 20000,
      unitCost: 12000,
      subtotal: 40000,
      createdAt: order1Date,
    },
    {
      id: "soi-2",
      salesOrderId: order1Id,
      productId: "prod-7",
      qty: 1,
      unitPrice: 18000,
      unitCost: 14000,
      subtotal: 18000,
      createdAt: order1Date,
    },
    {
      id: "soi-3",
      salesOrderId: order1Id,
      productId: "prod-3",
      qty: 3,
      unitPrice: 4000,
      unitCost: 2500,
      subtotal: 12000,
      createdAt: order1Date,
    },
    // Order 2 items: 1x Air Mineral (4rb, cost 2.5rb), 4x Mie Instan (14rb, cost 11.2rb), 1x Keripik Singkong (12.5rb, cost 8rb) = total ~ 30.5k
    {
      id: "soi-4",
      salesOrderId: order2Id,
      productId: "prod-3",
      qty: 1,
      unitPrice: 4000,
      unitCost: 2500,
      subtotal: 4000,
      createdAt: order2Date,
    },
    {
      id: "soi-5",
      salesOrderId: order2Id,
      productId: "prod-9",
      qty: 4,
      unitPrice: 3500,
      unitCost: 2800,
      subtotal: 14000,
      createdAt: order2Date,
    },
    {
      id: "soi-6",
      salesOrderId: order2Id,
      productId: "prod-8",
      qty: 1,
      unitPrice: 12500,
      unitCost: 8000,
      subtotal: 12500,
      createdAt: order2Date,
    },
  ];

  const journalEntry = [
    {
      id: "jv-1",
      entryNumber: `JV-${todayStr}-0001`,
      transactionDate: order1Date,
      referenceType: "SALES",
      referenceId: order1Id,
      salesOrderId: order1Id,
      memo: `Jurnal Otomatis Penjualan Nota #${order1Number} (CASH)`,
      isPosted: true,
      createdAt: order1Date,
      updatedAt: order1Date,
    },
    {
      id: "jv-2",
      entryNumber: `JV-${todayStr}-0002`,
      transactionDate: order2Date,
      referenceType: "SALES",
      referenceId: order2Id,
      salesOrderId: order2Id,
      memo: `Jurnal Otomatis Penjualan Nota #${order2Number} (QRIS)`,
      isPosted: true,
      createdAt: order2Date,
      updatedAt: order2Date,
    },
  ];

  const journalLine = [
    // JV 1 (Debit Kas Toko 70.000, Credit Penjualan 70.000, Debit HPP 43.500, Credit Persediaan 43.500)
    { id: "jl-1", journalEntryId: "jv-1", accountId: "coa-1101", debitAmount: 70000, creditAmount: 0, createdAt: order1Date },
    { id: "jl-2", journalEntryId: "jv-1", accountId: "coa-4100", debitAmount: 0, creditAmount: 70000, createdAt: order1Date },
    { id: "jl-3", journalEntryId: "jv-1", accountId: "coa-5100", debitAmount: 43500, creditAmount: 0, createdAt: order1Date },
    { id: "jl-4", journalEntryId: "jv-1", accountId: "coa-1300", debitAmount: 0, creditAmount: 43500, createdAt: order1Date },

    // JV 2 (Debit Bank & QRIS 32.000, Credit Penjualan 32.000, Debit HPP 21.700, Credit Persediaan 21.700)
    { id: "jl-5", journalEntryId: "jv-2", accountId: "coa-1102", debitAmount: 32000, creditAmount: 0, createdAt: order2Date },
    { id: "jl-6", journalEntryId: "jv-2", accountId: "coa-4100", debitAmount: 0, creditAmount: 32000, createdAt: order2Date },
    { id: "jl-7", journalEntryId: "jv-2", accountId: "coa-5100", debitAmount: 21700, creditAmount: 0, createdAt: order2Date },
    { id: "jl-8", journalEntryId: "jv-2", accountId: "coa-1300", debitAmount: 0, creditAmount: 21700, createdAt: order2Date },
  ];

  return {
    company,
    outlet,
    user,
    category,
    product,
    productStock,
    stockMutation,
    shift,
    shiftCashier,
    salesOrder,
    salesOrderItem,
    expense: [],
    purchase: [],
    purchaseItem: [],
    chartOfAccount,
    journalEntry,
    journalLine,
    customer: [],
    supplier: [],
  };
}
