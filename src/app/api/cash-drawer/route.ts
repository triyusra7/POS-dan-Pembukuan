import { NextResponse } from "next/server";
import { getAvailableCashInDrawer } from "@/lib/accounting/cash-drawer";

/** Sisa uang tunai di laci — dipakai panel pengeluaran untuk memberi batas yang jelas */
export async function GET() {
  try {
    const available = await getAvailableCashInDrawer();
    return NextResponse.json({
      success: true,
      hasActiveShift: available !== null,
      available: available ?? 0,
    });
  } catch (error: any) {
    console.error("Error reading cash drawer:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Gagal membaca posisi kas" },
      { status: 500 }
    );
  }
}
