// app/expenses/AddExpenseForm.tsx
"use client"

import { useActionState, useEffect, useMemo, useState } from "react"
import type { Account, Category } from "@/lib/domain/types"
import { createExpenseAction, type CreateExpenseState } from "./actions"

const initialState: CreateExpenseState = {}

export function AddExpenseForm({
                                   accounts,
                                   categories,
                               }: {
    accounts: Account[]
    categories: Category[]
}) {
    const [open, setOpen] = useState(false)
    const [state, formAction, pending] = useActionState(createExpenseAction, initialState)

    // Close the form on successful submit
    useEffect(() => {
        if (!state.error && open && !pending) {
            // This will also run on initial render; guard by "open"
            // After successful submit, action returns {} and page revalidates.
            setOpen(false)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.error, pending])

    const defaultAccountId = useMemo(() => accounts[0]?.id ?? "", [accounts])

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="inline-flex h-10 items-center gap-2 rounded-md bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800"
            >
                <span className="text-base leading-none">+</span>
                Add Expense
            </button>

            {open ? (
                <div className="absolute right-0 z-30 mt-3 w-[min(720px,calc(100vw-2rem))]">
                    <div className="rounded-xl bg-white ring-1 ring-slate-200 shadow-sm">
                        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                            <div>
                                <div className="text-sm font-semibold text-slate-900">New Expense</div>
                                <div className="mt-0.5 text-xs text-slate-500">
                                    Creates an EXPENSE transaction and optional SAVINGS_ROUNDUP.
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="h-8 rounded-md px-3 text-sm text-slate-600 hover:bg-slate-50"
                            >
                                Close
                            </button>
                        </div>

                        <form action={formAction} className="space-y-4 px-5 py-5">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Account</label>
                                    <select
                                        name="accountId"
                                        defaultValue={defaultAccountId}
                                        className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                                        required
                                    >
                                        {accounts.map((a) => (
                                            <option key={a.id} value={a.id}>
                                                {a.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Amount</label>
                                    <input
                                        name="amount"
                                        inputMode="decimal"
                                        placeholder="0.00"
                                        className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-mono"
                                        required
                                        autoFocus
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Category</label>
                                    <select
                                        name="categoryId"
                                        className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                                        required
                                        defaultValue=""
                                    >
                                        <option value="" disabled>
                                            Select category
                                        </option>
                                        {categories.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Date</label>
                                    <input
                                        name="expenseDate"
                                        type="date"
                                        defaultValue={new Date().toISOString().slice(0, 10)}
                                        className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                                    />
                                </div>

                                <div className="space-y-2 md:col-span-2 lg:col-span-3">
                                    <label className="text-sm font-medium text-slate-700">Description</label>
                                    <input
                                        name="description"
                                        placeholder="What was it for?"
                                        className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                                        required
                                    />
                                </div>

                                <div className="flex items-end">
                                    <label className="flex h-10 w-full select-none items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700">
                                        <input name="enableRoundup" type="checkbox" className="h-4 w-4 accent-slate-900" />
                                        Enable roundup
                                    </label>
                                </div>
                            </div>

                            {state.error ? (
                                <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-100">
                                    {state.error}
                                </div>
                            ) : null}

                            <div className="flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setOpen(false)}
                                    className="h-10 rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={pending}
                                    className="h-10 rounded-md bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
                                >
                                    {pending ? "Saving…" : "Save Expense"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}
        </div>
    )
}