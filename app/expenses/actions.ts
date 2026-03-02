// app/expenses/actions.ts
"use server"

import { revalidatePath } from "next/cache"
import { createExpense, listAccounts, listCategories } from "@/lib/store/memoryStore"
import { parseMoneyToCents } from "@/lib/domain/money"

export type CreateExpenseState = {
    error?: string
}

function todayIsoDate(): string {
    return new Date().toISOString().slice(0, 10)
}

export async function createExpenseAction(
    _prevState: CreateExpenseState,
    formData: FormData
): Promise<CreateExpenseState> {
    const accountId = (formData.get("accountId") ?? "").toString()
    const categoryId = (formData.get("categoryId") ?? "").toString()
    const amountRaw = (formData.get("amount") ?? "").toString()
    const description = (formData.get("description") ?? "").toString()
    const expenseDate = ((formData.get("expenseDate") ?? "").toString() || todayIsoDate()).slice(0, 10)
    const enableRoundup = formData.get("enableRoundup") === "on"

    if (!accountId) return { error: "Account is required." }
    if (!categoryId) return { error: "Category is required." }

    // Minimal ID existence checks
    if (!listAccounts().some((a) => a.id === accountId)) return { error: "Selected account not found." }
    if (!listCategories().some((c) => c.id === categoryId)) return { error: "Selected category not found." }

    const amount = parseMoneyToCents(amountRaw)
    if (amount == null) return { error: "Enter a valid amount (e.g. 12.34)." }

    if (!description.trim()) return { error: "Description is required." }

    createExpense({
        accountId,
        categoryId,
        amount,
        description,
        expenseDate,
        enableRoundup,
    })

    revalidatePath("/expenses")
    return {}
}