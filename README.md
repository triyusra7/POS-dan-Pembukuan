# 🏪 Sistem POS & Pembukuan Otomatis

Aplikasi kasir (Point of Sales) dan pembukuan akuntansi terintegrasi yang dirancang khusus untuk mempermudah operasional UMKM. Aplikasi ini otomatis menjurnal setiap transaksi penjualan, pembelian stok, dan biaya operasional.

## ✨ Fitur Utama

- **🖥️ Layar Kasir (POS) yang Cepat & Intuitif**: Input barang, kalkulator uang pas otomatis, dan dukungan metode bayar (Tunai & QRIS).
- **📦 Manajemen Stok Barang**: Pantau sisa stok, peringatan barang mau habis, pencatatan barang rusak/hilang, dan restock dari supplier.
- **💸 Pencatatan Arus Kas**: Bayar sewa ruko, listrik, gaji, dll dengan sangat mudah tanpa perlu paham akuntansi.
- **📖 Pembukuan Akuntansi Otomatis**: Setiap transaksi penjualan dan pengeluaran otomatis dijurnal dengan sistem *double-entry* ke buku besar.
- **📊 Asisten Pintar & Dashboard Keuangan**: Kalkulator Untung/Rugi bersih *real-time*, saran cerdas peningkatan omzet, dan edukasi finansial untuk pemilik toko.
- **♿ Aksesibilitas (Ramah Lansia)**: Fitur pengatur ukuran teks (Sedang/Besar/Sangat Besar) agar mudah dibaca oleh siapa saja.

## 🛠️ Teknologi yang Digunakan

- **Frontend & Backend**: Next.js (App Router), TypeScript, Tailwind CSS, Framer Motion
- **UI Components**: Shadcn UI, Lucide Icons
- **Frontend & App Engine**: Next.js (App Router), TypeScript, Tailwind CSS, Framer Motion
- **UI Components**: Shadcn UI, Lucide Icons
- **Data Layer (Demo Mode)**: In-Memory Mock Store & Local JSON (Zero-Config, tanpa perlu PostgreSQL/Docker)

## 🚀 Cara Menjalankan Secara Lokal (Local Development)

Aplikasi ini telah dikonfigurasi dalam mode **Demo Standalone** tanpa membutuhkan instalasi database backend atau Docker:

### 1. Jalankan Aplikasi
```bash
npm install
npm run dev
```

Buka browser Anda dan akses: **http://localhost:3000**

> [!TIP]
> Seluruh transaksi kasir, penyesuaian stok, pengeluaran kas, shift, dan penjurnalan akuntansi otomatis langsung aktif menggunakan mock store lokal (`data/mock-store.json`).

---
*Aplikasi ini dibuat sebagai contoh implementasi sistem kasir dan akuntansi terintegrasi untuk portofolio.*
