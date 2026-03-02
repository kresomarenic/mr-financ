// app/mvp/page.tsx
import { MvpClient } from "./MvpClient";
import {formatEurFromCents} from "@/lib/domain/money";
import {
    getExpenseCategorySummary,
    getMainAccountId,
    getHouseholdIdForUser,
    getOpenCycle,
    getPlannedVsActualExpenseTotals, listExpenseCategories,
    listMainAccountTxnsInCycle
} from "@/app/mvp/queries";
import {redirect} from "next/navigation";
import {getCurrentUserId} from "@/lib/auth/session";

export default async function MvpPage() {
    const userId = await getCurrentUserId();
    if (!userId) redirect("/login");

    const householdId = await getHouseholdIdForUser(userId);
    const cycle = await getOpenCycle(householdId);

    if (!cycle) {
        return (
            <main className="p-6">
                <h1 className="text-2xl font-semibold">MVP</h1>
                <p className="mt-2 text-sm text-neutral-600">No OPEN cycle found.</p>
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
        <main className="p-6 space-y-6">
            <header className="space-y-1">
                <h1 className="text-2xl font-semibold">MVP Cycle</h1>
                <div className="text-sm text-neutral-700">
                    <span className="font-medium">Open cycle:</span> {cycle.name}
                </div>
                <div className="text-sm text-neutral-700">
                    {cycle.start_date} → {cycle.end_date}
                </div>
            </header>

            <section className="rounded-lg border border-neutral-200 p-4 space-y-1">
                <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Planned (expenses)</span>
                    <span>{formatEurFromCents(totals.planned_total_cents)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Actual (expenses)</span>
                    <span>{formatEurFromCents(totals.actual_total_cents, { abs: true })}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Variance</span>
                    <span>{formatEurFromCents(totals.variance_total_cents)}</span>
                </div>
            </section>

            <section className="space-y-3">
                <h2 className="text-lg font-semibold">Planned vs actual (by category)</h2>

                <div className="overflow-x-auto rounded-lg border border-neutral-200">
                    <table className="w-full border-collapse text-sm">
                        <thead className="bg-neutral-50">
                        <tr>
                            <th className="text-left font-medium px-3 py-2 border-b border-neutral-200">Category</th>
                            <th className="text-right font-medium px-3 py-2 border-b border-neutral-200">Planned</th>
                            <th className="text-right font-medium px-3 py-2 border-b border-neutral-200">Actual</th>
                            <th className="text-right font-medium px-3 py-2 border-b border-neutral-200">Variance</th>
                        </tr>
                        </thead>
                        <tbody>
                        {categorySummary.map((r) => (
                            <tr key={r.category_id} className="border-b border-neutral-100 last:border-b-0">
                                <td className="px-3 py-2">{r.category_name}</td>
                                <td className="px-3 py-2 text-right">{formatEurFromCents(r.planned_cents)}</td>
                                <td className="px-3 py-2 text-right">{formatEurFromCents(r.actual_cents, { abs: true })}</td>
                                <td className="px-3 py-2 text-right">{formatEurFromCents(r.variance_cents)}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <MvpClient householdId={householdId} mainAccountId={mainAccountId} categories={categories} txns={txns} />
        </main>
    );
}