import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const journals = await prisma.journalEntry.findMany({
      include: {
        journalLines: {
          include: {
            account: true,
          },
        },
      },
      orderBy: {
        transactionDate: "desc",
      },
    });

    const accounts = await prisma.chartOfAccount.findMany({
      orderBy: { accountCode: "asc" },
    });

    // Hitung total debit & kredit
    let totalDebit = 0;
    let totalCredit = 0;

    journals.forEach((j) => {
      j.journalLines.forEach((l) => {
        totalDebit += l.debitAmount;
        totalCredit += l.creditAmount;
      });
    });

    return NextResponse.json({
      success: true,
      journals,
      accounts,
      summary: {
        totalEntries: journals.length,
        totalDebit,
        totalCredit,
        isBalanced: Math.abs(totalDebit - totalCredit) < 0.01,
      },
    });
  } catch (error: any) {
    console.error("Error fetching journals:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Gagal mengambil data jurnal" },
      { status: 500 }
    );
  }
}
