// app/mvp/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import type { PoolClient } from "pg";
import { withTx } from "@/lib/db/tx";
import {mustNonEmptyString, mustUuid} from "@/lib/domain/validate";

function parseEurToAbsCents(amountEurRaw: unknown): bigint {
    const amountEur = String(amountEurRaw ?? "").trim();
    if (!amountEur) throw new Error("amountEur is required");

    const normalized = amountEur.replace(",", ".");
    if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
        throw new Error("amountEur must be a number like 12.34");
    }

    const [eurosStr, centsStr = ""] = normalized.split(".");
    const cents2 = (centsStr + "00").slice(0, 2);
    return BigInt(eurosStr) * 100n + BigInt(cents2);
}

// Rule you specified:
// 1.70 -> 0.30
// 12.00 -> 1.00 (if enabled)
function computeRoundupCents(absExpenseCents: bigint): bigint {
    const rem = absExpenseCents % 100n;
    return 100n - rem; // rem==0 => 100
}

async function assertExpenseCategoryInHousehold(client: PoolClient, categoryId: string, householdId: string) {
    const catCheck = await client.query<{ ok: boolean }>(
        `
            SELECT true as ok
            FROM category c
                     JOIN category_kind ck ON ck.id = c.category_kind_id
            WHERE c.id = $1 AND c.household_id = $2 AND ck.code = 'EXPENSE'
                LIMIT 1
        `,
        [categoryId, householdId]
    );
    if (!catCheck.rows[0]?.ok) throw new Error("Invalid category");
}

async function getSavingsAccountIdOrThrow(client: PoolClient, householdId: string): Promise<string> {
    const res = await client.query<{ id: string }>(
        `
            SELECT id
            FROM account
            WHERE household_id = $1
              AND archived = false
              AND name = 'E-kasica'
                LIMIT 1
        `,
        [householdId]
    );
    const id = res.rows[0]?.id;
    if (!id) throw new Error("No savings account 'E-kasica' found");
    return id;
}

