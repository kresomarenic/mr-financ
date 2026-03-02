// app/mvp/MvpClient.tsx
"use client";

import * as React from "react";
import { addExpenseAction, deleteExpenseAction, updateExpenseAction } from "./actions";
import { formatAbsEurForInput, formatEurFromCents } from "@/lib/domain/money";
import { CategoryRow, TxnRow } from "@/app/mvp/queries";

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

    const openTxn = txns.find((t) => t.id === openRowId) ?? null;

    return (
        <div className="space-y-4 md:space-y-6">
            {/* Add expense */}
            <section className="rounded-xl border border-border bg-background p-4">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h2 className="text-sm font-semibold tracking-tight">Expenses</h2>
                        <p className="text-xs text-foreground/60">
                            Add a manual expense into the main account.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => setShowAddExpense((v) => !v)}
                        className="rounded-md border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-muted"
                    >
                        {showAddExpense ? "Close" : "+ Add"}
                    </button>
                </div>

                {showAddExpense && (
                    <form action={addExpenseAction} className="mt-4 grid gap-3">
                        <input type="hidden" name="householdId" value={householdId} />
                        <input type="hidden" name="accountId" value={mainAccountId} />

                        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                            <label className="grid gap-1 text-xs">
                                <span className="font-semibold text-foreground/80">Date/time</span>
                                <input
                                    name="occurredAt"
                                    type="datetime-local"
                                    required
                                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                />
                            </label>

                            <label className="grid gap-1 text-xs">
                                <span className="font-semibold text-foreground/80">Category</span>
                                <select
                                    name="categoryId"
                                    required
                                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                >
                                    {categories.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label className="grid gap-1 text-xs">
                                <span className="font-semibold text-foreground/80">Amount (EUR)</span>
                                <input
                                    name="amountEur"
                                    inputMode="decimal"
                                    placeholder="12.34"
                                    required
                                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                />
                            </label>
                        </div>

                        <label className="grid gap-1 text-xs">
                            <span className="font-semibold text-foreground/80">Description</span>
                            <input
                                name="description"
                                required
                                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                            />
                        </label>

                        <label className="flex items-center gap-2 text-xs">
                            <input name="roundupEnabled" type="checkbox" className="h-4 w-4" />
                            <span className="font-semibold text-foreground/80">Roundup</span>
                            <span className="text-foreground/60">(e.g. 12.00 → 1.00)</span>
                        </label>

                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            <button
                                type="submit"
                                className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
                            >
                                Add expense
                            </button>
                            <div className="text-xs text-foreground/60">
                                Tip: tap a transaction below to edit a manual entry.
                            </div>
                        </div>
                    </form>
                )}
            </section>

            {/* Transactions */}
            <section className="space-y-3">
                <div className="flex items-baseline justify-between gap-3">
                    <h2 className="text-base md:text-lg font-semibold tracking-tight">
                        Main account transactions
                    </h2>
                    <div className="text-xs text-foreground/60">{txns.length} items</div>
                </div>

                {/* Mobile: cards list */}
                <div className="grid gap-3 md:hidden">
                    {txns.map((t) => {
                        const isOpen = openRowId === t.id;
                        const isManualExpense = t.group_id === null && t.category_id !== null;

                        return (
                            <div
                                key={t.id}
                                className="rounded-xl border border-border bg-background"
                            >
                                <button
                                    type="button"
                                    onClick={() => setOpenRowId((prev) => (prev === t.id ? null : t.id))}
                                    className="w-full text-left p-4 hover:bg-muted/60"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="text-xs text-foreground/60">
                                                {t.occurred_date_local}
                                            </div>
                                            <div className="mt-1 font-semibold truncate">{t.description}</div>
                                            <div className="mt-1 text-xs text-foreground/60">
                                                {t.category_name ?? "—"} · {t.group_code ?? "—"}
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <div className="text-xs text-foreground/60">Amount</div>
                                            <div className="font-semibold whitespace-nowrap">
                                                {formatEurFromCents(t.amount_cents, { abs: true })}
                                            </div>
                                            <div className="mt-1 text-xs text-foreground/60">
                                                Roundup:{" "}
                                                {t.roundup_enabled
                                                    ? t.roundup_cents
                                                        ? formatEurFromCents(t.roundup_cents)
                                                        : "—"
                                                    : "—"}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-3 flex items-center justify-between">
                                        <div className="text-xs text-foreground/60">
                                            {isManualExpense ? "Manual expense" : "System / grouped"}
                                        </div>
                                        <span className="text-xs font-semibold text-emerald-700">
                      {isOpen ? "Close" : "Edit"}
                    </span>
                                    </div>
                                </button>

                                {isOpen && (
                                    <div className="border-t border-border p-4">
                                        {!isManualExpense ? (
                                            <div className="text-sm text-foreground/70">
                                                This row is not editable (system/grouped entry).
                                            </div>
                                        ) : (
                                            <div className="grid gap-4">
                                                {/* UPDATE */}
                                                <form
                                                    action={updateExpenseAction}
                                                    className="rounded-lg border border-border bg-muted/40 p-3"
                                                >
                                                    <div className="text-xs font-semibold mb-2">
                                                        Edit expense
                                                    </div>

                                                    <input type="hidden" name="householdId" value={householdId} />
                                                    <input type="hidden" name="accountId" value={mainAccountId} />
                                                    <input type="hidden" name="entryId" value={t.id} />

                                                    <div className="grid gap-3">
                                                        <label className="grid gap-1 text-xs">
                                                            <span className="font-semibold text-foreground/80">Date/time</span>
                                                            <input
                                                                name="occurredAt"
                                                                type="datetime-local"
                                                                required
                                                                defaultValue={t.occurred_at_local}
                                                                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                                            />
                                                        </label>

                                                        <label className="grid gap-1 text-xs">
                                                            <span className="font-semibold text-foreground/80">Category</span>
                                                            <select
                                                                name="categoryId"
                                                                required
                                                                defaultValue={t.category_id ?? undefined}
                                                                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                                            >
                                                                {categories.map((c) => (
                                                                    <option key={c.id} value={c.id}>
                                                                        {c.name}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </label>

                                                        <label className="grid gap-1 text-xs">
                                                            <span className="font-semibold text-foreground/80">Amount (EUR)</span>
                                                            <input
                                                                name="amountEur"
                                                                inputMode="decimal"
                                                                required
                                                                defaultValue={formatAbsEurForInput(t.amount_cents)}
                                                                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                                            />
                                                        </label>

                                                        <label className="grid gap-1 text-xs">
                                                            <span className="font-semibold text-foreground/80">Description</span>
                                                            <input
                                                                name="description"
                                                                required
                                                                defaultValue={t.description}
                                                                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                                            />
                                                        </label>

                                                        <label className="flex items-center gap-2 text-xs">
                                                            <input
                                                                name="roundupEnabled"
                                                                type="checkbox"
                                                                defaultChecked={t.roundup_enabled}
                                                                className="h-4 w-4"
                                                            />
                                                            <span className="font-semibold text-foreground/80">Roundup</span>
                                                        </label>

                                                        <button
                                                            type="submit"
                                                            className="w-full rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
                                                        >
                                                            Save
                                                        </button>
                                                    </div>
                                                </form>

                                                {/* DELETE */}
                                                <form
                                                    action={deleteExpenseAction}
                                                    className="rounded-lg border border-red-300 bg-background p-3"
                                                >
                                                    <div className="text-xs font-semibold mb-2 text-red-700">
                                                        Delete
                                                    </div>

                                                    <input type="hidden" name="householdId" value={householdId} />
                                                    <input type="hidden" name="accountId" value={mainAccountId} />
                                                    <input type="hidden" name="entryId" value={t.id} />

                                                    <div className="text-sm text-foreground/80">
                                                        Delete <span className="font-semibold">{t.description}</span>{" "}
                                                        ({formatEurFromCents(t.amount_cents)})?
                                                    </div>

                                                    <button
                                                        type="submit"
                                                        className="mt-3 w-full rounded-md border border-red-400 bg-background px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                                                    >
                                                        Delete
                                                    </button>
                                                </form>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Desktop/tablet: table (your original style, tokenized) */}
                <div className="hidden md:block overflow-x-auto rounded-xl border border-border bg-background">
                    <table className="w-full border-collapse text-sm">
                        <thead className="bg-muted">
                        <tr>
                            <th className="text-left font-semibold px-4 py-3 border-b border-border">Date</th>
                            <th className="text-left font-semibold px-4 py-3 border-b border-border">Desc</th>
                            <th className="text-left font-semibold px-4 py-3 border-b border-border">Category</th>
                            <th className="text-left font-semibold px-4 py-3 border-b border-border">Group</th>
                            <th className="text-right font-semibold px-4 py-3 border-b border-border">Amount</th>
                            <th className="text-right font-semibold px-4 py-3 border-b border-border">Roundup</th>
                            <th className="text-right font-semibold px-4 py-3 border-b border-border">Edit</th>
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
                                            "border-b border-border/60",
                                            "hover:bg-muted/70 cursor-pointer",
                                            isOpen ? "bg-muted/60" : "",
                                        ].join(" ")}
                                        onClick={() => setOpenRowId((prev) => (prev === t.id ? null : t.id))}
                                    >
                                        <td className="px-4 py-3 whitespace-nowrap">{t.occurred_date_local}</td>
                                        <td className="px-4 py-3">{t.description}</td>
                                        <td className="px-4 py-3">{t.category_name ?? "—"}</td>
                                        <td className="px-4 py-3">{t.group_code ?? "—"}</td>
                                        <td className="px-4 py-3 text-right whitespace-nowrap">
                                            {formatEurFromCents(t.amount_cents, { abs: true })}
                                        </td>
                                        <td className="px-4 py-3 text-right whitespace-nowrap">
                                            {t.roundup_enabled
                                                ? t.roundup_cents
                                                    ? formatEurFromCents(t.roundup_cents)
                                                    : "—"
                                                : "—"}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setOpenRowId((prev) => (prev === t.id ? null : t.id));
                                                }}
                                                className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-semibold hover:bg-muted"
                                            >
                                                {isOpen ? "Close" : "Edit"}
                                            </button>
                                        </td>
                                    </tr>

                                    {isOpen && (
                                        <tr className="border-b border-border/60">
                                            <td colSpan={7} className="px-4 py-4">
                                                {!isManualExpense ? (
                                                    <div className="text-sm text-foreground/70">
                                                        This row is not editable (system/grouped entry).
                                                    </div>
                                                ) : (
                                                    <div className="grid gap-4 md:grid-cols-2">
                                                        {/* UPDATE */}
                                                        <form
                                                            action={updateExpenseAction}
                                                            className="rounded-xl border border-border bg-muted/40 p-4"
                                                        >
                                                            <div className="text-sm font-semibold mb-3">Edit expense</div>

                                                            <input type="hidden" name="householdId" value={householdId} />
                                                            <input type="hidden" name="accountId" value={mainAccountId} />
                                                            <input type="hidden" name="entryId" value={t.id} />

                                                            <div className="grid gap-3">
                                                                <label className="grid gap-1 text-xs">
                                                                    <span className="font-semibold text-foreground/80">Date/time</span>
                                                                    <input
                                                                        name="occurredAt"
                                                                        type="datetime-local"
                                                                        required
                                                                        defaultValue={t.occurred_at_local}
                                                                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                                                    />
                                                                </label>

                                                                <label className="grid gap-1 text-xs">
                                                                    <span className="font-semibold text-foreground/80">Category</span>
                                                                    <select
                                                                        name="categoryId"
                                                                        required
                                                                        defaultValue={t.category_id ?? undefined}
                                                                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                                                    >
                                                                        {categories.map((c) => (
                                                                            <option key={c.id} value={c.id}>
                                                                                {c.name}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                </label>

                                                                <label className="grid gap-1 text-xs">
                                                                    <span className="font-semibold text-foreground/80">Amount (EUR)</span>
                                                                    <input
                                                                        name="amountEur"
                                                                        inputMode="decimal"
                                                                        required
                                                                        defaultValue={formatAbsEurForInput(t.amount_cents)}
                                                                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                                                    />
                                                                </label>

                                                                <label className="grid gap-1 text-xs">
                                                                    <span className="font-semibold text-foreground/80">Description</span>
                                                                    <input
                                                                        name="description"
                                                                        required
                                                                        defaultValue={t.description}
                                                                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                                                    />
                                                                </label>

                                                                <label className="flex items-center gap-2 text-xs">
                                                                    <input
                                                                        name="roundupEnabled"
                                                                        type="checkbox"
                                                                        defaultChecked={t.roundup_enabled}
                                                                        className="h-4 w-4"
                                                                    />
                                                                    <span className="font-semibold text-foreground/80">Roundup</span>
                                                                </label>

                                                                <button
                                                                    type="submit"
                                                                    className="w-fit rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
                                                                >
                                                                    Save
                                                                </button>
                                                            </div>
                                                        </form>

                                                        {/* DELETE */}
                                                        <form
                                                            action={deleteExpenseAction}
                                                            className="rounded-xl border border-red-300 bg-background p-4"
                                                        >
                                                            <div className="text-sm font-semibold mb-3 text-red-700">
                                                                Delete
                                                            </div>

                                                            <input type="hidden" name="householdId" value={householdId} />
                                                            <input type="hidden" name="accountId" value={mainAccountId} />
                                                            <input type="hidden" name="entryId" value={t.id} />

                                                            <div className="text-sm text-foreground/80">
                                                                Delete <span className="font-semibold">{t.description}</span>{" "}
                                                                ({formatEurFromCents(t.amount_cents)})?
                                                            </div>

                                                            <button
                                                                type="submit"
                                                                className="mt-3 w-fit rounded-md border border-red-400 bg-background px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
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