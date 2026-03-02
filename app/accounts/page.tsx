// app/accounts/page.tsx
import {
    listAccounts,
    listTransactions,
    getAccountBalanceCents,
} from "@/lib/store/memoryStore"
import { formatCents, sumCents } from "@/lib/domain/money"
import type { Account, TransactionType } from "@/lib/domain/types"
import { Badge } from "@/components/badge"
import { AddAccountForm } from "./AddAccountForm"

import {
    CreditCardIcon,
    BanknotesIcon,
    BuildingLibraryIcon,
    CircleStackIcon,
    WalletIcon,
} from "@heroicons/react/24/outline"

function AccountIcon({ type }: { type: Account["type"] }) {
    const cls = "h-5 w-5"
    switch (type) {
        case "CHECKING":
            return <CreditCardIcon className={cls} />
        case "CASH":
            return <BanknotesIcon className={cls} />
        case "SAVINGS":
            return <BuildingLibraryIcon className={cls} />
        case "E_SAVINGS":
            return <CircleStackIcon className={cls} />
        default:
            return <WalletIcon className={cls} />
    }
}

function txVariant(type: TransactionType): "emerald" | "rose" | "sky" | "neutral" {
    switch (type) {
        case "SALARY":
            return "emerald"
        case "EXPENSE":
            return "rose"
        case "TRANSFER":
        case "SAVINGS_ROUNDUP":
            return "sky"
        default:
            return "neutral"
    }
}

function txAmountClass(type: TransactionType) {
    switch (type) {
        case "SALARY":
            return "text-emerald-600"
        case "EXPENSE":
            return "text-rose-600"
        case "TRANSFER":
        case "SAVINGS_ROUNDUP":
            return "text-sky-600"
        default:
            return "text-slate-900"
    }
}

export default async function AccountsPage() {
    const accounts = listAccounts()
    const txs = listTransactions()

    const balances = accounts.map((a) => getAccountBalanceCents(a.id))
    const total = sumCents(balances)

    const accountNameById = new Map(accounts.map((a) => [a.id, a.name]))

    return (
        <div className="mx-auto max-w-5xl space-y-6">
            {/* Header row */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                        Accounts
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Total balance:{" "}
                        <span className="font-mono font-semibold text-slate-900">
              {formatCents(total)}
            </span>
                    </p>
                </div>

                <AddAccountForm />
            </div>

            {/* Account Cards */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {accounts.length === 0 ? (
                    <div className="col-span-full rounded-xl bg-white p-6 ring-1 ring-slate-200">
                        <div className="text-sm font-semibold text-slate-900">
                            No accounts yet
                        </div>
                        <p className="mt-1 text-sm text-slate-500">
                            Add your Checking account first, then inject salary and track expenses.
                        </p>
                    </div>
                ) : (
                    accounts.map((acc, i) => {
                        const bal = getAccountBalanceCents(acc.id)
                        return (
                            <div
                                key={acc.id}
                                className="animate-fade-in rounded-xl bg-white p-5 ring-1 ring-slate-200 shadow-sm hover:bg-slate-50 transition-colors"
                                style={{ animationDelay: `${i * 60}ms` }}
                            >
                                <div className="mb-4 flex items-start justify-between">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-emerald-600 ring-1 ring-slate-200">
                                        <AccountIcon type={acc.type} />
                                    </div>
                                    <Badge variant="neutral">{acc.type}</Badge>
                                </div>

                                <p className="mb-1 text-sm text-slate-500">{acc.name}</p>
                                <p className="text-xl font-semibold font-mono text-slate-900">
                                    {formatCents(bal)}
                                </p>
                            </div>
                        )
                    })
                )}
            </div>

            {/* Transactions */}
            <div className="animate-fade-in rounded-xl bg-white p-6 ring-1 ring-slate-200 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-slate-900">
                    Transaction History
                </h2>

                {txs.length === 0 ? (
                    <div className="rounded-lg bg-slate-50 p-5 ring-1 ring-slate-200">
                        <div className="text-sm font-semibold text-slate-900">
                            No transactions
                        </div>
                        <p className="mt-1 text-sm text-slate-500">
                            Once you add salary/expenses/transfers, they’ll appear here.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                            <tr className="border-b border-slate-200">
                                <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                                    Date
                                </th>
                                <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                                    Type
                                </th>
                                <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                                    From
                                </th>
                                <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                                    To
                                </th>
                                <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                                    Amount
                                </th>
                            </tr>
                            </thead>
                            <tbody>
                            {txs.map((tx) => (
                                <tr
                                    key={tx.id}
                                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                                >
                                    <td className="px-3 py-2.5 font-mono text-xs text-slate-600">
                                        {tx.postedDate}
                                    </td>
                                    <td className="px-3 py-2.5">
                                        <Badge variant={txVariant(tx.type)}>{tx.type}</Badge>
                                    </td>
                                    <td className="px-3 py-2.5 text-slate-500">
                                        {tx.fromAccountId
                                            ? accountNameById.get(tx.fromAccountId) ?? "Unknown"
                                            : "—"}
                                    </td>
                                    <td className="px-3 py-2.5 text-slate-500">
                                        {tx.toAccountId
                                            ? accountNameById.get(tx.toAccountId) ?? "Unknown"
                                            : "—"}
                                    </td>
                                    <td
                                        className={`px-3 py-2.5 text-right font-mono font-semibold ${txAmountClass(
                                            tx.type
                                        )}`}
                                    >
                                        {formatCents(tx.amount)}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}