async function reconcileRoundupForExpense(params: {
    client: PoolClient;
    householdId: string;
    mainAccountId: string;
    expenseEntryId: string;
    occurredAt: string;
    absExpenseCents: bigint;
    roundupEnabled: boolean;
}) {
    const { client, householdId, mainAccountId, expenseEntryId, occurredAt, absExpenseCents, roundupEnabled } = params;

    // Fetch existing roundup group id (if any)
    const exp = await client.query<{ roundup_group_id: string | null }>(
        `
            SELECT roundup_group_id
            FROM ledger_entry
            WHERE id = $1 AND household_id = $2
                LIMIT 1
        `,
        [expenseEntryId, householdId]
    );
    const existingGroupId = exp.rows[0]?.roundup_group_id ?? null;

    if (!roundupEnabled) {
        if (existingGroupId) {
            await client.query(`DELETE FROM ledger_entry WHERE household_id = $1 AND group_id = $2`, [
                householdId,
                existingGroupId,
            ]);
            await client.query(
                `DELETE FROM ledger_entry_group WHERE household_id = $1 AND id = $2 AND code = 'ROUNDUP'`,
                [householdId, existingGroupId]
            );
        }
        await client.query(
            `
                UPDATE ledger_entry
                SET roundup_enabled = false,
                    roundup_group_id = NULL
                WHERE id = $1 AND household_id = $2
            `,
            [expenseEntryId, householdId]
        );
        return;
    }

    const roundupCents = computeRoundupCents(absExpenseCents);
    if (roundupCents <= 0n) {
        // defensive fallback
        if (existingGroupId) {
            await client.query(`DELETE FROM ledger_entry WHERE household_id = $1 AND group_id = $2`, [
                householdId,
                existingGroupId,
            ]);
            await client.query(
                `DELETE FROM ledger_entry_group WHERE household_id = $1 AND id = $2 AND code = 'ROUNDUP'`,
                [householdId, existingGroupId]
            );
        }
        await client.query(
            `
                UPDATE ledger_entry
                SET roundup_enabled = true,
                    roundup_group_id = NULL
                WHERE id = $1 AND household_id = $2
            `,
            [expenseEntryId, householdId]
        );
        return;
    }

    const savingsAccountId = await getSavingsAccountIdOrThrow(client, householdId);

    if (!existingGroupId) {
        // Create group + 2 entries
        const g = await client.query<{ id: string }>(
            `
                INSERT INTO ledger_entry_group (household_id, code, description, occurred_at)
                VALUES ($1, 'ROUNDUP', 'Roundup transfer', ($2::timestamp AT TIME ZONE 'Europe/Zagreb'))
                    RETURNING id
            `,
            [householdId, occurredAt]
        );
        const groupId = g.rows[0]?.id;
        if (!groupId) throw new Error("Failed to create roundup group");

        await client.query(
            `
                INSERT INTO ledger_entry (household_id, account_id, amount_cents, occurred_at, description, category_id, group_id)
                VALUES ($1, $2, $3::bigint, ($4::timestamp AT TIME ZONE 'Europe/Zagreb'), 'Roundup out', NULL, $5)
            `,
            [householdId, mainAccountId, (-roundupCents).toString(), occurredAt, groupId]
        );

        await client.query(
            `
                INSERT INTO ledger_entry (household_id, account_id, amount_cents, occurred_at, description, category_id, group_id)
                VALUES ($1, $2, $3::bigint, ($4::timestamp AT TIME ZONE 'Europe/Zagreb'), 'Roundup in', NULL, $5)
            `,
            [householdId, savingsAccountId, roundupCents.toString(), occurredAt, groupId]
        );

        await client.query(
            `
                UPDATE ledger_entry
                SET roundup_enabled = true,
                    roundup_group_id = $3
                WHERE id = $1 AND household_id = $2
            `,
            [expenseEntryId, householdId, groupId]
        );

        return;
    }

    // Update group header
    await client.query(
        `
            UPDATE ledger_entry_group
            SET occurred_at = ($3::timestamp AT TIME ZONE 'Europe/Zagreb')
            WHERE household_id = $1
              AND id = $2
              AND code = 'ROUNDUP'
        `,
        [householdId, existingGroupId, occurredAt]
    );

    // Update OUT entry (main account)
    const outRes = await client.query<{ id: string }>(
        `
            SELECT id
            FROM ledger_entry
            WHERE household_id = $1
              AND group_id = $2
              AND account_id = $3
              AND category_id IS NULL
                LIMIT 1
        `,
        [householdId, existingGroupId, mainAccountId]
    );
    const outId = outRes.rows[0]?.id;
    if (!outId) throw new Error("Roundup OUT entry missing");

    await client.query(
        `
            UPDATE ledger_entry
            SET occurred_at = ($3::timestamp AT TIME ZONE 'Europe/Zagreb'),
                amount_cents = $4::bigint
            WHERE household_id = $1 AND id = $2
        `,
        [householdId, outId, occurredAt, (-roundupCents).toString()]
    );

    // Update IN entry (savings)
    const inRes = await client.query<{ id: string }>(
        `
            SELECT id
            FROM ledger_entry
            WHERE household_id = $1
              AND group_id = $2
              AND account_id = $3
              AND category_id IS NULL
                LIMIT 1
        `,
        [householdId, existingGroupId, savingsAccountId]
    );
    const inId = inRes.rows[0]?.id;
    if (!inId) throw new Error("Roundup IN entry missing");

    await client.query(
        `
            UPDATE ledger_entry
            SET occurred_at = ($3::timestamp AT TIME ZONE 'Europe/Zagreb'),
                amount_cents = $4::bigint
            WHERE household_id = $1 AND id = $2
        `,
        [householdId, inId, occurredAt, roundupCents.toString()]
    );

    await client.query(
        `
            UPDATE ledger_entry
            SET roundup_enabled = true,
                roundup_group_id = $3
            WHERE id = $1 AND household_id = $2
        `,
        [expenseEntryId, householdId, existingGroupId]
    );
}

