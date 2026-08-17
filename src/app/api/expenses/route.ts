import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ExpenseCategory, FundSource } from "@prisma/client";
import { createExpenseJournalEntry } from "@/lib/accounting/ledger";
import { assertCashAvailable } from "@/lib/accounting/cash-drawer";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get("limit")) || 50, 200);

    const expenses = await prisma.expense.findMany({
      orderBy: { expenseDate: "desc" },
      take: limit,
      include: { user: { select: { name: true } } },
    });

    const total = expenses.reduce((sum, e) => sum + e.amount, 0);

    return NextResponse.json({ success: true, expenses, total });
  } catch (error: any) {
    console.error("Error fetching expenses:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Gagal memuat data pengeluaran" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { category, description, amount, fundSource = "CASH", note } = body as {
      category: ExpenseCategory;
      description: string;
      amount: number;
      fundSource?: FundSource;
      note?: string;
    };

    const numericAmount = Number(amount);

    if (!description?.trim()) {
      return NextResponse.json(
        { success: false, message: "Keterangan pengeluaran wajib diisi" },
        { status: 400 }
      );
    }

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return NextResponse.json(
        { success: false, message: "Nominal pengeluaran harus lebih dari nol" },
        { status: 400 }
      );
    }

    if (!Object.values(ExpenseCategory).includes(category)) {
      return NextResponse.json(
        { success: false, message: "Kategori pengeluaran tidak dikenali" },
        { status: 400 }
      );
    }

    const outlet = await prisma.outlet.findFirst({ include: { company: true } });
    if (!outlet) {
      return NextResponse.json(
        { success: false, message: "Outlet tidak ditemukan" },
        { status: 404 }
      );
    }

    if (fundSource === FundSource.CASH) {
      const cashError = await assertCashAvailable(numericAmount);
      if (cashError) {
        return NextResponse.json({ success: false, message: cashError }, { status: 400 });
      }
    }

    const actor = await prisma.user.findFirst({ where: { role: "ADMIN", isActive: true } });

    const result = await prisma.$transaction(async (tx) => {
      const count = await tx.expense.count();
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const expenseNumber = `EXP-${dateStr}-${String(count + 1).padStart(4, "0")}`;

      const expense = await tx.expense.create({
        data: {
          expenseNumber,
          outletId: outlet.id,
          userId: actor?.id,
          category,
          description: description.trim(),
          amount: numericAmount,
          fundSource,
          note: note?.trim() || null,
        },
      });

      const journal = await createExpenseJournalEntry(
        tx,
        outlet.companyId,
        expense.id,
        expense.expenseNumber,
        category,
        expense.description,
        numericAmount,
        fundSource
      );

      // Uang keluar dari laci mengurangi kas shift yang sedang berjalan
      if (fundSource === FundSource.CASH) {
        const activeShift = await tx.shift.findFirst({ where: { status: "OPEN" } });
        if (activeShift) {
          await tx.shift.update({
            where: { id: activeShift.id },
            data: { expectedEndingCash: activeShift.expectedEndingCash - numericAmount },
          });
        }
      }

      return { expense, journalEntryNumber: journal.entryNumber };
    });

    return NextResponse.json({
      success: true,
      message: `Pengeluaran ${result.expense.expenseNumber} tercatat. Jurnal #${result.journalEntryNumber} otomatis dibukukan.`,
      data: result.expense,
    });
  } catch (error: any) {
    console.error("Error creating expense:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Gagal menyimpan pengeluaran" },
      { status: 500 }
    );
  }
}
