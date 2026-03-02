// app/mvp/MvpClient.tsx
"use client";

import * as React from "react";
import { addExpenseAction, deleteExpenseAction, updateExpenseAction } from "./actions";
import {formatAbsEurForInput, formatEurFromCents} from "@/lib/domain/money";
import {CategoryRow, TxnRow} from "@/app/mvp/queries";

type UUID = string;

export function MvpClient(props: {
    householdId: UUID;
    mainAccountId: UUID;
    categories: CategoryRow[];
    txns: TxnRow[];
}) {
    const { householdId, mainAccountId, categories, txns } = props;

    const [showAddExpense, setShowAddExpense] = React.useState(false);
    const [openRowId, setOpenRowId] = React.useState<UUID | null>(null);

    return (
        <div className="space-y-6">
            {/* Add expense (compact + hidden) */}
            <section className="rounded-lg border border-neutral-200 p-3">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold">Expenses</h2>
                    <button
                        type="button"
                        onClick={() => setShowAddExpense((v) => !v)}
                        className="text-sm rounded-md border border-neutral-300 bg-white px-3 py-1.5 hover:bg-neutral-50"
                    >
                        {showAddExpense ? "Close" : "+ Add"}
                    </button>
                </div>

                {showAddExpense && (
                    <form action={addExpenseAction} className="mt-3 grid gap-2 max-w-xl">
                        <input type="hidden" name="householdId" value={householdId} />
                        <input type="hidden" name="accountId" value={mainAccountId} />

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            <label className="grid gap-1 text-xs">
                                <span className="font-medium">Date/time</span>
                                <input
                                    name="occurredAt"
                                    type="datetime-local"
                                    required
                                    className="w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
                                />
                            </label>

                            <label className="grid gap-1 text-xs">
                                <span className="font-medium">Category</span>
                                <select
                                    name="categoryId"
                                    required
                                    className="w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
                                >
                                    {categories.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label className="grid gap-1 text-xs">
                                <span className="font-medium">Amount (EUR)</span>
                                <input
                                    name="amountEur"
                                    inputMode="decimal"
                                    placeholder="12.34"
                                    required
                                    className="w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
                                />
                            </label>
                        </div>

                        <label className="grid gap-1 text-xs">
                            <span className="font-medium">Description</span>
                            <input
                                name="description"
                                required
                                className="w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
                            />
                        </label>

                        <label className="flex items-center gap-2 text-xs">
                            <input name="roundupEnabled" type="checkbox" className="h-4 w-4" />
                            <span className="font-medium">Roundup</span>
                            <span className="text-neutral-500">(e.g. 12.00 → 1.00)</span>
                        </label>

                        <button
                            type="submit"
                            className="w-fit rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-neutral-50"
                        >
                            Add expense
                        </button>
                    </form>
                )}
            </section>

            {/* Transactions table with per-row edit */}
            <section className="space-y-2">
                <h2 className="text-lg font-semibold">Main account transactions (cycle)</h2>

                <div className="overflow-x-auto rounded-lg border border-neutral-200">
                    <table className="w-full border-collapse text-sm">
                        <thead className="bg-neutral-50">
                        <tr>
                            <th className="text-left font-medium px-3 py-2 border-b border-neutral-200">Date</th>
                            <th className="text-left font-medium px-3 py-2 border-b border-neutral-200">Desc</th>
                            <th className="text-left font-medium px-3 py-2 border-b border-neutral-200">Category</th>
                            <th className="text-left font-medium px-3 py-2 border-b border-neutral-200">Group</th>
                            <th className="text-right font-medium px-3 py-2 border-b border-neutral-200">Amount</th>
                            <th className="text-right font-medium px-3 py-2 border-b border-neutral-200">Roundup</th>
                            <th className="text-right font-medium px-3 py-2 border-b border-neutral-200">Edit</th>
                        </tr>
                        </thead>

                        <tbody>
                        {txns.map((t) => {
                            const isOpen = openRowId === t.id;
                            const isManualExpense = t.group_id === null && t.category_id !== null;

                            return (
                                <React.Fragment key={t.id}>
                                    <tr
                                        className={[
                                            "border-b border-neutral-100",
                                            "hover:bg-neutral-50 cursor-pointer",
                                            isOpen ? "bg-neutral-50" : "",
                                        ].join(" ")}
                                        onClick={() => setOpenRowId((prev) => (prev === t.id ? null : t.id))}
                                    >
                                        <td className="px-3 py-2 whitespace-nowrap">{t.occurred_date_local}</td>
                                        <td className="px-3 py-2">{t.description}</td>
                                        <td className="px-3 py-2">{t.category_name ?? "—"}</td>
                                        <td className="px-3 py-2">{t.group_code ?? "—"}</td>
                                        <td className="px-3 py-2 text-right whitespace-nowrap">
                                            {formatEurFromCents(t.amount_cents, { abs: true })}
                                        </td>
                                        <td className="px-3 py-2 text-right whitespace-nowrap">
                                            {t.roundup_enabled ? (t.roundup_cents ? formatEurFromCents(t.roundup_cents) : "—") : "—"}
                                        </td>
                                        <td className="px-3 py-2 text-right">
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setOpenRowId((prev) => (prev === t.id ? null : t.id));
                                                }}
                                                className="rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs hover:bg-neutral-50"
                                            >
                                                {isOpen ? "Close" : "Edit"}
                                            </button>
                                        </td>
                                    </tr>

                                    {isOpen && (
                                        <tr className="border-b border-neutral-100">
                                            <td colSpan={7} className="px-3 py-3">
                                                {!isManualExpense ? (
                                                    <div className="text-xs text-neutral-600">
                                                        This row is not editable (system/grouped entry).
                                                    </div>
                                                ) : (
                                                    <div className="grid gap-3 md:grid-cols-2">
                                                        {/* UPDATE */}
                                                        <form action={updateExpenseAction} className="rounded-md border border-neutral-200 p-3">
                                                            <div className="text-xs font-semibold mb-2">Edit expense</div>

                                                            <input type="hidden" name="householdId" value={householdId} />
                                                            <input type="hidden" name="accountId" value={mainAccountId} />
                                                            <input type="hidden" name="entryId" value={t.id} />

                                                            <div className="grid gap-2">
                                                                <label className="grid gap-1 text-xs">
                                                                    <span className="font-medium">Date/time</span>
                                                                    <input
                                                                        name="occurredAt"
                                                                        type="datetime-local"
                                                                        required
                                                                        defaultValue={t.occurred_at_local}
                                                                        className="w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
                                                                    />
                                                                </label>

                                                                <label className="grid gap-1 text-xs">
                                                                    <span className="font-medium">Category</span>
                                                                    <select
                                                                        name="categoryId"
                                                                        required
                                                                        defaultValue={t.category_id ?? undefined}
                                                                        className="w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
                                                                    >
                                                                        {categories.map((c) => (
                                                                            <option key={c.id} value={c.id}>
                                                                                {c.name}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                </label>

                                                                <label className="grid gap-1 text-xs">
                                                                    <span className="font-medium">Amount (EUR)</span>
                                                                    <input
                                                                        name="amountEur"
                                                                        inputMode="decimal"
                                                                        required
                                                                        defaultValue={formatAbsEurForInput(t.amount_cents)}
                                                                        className="w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
                                                                    />
                                                                </label>

                                                                <label className="grid gap-1 text-xs">
                                                                    <span className="font-medium">Description</span>
                                                                    <input
                                                                        name="description"
                                                                        required
                                                                        defaultValue={t.description}
                                                                        className="w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
                                                                    />
                                                                </label>

                                                                <label className="flex items-center gap-2 text-xs">
                                                                    <input
                                                                        name="roundupEnabled"
                                                                        type="checkbox"
                                                                        defaultChecked={t.roundup_enabled}
                                                                        className="h-4 w-4"
                                                                    />
                                                                    <span className="font-medium">Roundup</span>
                                                                    <span className="text-neutral-500">(12.00 → 1.00)</span>
                                                                </label>

                                                                <button
                                                                    type="submit"
                                                                    className="w-fit rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-neutral-50"
                                                                >
                                                                    Save
                                                                </button>
                                                            </div>
                                                        </form>

                                                        {/* DELETE */}
                                                        <form action={deleteExpenseAction} className="rounded-md border border-red-200 p-3">
                                                            <div className="text-xs font-semibold mb-2">Delete</div>

                                                            <input type="hidden" name="householdId" value={householdId} />
                                                            <input type="hidden" name="accountId" value={mainAccountId} />
                                                            <input type="hidden" name="entryId" value={t.id} />

                                                            <div className="text-xs text-neutral-700">
                                                                Delete <span className="font-medium">{t.description}</span> (
                                                                {formatEurFromCents(t.amount_cents)})?
                                                            </div>

                                                            <button
                                                                type="submit"
                                                                className="mt-3 w-fit rounded-md border border-red-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-red-50"
                                                            >
                                                                Delete
                                                            </button>
                                                        </form>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        })}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}