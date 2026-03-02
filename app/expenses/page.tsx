// app/expenses/page.tsx
import { Badge } from "@/components/badge"
import { formatCents } from "@/lib/domain/money"
import { listAccounts, listCategories, listExpenses, listTransactions } from "@/lib/store/memoryStore"
import { AddExpenseForm } from "./AddExpenseForm"
import type { TransactionType } from "@/lib/domain/types"

function formatShortDate(isoDate: string): string {
    const [y, m, d] = isoDate.split("-").map((x) => Number(x))
    const dt = new Date(y, (m ?? 1) - 1, d ?? 1)
    return dt.toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

function txVariant(type: TransactionType): "emerald" | "rose" | "sky" | "neutral" {
    switch (type) {
        case "EXPENSE":
            return "rose"
        case "SAVINGS_ROUNDUP":
            return "sky"
        default:
            return "neutral"
    }
}

export default async function ExpensesPage({
                                         searchParams,
                                     }: {
    searchParams?: Promise<{ category?: string; account?: string }>;
}) {
    const sp = searchParams ? await searchParams : undefined;
    const accounts = listAccounts()
    const categoriesAll = listCategories()
    const categories = categoriesAll.filter((c) => c.type !== "SAVINGS" && c.type !== "SYSTEM")

    const expenses = listExpenses()
    const txns = listTransactions()

    const categoryFilter = sp?.category ?? "all"
    const accountFilter = sp?.account ?? "all"

    const accountById = new Map(accounts.map((a) => [a.id, a.name]))
    const categoryById = new Map(categoriesAll.map((c) => [c.id, c]))

    const expenseTxnByExpenseId = new Map(
        txns
            .filter((t) => t.type === "EXPENSE" && t.referenceId)
            .map((t) => [t.referenceId as string, t])
    )

    const roundupTxnByExpenseId = new Map(
        txns
            .filter((t) => t.type === "SAVINGS_ROUNDUP" && t.referenceId)
            .map((t) => [t.referenceId as string, t])
    )

    const filtered = expenses.filter((e) => {
        if (categoryFilter !== "all" && e.categoryId !== categoryFilter) return false
        if (accountFilter !== "all") {
            const t = expenseTxnByExpenseId.get(e.id)
            if (!t || t.fromAccountId !== accountFilter) return false
        }
        return true
    })

    return (
        <div className="mx-auto max-w-5xl space-y-6">
            {/* Header row */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Expenses</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        {filtered.length} expense{filtered.length === 1 ? "" : "s"} recorded
                    </p>
                </div>

                <AddExpenseForm accounts={accounts} categories={categories} />
            </div>

            {/* Filters */}
            <form className="flex flex-wrap items-center gap-3">
                <span className="text-sm text-slate-500">Filter:</span>

                <select
                    name="account"
                    defaultValue={accountFilter}
                    className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm"
                >
                    <option value="all">All Accounts</option>
                    {accounts.map((a) => (
                        <option key={a.id} value={a.id}>
                            {a.name}
                        </option>
                    ))}
                </select>

                <select
                    name="category"
                    defaultValue={categoryFilter}
                    className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm"
                >
                    <option value="all">All Categories</option>
                    {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                            {c.name}
                        </option>
                    ))}
                </select>

                <button
                    type="submit"
                    className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 hover:bg-slate-50"
                >
                    Apply
                </button>
            </form>

            {/* Table */}
            <div className="animate-fade-in overflow-hidden rounded-xl bg-white ring-1 ring-slate-200 shadow-sm">
                <table className="w-full text-sm">
                    <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                            Date
                        </th>
                        <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                            Description
                        </th>
                        <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                            Category
                        </th>
                        <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                            Account
                        </th>
                        <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                            Amount
                        </th>
                        <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                            Roundup
                        </th>
                    </tr>
                    </thead>

                    <tbody>
                    {filtered.length === 0 ? (
                        <tr>
                            <td colSpan={6} className="px-3 py-10 text-center text-slate-500">
                                No expenses yet.
                            </td>
                        </tr>
                    ) : (
                        filtered.map((e) => {
                            const cat = categoryById.get(e.categoryId)
                            const expTxn = expenseTxnByExpenseId.get(e.id)
                            const ruTxn = roundupTxnByExpenseId.get(e.id)

                            return (
                                <tr
                                    key={e.id}
                                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                                >
                                    <td className="px-3 py-2.5 font-mono text-xs text-slate-600">
                                        {formatShortDate(e.expenseDate)}
                                    </td>
                                    <td className="px-3 py-2.5 text-slate-800">{e.description}</td>
                                    <td className="px-3 py-2.5">
                                        <Badge variant={txVariant("EXPENSE")}>{cat?.name ?? "—"}</Badge>
                                    </td>
                                    <td className="px-3 py-2.5 text-slate-500">
                                        {expTxn?.fromAccountId ? accountById.get(expTxn.fromAccountId) ?? "Unknown" : "—"}
                                    </td>
                                    <td className="px-3 py-2.5 text-right font-mono font-semibold text-rose-600">
                                        {formatCents(e.amount)}
                                    </td>
                                    <td className="px-3 py-2.5 text-right font-mono font-semibold text-sky-600">
                                        {ruTxn ? formatCents(ruTxn.amount) : "—"}
                                    </td>
                                </tr>
                            )
                        })
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}