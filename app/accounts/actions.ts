"use server"

import { revalidatePath } from "next/cache"
import { createAccount } from "@/lib/store/memoryStore"
import type { AccountType } from "@/lib/domain/types"

export async function createAccountAction(formData: FormData) {
    const name = String(formData.get("name") ?? "").trim()
    const type = String(formData.get("type") ?? "").trim() as AccountType

    if (!name) return { ok: false, error: "Name is required." }

    const allowed: AccountType[] = ["CHECKING", "CASH", "SAVINGS", "E_SAVINGS"]
    if (!allowed.includes(type)) return { ok: false, error: "Invalid account type." }

    createAccount({ name, type })
    revalidatePath("/accounts")

    return { ok: true }
}