export async function addExpenseAction(formData: FormData) {
    const householdId = mustUuid(formData.get("householdId"), "householdId");
    const accountId = mustUuid(formData.get("accountId"), "accountId"); // main
    const categoryId = mustUuid(formData.get("categoryId"), "categoryId");

    const description = mustNonEmptyString(formData.get("description"), "description");
    const occurredAt = mustNonEmptyString(formData.get("occurredAt"), "occurredAt");

    const absCents = parseEurToAbsCents(formData.get("amountEur"));
    if (absCents <= 0n) throw new Error("amountEur must be > 0");

    const amountCents = (-absCents).toString();
    const roundupEnabled = formData.get("roundupEnabled") === "on";

    await withTx(async (client) => {
        await assertExpenseCategoryInHousehold(client, categoryId, householdId);

        const ins = await client.query<{ id: string }>(
            `
                INSERT INTO ledger_entry (
                    household_id, account_id, amount_cents, occurred_at, description, category_id, group_id,
                    roundup_enabled, roundup_group_id
                )
                VALUES ($1, $2, $3::bigint, ($4::timestamp AT TIME ZONE 'Europe/Zagreb'), $5, $6, NULL, false, NULL)
                RETURNING id
            `,
            [householdId, accountId, amountCents, occurredAt, description, categoryId]
        );

        const expenseEntryId = ins.rows[0]?.id;
        if (!expenseEntryId) throw new Error("Failed to insert expense");

        await reconcileRoundupForExpense({
            client,
            householdId,
            mainAccountId: accountId,
            expenseEntryId,
            occurredAt,
            absExpenseCents: absCents,
            roundupEnabled,
        });
    });

    revalidatePath("/mvp");
}

export async function updateExpenseAction(formData: FormData) {
    const householdId = mustUuid(formData.get("householdId"), "householdId");
    const accountId = mustUuid(formData.get("accountId"), "accountId"); // main
    const entryId = mustUuid(formData.get("entryId"), "entryId");
    const categoryId = mustUuid(formData.get("categoryId"), "categoryId");

    const description = mustNonEmptyString(formData.get("description"), "description");
    const occurredAt = mustNonEmptyString(formData.get("occurredAt"), "occurredAt");

    const absCents = parseEurToAbsCents(formData.get("amountEur"));
    if (absCents <= 0n) throw new Error("amountEur must be > 0");

    const amountCents = (-absCents).toString();
    const roundupEnabled = formData.get("roundupEnabled") === "on";

    await withTx(async (client) => {
        await assertExpenseCategoryInHousehold(client, categoryId, householdId);

        const res = await client.query(
            `
                UPDATE ledger_entry
                SET
                    amount_cents = $4::bigint,
                    occurred_at  = ($5::timestamp AT TIME ZONE 'Europe/Zagreb'),
                    description  = $6,
                    category_id  = $7
                WHERE id = $3
                  AND household_id = $1
                  AND account_id = $2
                  AND category_id IS NOT NULL
                  AND group_id IS NULL
            `,
            [householdId, accountId, entryId, amountCents, occurredAt, description, categoryId]
        );
        if (res.rowCount !== 1) throw new Error("Unable to update: entry not found or not editable");

        await reconcileRoundupForExpense({
            client,
            householdId,
            mainAccountId: accountId,
            expenseEntryId: entryId,
            occurredAt,
            absExpenseCents: absCents,
            roundupEnabled,
        });
    });

    revalidatePath("/mvp");
}

export async function deleteExpenseAction(formData: FormData) {
    const householdId = mustUuid(formData.get("householdId"), "householdId");
    const accountId = mustUuid(formData.get("accountId"), "accountId");
    const entryId = mustUuid(formData.get("entryId"), "entryId");

    await withTx(async (client) => {
        const exp = await client.query<{ roundup_group_id: string | null }>(
            `
                SELECT roundup_group_id
                FROM ledger_entry
                WHERE id = $1 AND household_id = $2 AND account_id = $3
                  AND category_id IS NOT NULL
                  AND group_id IS NULL
                LIMIT 1
            `,
            [entryId, householdId, accountId]
        );

        const groupId = exp.rows[0]?.roundup_group_id ?? null;

        const del = await client.query(
            `
                DELETE FROM ledger_entry
                WHERE id = $3
                  AND household_id = $1
                  AND account_id = $2
                  AND category_id IS NOT NULL
                  AND group_id IS NULL
            `,
            [householdId, accountId, entryId]
        );
        if (del.rowCount !== 1) throw new Error("Unable to delete: entry not found or not editable");

        if (groupId) {
            await client.query(`DELETE FROM ledger_entry WHERE household_id = $1 AND group_id = $2`, [
                householdId,
                groupId,
            ]);
            await client.query(
                `DELETE FROM ledger_entry_group WHERE household_id = $1 AND id = $2 AND code = 'ROUNDUP'`,
                [householdId, groupId]
            );
        }
    });

    revalidatePath("/mvp");
}