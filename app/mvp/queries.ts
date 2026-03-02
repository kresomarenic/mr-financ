// app/mvp/queries.ts
import { pool } from "@/lib/db";

type UUID = string;
type CentsText = string;

export type OpenCycle = {
    id: UUID;
    name: string;
    start_date: string;
    end_date: string;
};

export async function getHouseholdIdForUser(userId: string): Promise<string> {
    const res = await pool.query<{ household_id: string }>(
        `SELECT household_id
         FROM household_membership
         WHERE user_id = $1
         LIMIT 1`,
        [userId]
    );
    const householdId = res.rows[0]?.household_id;
    if (!householdId) throw new Error(`No household membership for user ${userId}`);
    return householdId;
}

export async function getOpenCycle(householdId: UUID): Promise<OpenCycle | null> {
    const res = await pool.query<OpenCycle>(
        `SELECT id, name, start_date::text AS start_date, end_date::text AS end_date
         FROM cycle
         WHERE household_id = $1 AND status = 'OPEN'
         LIMIT 1`,
        [householdId]
    );
    return res.rows[0] ?? null;
}

export async function getMainAccountId(householdId: UUID): Promise<UUID> {
    const res = await pool.query<{ id: UUID }>(
        `SELECT a.id
         FROM account a
         JOIN account_type at ON at.id = a.account_type_id
         WHERE a.household_id = $1
           AND a.archived = false
           AND at.code = 'MAIN_ACCOUNT'
         LIMIT 1`,
        [householdId]
    );
    const id = res.rows[0]?.id;
    if (!id) throw new Error("No MAIN_ACCOUNT found");
    return id;
}

export type TxnRow = {
    id: UUID;
    occurred_at: string;
    occurred_at_local: string;
    occurred_date_local: string;
    description: string;
    amount_cents: CentsText;
    category_id: UUID | null;
    category_name: string | null;
    group_id: UUID | null;
    group_code: string | null;

    roundup_enabled: boolean;
    roundup_cents: CentsText | null;
};

export async function listMainAccountTxnsInCycle(
    householdId: UUID,
    cycleId: UUID,
    mainAccountId: UUID
): Promise<TxnRow[]> {
    const res = await pool.query<TxnRow>(
        `
            WITH cy AS (
                SELECT start_date, end_date
                FROM cycle
                WHERE id = $2 AND household_id = $1
            ),
                 txns AS (
                     SELECT
                         le.id,
                         le.occurred_at,
                         to_char(le.occurred_at AT TIME ZONE 'Europe/Zagreb', 'YYYY-MM-DD') AS occurred_date_local,
                         le.created_at,
                         le.description,
                         le.amount_cents,
                         le.category_id,
                         le.group_id,
                         le.roundup_enabled,
                         le.roundup_group_id,
                         c.name AS category_name,
                         g.code AS group_code
                     FROM ledger_entry le
                              LEFT JOIN category c ON c.id = le.category_id
                              LEFT JOIN ledger_entry_group g ON g.id = le.group_id
                              CROSS JOIN cy
                     WHERE le.household_id = $1
                       AND le.account_id = $3
                       AND le.occurred_at >= (cy.start_date::timestamptz)
                       AND le.occurred_at <  ((cy.end_date + 1)::timestamptz)
                 -- Hide ROUNDUP transfer-out rows from the main list (we show roundup amount on the expense row instead)
                AND COALESCE(g.code, '') <> 'ROUNDUP'
                )
            SELECT
                t.id,
                t.occurred_at::text AS occurred_at,
                to_char(t.occurred_at AT TIME ZONE 'Europe/Zagreb', 'YYYY-MM-DD"T"HH24:MI') AS occurred_at_local,
                t.occurred_date_local,
                t.description,
                t.amount_cents::text AS amount_cents,
                t.category_id,
                t.category_name,
                t.group_id,
                t.group_code,
                COALESCE(t.roundup_enabled, false) AS roundup_enabled,

                -- set-based: join the roundup OUT row (main account) once and aggregate
                CASE
                    WHEN COALESCE(t.roundup_enabled, false) = true AND t.roundup_group_id IS NOT NULL
                        THEN MAX(ABS(le_ru.amount_cents))::text
                    ELSE NULL
                    END AS roundup_cents
            FROM txns t
                     LEFT JOIN ledger_entry le_ru
                               ON le_ru.household_id = $1
                                   AND le_ru.group_id = t.roundup_group_id
                                   AND le_ru.account_id = $3
                                   AND le_ru.category_id IS NULL
            GROUP BY
                t.id,
                t.occurred_at,
                t.created_at,
                t.occurred_date_local,
                t.description,
                t.amount_cents,
                t.category_id,
                t.category_name,
                t.group_id,
                t.group_code,
                t.roundup_enabled,
                t.roundup_group_id
            ORDER BY t.occurred_at DESC, t.created_at DESC
        `,
        [householdId, cycleId, mainAccountId]
    );
    return res.rows;
}

