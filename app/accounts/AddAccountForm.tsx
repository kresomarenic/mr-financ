'use client'

import { useState } from "react"
import { createAccountAction } from "./actions"

export function AddAccountForm() {
    const [open, setOpen] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [pending, setPending] = useState(false)

    async function onSubmit(formData: FormData) {
        setPending(true)
        setError(null)

        const res = await createAccountAction(formData)

        if (!res.ok) {
            setError(res.error ?? "Something went wrong.")
            setPending(false)
            return
        }

        // reset + close
        const name = formData.get("name")
        if (typeof name === "string") formData.set("name", "")
        setPending(false)
        setOpen(false)
    }

    return (
        <div className="flex items-center gap-2">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
            >
                + Add account
            </button>

            {open && (
                <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200 shadow-sm w-[380px]">
                    <div className="mb-3 flex items-center justify-between">
                        <div className="text-sm font-semibold text-slate-900">
                            New account
                        </div>
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="text-xs text-slate-500 hover:text-slate-700"
                        >
                            Close
                        </button>
                    </div>

                    <form action={onSubmit} className="space-y-3">
                        <div>
                            <label className="block text-xs font-medium text-slate-700">
                                Name
                            </label>
                            <input
                                name="name"
                                placeholder="Main checking"
                                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-700">
                                Type
                            </label>
                            <select
                                name="type"
                                defaultValue="CHECKING"
                                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500"
                            >
                                <option value="CHECKING">CHECKING</option>
                                <option value="CASH">CASH</option>
                                <option value="SAVINGS">SAVINGS</option>
                                <option value="E_SAVINGS">E_SAVINGS</option>
                            </select>
                        </div>

                        {error && (
                            <div className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 ring-1 ring-rose-200">
                                {error}
                            </div>
                        )}

                        <div className="flex items-center justify-end gap-2 pt-1">
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700 ring-1 ring-slate-200 hover:bg-slate-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={pending}
                                className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60 transition-colors"
                            >
                                {pending ? "Adding..." : "Create"}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    )
}