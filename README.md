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
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Infrastruktur Lokal**: Docker & Docker Compose

## 🚀 Cara Menjalankan Secara Lokal (Local Development)

Ikuti langkah-langkah berikut untuk menjalankan aplikasi ini di komputer Anda:

### 1. Persyaratan Sistem
Pastikan Anda sudah menginstal:
- [Node.js](https://nodejs.org/) (Versi 18 atau lebih baru)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Untuk menjalankan database PostgreSQL lokal)

### 2. Kloning Repository & Install Dependensi
```bash
git clone https://github.com/triyusra7/POS-dan-Pembukuan.git
cd POS-dan-Pembukuan
npm install
```

### 3. Siapkan Database PostgreSQL via Docker
```bash
# Jalankan container database PostgreSQL di background
docker compose up -d
```

### 4. Konfigurasi Environment & Database
Salin file `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```
Lalu, buat struktur tabel di database dan masukkan data awal (seeding):
```bash
npx prisma db push
npx prisma db seed
```

### 5. Jalankan Aplikasi
```bash
npm run dev
```
Buka browser Anda dan akses: **http://localhost:3000**

---
*Aplikasi ini dibuat sebagai contoh implementasi sistem kasir dan akuntansi terintegrasi untuk portofolio.*