export type TotalsRow = {
    planned_total_cents: CentsText;
    actual_total_cents: CentsText;
    variance_total_cents: CentsText;
};

export async function getPlannedVsActualExpenseTotals(
    householdId: UUID,
    cycleId: UUID,
    mainAccountId: UUID
): Promise<TotalsRow> {
    const res = await pool.query<TotalsRow>(
        `
            WITH cy AS (
                SELECT start_date, end_date
                FROM cycle
                WHERE id = $2 AND household_id = $1
            ),
            planned AS (
                SELECT COALESCE(SUM(pi.planned_cents), 0)::bigint AS planned_total_cents
                FROM planning_item pi
                JOIN category c ON c.id = pi.category_id
                JOIN category_kind ck ON ck.id = c.category_kind_id
                WHERE pi.household_id = $1
                  AND pi.cycle_id = $2
                  AND ck.code = 'EXPENSE'
            ),
            actual AS (
                SELECT COALESCE(SUM(le.amount_cents), 0)::bigint AS actual_total_cents
                FROM ledger_entry le
                JOIN category c ON c.id = le.category_id
                JOIN category_kind ck ON ck.id = c.category_kind_id
                CROSS JOIN cy
                WHERE le.household_id = $1
                  AND le.account_id = $3
                  AND le.category_id IS NOT NULL
                  AND ck.code = 'EXPENSE'
                  AND le.group_id IS NULL
                  AND le.occurred_at >= (cy.start_date::timestamptz)
                  AND le.occurred_at <  ((cy.end_date + 1)::timestamptz)
            )
            SELECT
                planned.planned_total_cents::text AS planned_total_cents,
                actual.actual_total_cents::text AS actual_total_cents,
                (planned.planned_total_cents - ABS(actual.actual_total_cents))::text AS variance_total_cents
            FROM planned, actual
        `,
        [householdId, cycleId, mainAccountId]
    );

    return (
        res.rows[0] ?? {
            planned_total_cents: "0",
            actual_total_cents: "0",
            variance_total_cents: "0",
        }
    );
}

export type CategoryRow = { id: UUID; name: string };

export async function listExpenseCategories(householdId: UUID): Promise<CategoryRow[]> {
    const res = await pool.query<CategoryRow>(
        `
            SELECT c.id, c.name
            FROM category c
            JOIN category_kind ck ON ck.id = c.category_kind_id
            WHERE c.household_id = $1
              AND c.archived = false
              AND ck.code = 'EXPENSE'
            ORDER BY c.name
        `,
        [householdId]
    );
    return res.rows;
}

export type CategorySummaryRow = {
    category_id: UUID;
    category_name: string;
    planned_cents: CentsText;
    actual_cents: CentsText;
    variance_cents: CentsText;
};

export async function getExpenseCategorySummary(
    householdId: UUID,
    cycleId: UUID,
    mainAccountId: UUID
): Promise<CategorySummaryRow[]> {
    const res = await pool.query<CategorySummaryRow>(
        `
            WITH cy AS (
                SELECT start_date, end_date
                FROM cycle
                WHERE id = $2 AND household_id = $1
            ),
            plan AS (
                SELECT
                    pi.category_id,
                    SUM(pi.planned_cents)::bigint AS planned_cents
                FROM planning_item pi
                WHERE pi.household_id = $1
                  AND pi.cycle_id = $2
                GROUP BY pi.category_id
            ),
            actual AS (
                SELECT
                    le.category_id,
                    SUM(le.amount_cents)::bigint AS actual_cents
                FROM ledger_entry le
                CROSS JOIN cy
                WHERE le.household_id = $1
                  AND le.account_id = $3
                  AND le.category_id IS NOT NULL
                  AND le.group_id IS NULL
                  AND le.occurred_at >= (cy.start_date::timestamptz)
                  AND le.occurred_at <  ((cy.end_date + 1)::timestamptz)
                GROUP BY le.category_id
            )
            SELECT
                c.id AS category_id,
                c.name AS category_name,
                COALESCE(plan.planned_cents, 0)::text AS planned_cents,
                COALESCE(actual.actual_cents, 0)::text AS actual_cents,
                (
                    COALESCE(plan.planned_cents, 0)
                        - ABS(COALESCE(actual.actual_cents, 0))
                    )::text AS variance_cents
            FROM category c
            JOIN category_kind ck ON ck.id = c.category_kind_id
            LEFT JOIN plan ON plan.category_id = c.id
            LEFT JOIN actual ON actual.category_id = c.id
            WHERE c.household_id = $1
              AND c.archived = false
              AND ck.code = 'EXPENSE'
            ORDER BY c.name
        `,
        [householdId, cycleId, mainAccountId]
    );

    return res.rows;
}