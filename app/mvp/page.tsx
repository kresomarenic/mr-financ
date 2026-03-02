// app/mvp/page.tsx
import { MvpClient } from "./MvpClient";
import { formatEurFromCents } from "@/lib/domain/money";
import {
    getExpenseCategorySummary,
    getMainAccountId,
    getHouseholdIdForUser,
    getOpenCycle,
    getPlannedVsActualExpenseTotals,
    listExpenseCategories,
    listMainAccountTxnsInCycle,
} from "@/app/mvp/queries";
import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/auth/session";

export default async function MvpPage() {
    const userId = await getCurrentUserId();
    if (!userId) redirect("/login");

    const householdId = await getHouseholdIdForUser(userId);
    const cycle = await getOpenCycle(householdId);

    if (!cycle) {
        return (
            <main className="space-y-3 p-4 md:p-6">
                <h1 className="text-xl md:text-2xl font-semibold tracking-tight">MVP</h1>
                <p className="text-sm text-foreground/70">No OPEN cycle found.</p>
            </main>
        );
    }

    const mainAccountId = await getMainAccountId(householdId);

    const [txns, totals, categories, categorySummary] = await Promise.all([
        listMainAccountTxnsInCycle(householdId, cycle.id, mainAccountId),
        getPlannedVsActualExpenseTotals(householdId, cycle.id, mainAccountId),
        listExpenseCategories(householdId),
        getExpenseCategorySummary(householdId, cycle.id, mainAccountId),
    ]);

    return (
        <main className="space-y-4 md:space-y-6 p-4 md:p-6">
            {/* Page header */}
            <header className="space-y-2">
                <div className="flex flex-col gap-1">
                    <h1 className="text-xl md:text-2xl font-semibold tracking-tight">
                        MVP Cycle
                    </h1>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3 text-sm text-foreground/70">
                        <div>
                            <span className="font-medium text-foreground/90">Open cycle:</span>{" "}
                            {cycle.name}
                        </div>
                        <span className="hidden sm:inline text-foreground/40">•</span>
                        <div className="text-foreground/70">
                            {cycle.start_date} → {cycle.end_date}
                        </div>
                    </div>
                </div>
            </header>

            {/* Totals card */}
            <section className="rounded-xl border border-border bg-background p-4 md:p-5">
                <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-lg bg-muted p-3">
                        <div className="text-xs font-semibold uppercase tracking-widest text-foreground/60">
                            Planned
                        </div>
                        <div className="mt-1 text-lg font-semibold">
                            {formatEurFromCents(totals.planned_total_cents)}
                        </div>
                    </div>

                    <div className="rounded-lg bg-muted p-3">
                        <div className="text-xs font-semibold uppercase tracking-widest text-foreground/60">
                            Actual
                        </div>
                        <div className="mt-1 text-lg font-semibold">
                            {formatEurFromCents(totals.actual_total_cents, { abs: true })}
                        </div>
                    </div>

                    <div className="rounded-lg bg-muted p-3">
                        <div className="text-xs font-semibold uppercase tracking-widest text-foreground/60">
                            Variance
                        </div>
                        <div className="mt-1 text-lg font-semibold">
                            {formatEurFromCents(totals.variance_total_cents)}
                        </div>
                    </div>
                </div>
            </section>

            {/* Planned vs actual by category */}
            <section className="space-y-3">
                <div className="flex items-baseline justify-between gap-3">
                    <h2 className="text-base md:text-lg font-semibold tracking-tight">
                        Planned vs actual by category
                    </h2>
                    <div className="text-xs text-foreground/60">
                        {categorySummary.length} categories
                    </div>
                </div>

                {/* Mobile: cards */}
                <div className="grid gap-3 md:hidden">
                    {categorySummary.map((r) => (
                        <div
                            key={r.category_id}
                            className="rounded-xl border border-border bg-background p-4"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="font-medium truncate">{r.category_name}</div>
                                    <div className="mt-1 text-xs text-foreground/60">
                                        Planned vs actual
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-foreground/60">Variance</div>
                                    <div className="font-semibold">
                                        {formatEurFromCents(r.variance_cents)}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-3 grid grid-cols-2 gap-2">
                                <div className="rounded-lg bg-muted p-2">
                                    <div className="text-[11px] uppercase tracking-widest text-foreground/60">
                                        Planned
                                    </div>
                                    <div className="mt-1 text-sm font-semibold">
                                        {formatEurFromCents(r.planned_cents)}
                                    </div>
                                </div>
                                <div className="rounded-lg bg-muted p-2">
                                    <div className="text-[11px] uppercase tracking-widest text-foreground/60">
                                        Actual
                                    </div>
                                    <div className="mt-1 text-sm font-semibold">
                                        {formatEurFromCents(r.actual_cents, { abs: true })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Desktop/tablet: table */}
                <div className="hidden md:block overflow-x-auto rounded-xl border border-border bg-background">
                    <table className="w-full border-collapse text-sm">
                        <thead className="bg-muted">
                        <tr>
                            <th className="text-left font-semibold px-4 py-3 border-b border-border">
                                Category
                            </th>
                            <th className="text-right font-semibold px-4 py-3 border-b border-border">
                                Planned
                            </th>
                            <th className="text-right font-semibold px-4 py-3 border-b border-border">
                                Actual
                            </th>
                            <th className="text-right font-semibold px-4 py-3 border-b border-border">
                                Variance
                            </th>
                        </tr>
                        </thead>
                        <tbody>
                        {categorySummary.map((r) => (
                            <tr
                                key={r.category_id}
                                className="border-b border-border/60 last:border-b-0 hover:bg-muted/70"
                            >
                                <td className="px-4 py-3">{r.category_name}</td>
                                <td className="px-4 py-3 text-right">
                                    {formatEurFromCents(r.planned_cents)}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    {formatEurFromCents(r.actual_cents, { abs: true })}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    {formatEurFromCents(r.variance_cents)}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <MvpClient
                householdId={householdId}
                mainAccountId={mainAccountId}
                categories={categories}
                txns={txns}
            />
        </main>
    );
}