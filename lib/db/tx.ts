// lib/db/tx.ts
import type { PoolClient } from "pg";
import { pool } from "@/lib/db";

/**
 * Runs fn() inside a DB transaction.
 * - acquires a client
 * - BEGIN / COMMIT
 * - ROLLBACK on error
 * - always releases
 */
export async function withTx<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const result = await fn(client);
        await client.query("COMMIT");
        return result;
    } catch (e) {
        try {
            await client.query("ROLLBACK");
        } catch {
            // ignore rollback errors (original error is more important)
        }
        throw e;
    } finally {
        client.release();
    }
}