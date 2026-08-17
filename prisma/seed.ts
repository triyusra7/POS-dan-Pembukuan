import { Role, AccountCategory, NormalBalance, ShiftStatus, ReferenceType } from "@prisma/client";
import prisma from "../src/lib/prisma";

async function main() {
  console.log("🌱 Mulai proses database seeding...");

  // 1. Bersihkan data lama jika ada
  await prisma.journalLine.deleteMany();
  await prisma.journalEntry.deleteMany();
  await prisma.salesOrderItem.deleteMany();
  await prisma.salesOrder.deleteMany();
  await prisma.stockMutation.deleteMany();
  await prisma.productStock.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.shift.deleteMany();
  await prisma.chartOfAccount.deleteMany();
  await prisma.user.deleteMany();
  await prisma.outlet.deleteMany();
  await prisma.company.deleteMany();

  // 2. Buat Company
  const company = await prisma.company.create({
    data: {
      name: "Toko Berkah Retail",
      code: "BJR",
      address: "Jl. Sudirman No. 45, Jakarta Selatan",
      phone: "0812-3456-7890",
    },
  });
  console.log("✅ Company dibuat:", company.name);

  // 3. Buat Outlet
  const outlet = await prisma.outlet.create({
    data: {
      companyId: company.id,
      name: "Outlet Utama - Sudirman",
      code: "BJR-01",
      address: "Jl. Sudirman No. 45, Jakarta Selatan",
      phone: "0812-3456-7890",
    },
  });
  console.log("✅ Outlet dibuat:", outlet.name);

  // 4. Buat Users (Owner, Admin, Kasir)
  const owner = await prisma.user.create({
    data: {
      companyId: company.id,
      name: "Pak Hendra (Owner)",
      username: "owner",
      email: "owner@toko-berkah.id",
      password: "password123", // Dalam produksi gunakan bcrypt
      pin: "123456",
      role: Role.OWNER,
    },
  });

  const admin = await prisma.user.create({
    data: {
      companyId: company.id,
      name: "Siti Rahma (Admin)",
      username: "admin",
      email: "admin@toko-berkah.id",
      password: "password123",
      pin: "112233",
      role: Role.ADMIN,
    },
  });

  const cashier = await prisma.user.create({
    data: {
      companyId: company.id,
      name: "Budi Santoso (Kasir)",
      username: "kasir1",
      email: "kasir1@toko-berkah.id",
      password: "password123",
      pin: "000000",
      role: Role.CASHIER,
    },
  });
  console.log("✅ Users dibuat: Owner, Admin, Kasir");

  // 5. Buat Chart of Accounts Standar Ritel & UMKM
  const coaData = [
    { code: "1101", name: "Kas Toko (Laci Kasir)", category: AccountCategory.ASSET, balance: NormalBalance.DEBIT, desc: "Kas fisik di kasir", isSystem: true },
    { code: "1102", name: "Bank & QRIS Settlement", category: AccountCategory.ASSET, balance: NormalBalance.DEBIT, desc: "Penerimaan via QRIS / EDC / Transfer", isSystem: true },
    { code: "1103", name: "Piutang Usaha / Kasbon Pelanggan", category: AccountCategory.ASSET, balance: NormalBalance.DEBIT, desc: "Kasbon / bon belanja", isSystem: true },
    { code: "1300", name: "Persediaan Barang Dagang", category: AccountCategory.ASSET, balance: NormalBalance.DEBIT, desc: "Aset persediaan produk retail", isSystem: true },
    { code: "2101", name: "Hutang Usaha (Supplier)", category: AccountCategory.LIABILITY, balance: NormalBalance.CREDIT, desc: "Kewajiban pembelian tempo", isSystem: true },
    { code: "3100", name: "Modal Pemilik Usaha", category: AccountCategory.EQUITY, balance: NormalBalance.CREDIT, desc: "Ekuitas modal disetor", isSystem: true },
    { code: "3200", name: "Laba Ditahan / Saldo Laba", category: AccountCategory.EQUITY, balance: NormalBalance.CREDIT, desc: "Akumulasi profit operasional", isSystem: true },
    { code: "4100", name: "Pendapatan Penjualan POS", category: AccountCategory.REVENUE, balance: NormalBalance.CREDIT, desc: "Omzet penjualan kasir", isSystem: true },
    { code: "5100", name: "Beban Pokok Penjualan (HPP)", category: AccountCategory.EXPENSE, balance: NormalBalance.DEBIT, desc: "Harga pokok barang terjual", isSystem: true },
    { code: "6010", name: "Beban Operasional & Listrik Toko", category: AccountCategory.EXPENSE, balance: NormalBalance.DEBIT, desc: "Biaya listrik, sewa, air", isSystem: true },
    { code: "6020", name: "Beban Kerusakan & Penyusutan Barang", category: AccountCategory.EXPENSE, balance: NormalBalance.DEBIT, desc: "Barang rusak, basi, expired, hilang", isSystem: true },
  ];

  for (const item of coaData) {
    await prisma.chartOfAccount.create({
      data: {
        companyId: company.id,
        accountCode: item.code,
        accountName: item.name,
        category: item.category,
        normalBalance: item.balance,
        description: item.desc,
        isSystem: item.isSystem,
      },
    });
  }
  console.log("✅ Chart of Accounts (COA) Standar Ritel berhasil didaftarkan");

  // 6. Buat Kategori Produk
  const catMinuman = await prisma.category.create({ data: { name: "Minuman", slug: "minuman" } });
  const catMakanan = await prisma.category.create({ data: { name: "Makanan & Snack", slug: "makanan-snack" } });
  const catSembako = await prisma.category.create({ data: { name: "Sembako", slug: "sembako" } });
  const catLainnya = await prisma.category.create({ data: { name: "Perlengkapan & Lainnya", slug: "lainnya" } });

  // 7. Buat Master Produk Ritel
  const productsData = [
    { sku: "KOP-001", barcode: "899123456001", name: "Kopi Susu Gula Aren 250ml", catId: catMinuman.id, cost: 12000, price: 20000, stock: 50, min: 10, unit: "botol" },
    { sku: "SUS-001", barcode: "899123456002", name: "Susu UHT Full Cream 1L", catId: catMinuman.id, cost: 18000, price: 24000, stock: 25, min: 5, unit: "kotak" },
    { sku: "AIR-001", barcode: "899123456003", name: "Air Mineral Botol 600ml", catId: catMinuman.id, cost: 2500, price: 4000, stock: 120, min: 20, unit: "botol" },
    { sku: "BER-001", barcode: "899123456004", name: "Beras Pandan Wangi Premium 5kg", catId: catSembako.id, cost: 68000, price: 78000, stock: 30, min: 5, unit: "karung" },
    { sku: "MYK-001", barcode: "899123456005", name: "Minyak Goreng Refill 2L", catId: catSembako.id, cost: 32000, price: 36500, stock: 40, min: 10, unit: "pouch" },
    { sku: "GUL-001", barcode: "899123456006", name: "Gula Pasir Kristal Putih 1kg", catId: catSembako.id, cost: 14500, price: 17000, stock: 45, min: 8, unit: "bungkus" },
    { sku: "ROT-001", barcode: "899123456007", name: "Roti Tawar Gandum Spesial", catId: catMakanan.id, cost: 14000, price: 18000, stock: 15, min: 5, unit: "bungkus" },
    { sku: "SNK-001", barcode: "899123456008", name: "Keripik Singkong Balado 150g", catId: catMakanan.id, cost: 8000, price: 12500, stock: 35, min: 10, unit: "bungkus" },
    { sku: "MIE-001", barcode: "899123456009", name: "Mie Instan Goreng Spesial", catId: catMakanan.id, cost: 2800, price: 3500, stock: 200, min: 30, unit: "bungkus" },
    { sku: "SAB-001", barcode: "899123456010", name: "Sabun Mandi Cair Refill 450ml", catId: catLainnya.id, cost: 19000, price: 25000, stock: 18, min: 5, unit: "pouch" },
  ];

  for (const p of productsData) {
    const prod = await prisma.product.create({
      data: {
        sku: p.sku,
        barcode: p.barcode,
        name: p.name,
        categoryId: p.catId,
        costPrice: p.cost,
        sellingPrice: p.price,
        currentStock: p.stock,
        minStock: p.min,
        unit: p.unit,
      },
    });

    await prisma.productStock.create({
      data: {
        productId: prod.id,
        outletId: outlet.id,
        stockQty: p.stock,
      },
    });

    await prisma.stockMutation.create({
      data: {
        productId: prod.id,
        outletId: outlet.id,
        userId: admin.id,
        referenceType: ReferenceType.INITIAL,
        qtyIn: p.stock,
        qtyOut: 0,
        balanceStock: p.stock,
        note: "Stok awal master produk",
      },
    });
  }
  console.log("✅ 10 Master Produk Retail berhasil dimasukkan beserta stok awal");

  // 8. Buka Shift Aktif untuk Kasir (Initial Cash: Rp 200.000)
  const activeShift = await prisma.shift.create({
    data: {
      outletId: outlet.id,
      cashierId: cashier.id,
      startTime: new Date(),
      initialCash: 200000,
      expectedEndingCash: 200000,
      status: ShiftStatus.OPEN,
      notes: "Shift Pagi Kasir 1",
    },
  });
  console.log("✅ Shift Aktif Kasir terbuka (Modal Awal: Rp 200.000)");

  console.log("🎉 Seeding Database Selesai dengan Sukses!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error("❌ Error saat seeding:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
