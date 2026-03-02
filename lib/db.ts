// lib/db.ts
import { Pool } from "pg";

declare global {
    // eslint-disable-next-line no-var
    var __pgPool: Pool | undefined;
}

function makePool() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error("DATABASE_URL is not set");

    const isProd = process.env.NODE_ENV === "production";

    // IMPORTANT: force ssl config here (dev skips cert verification)
    const ssl = isProd ? { rejectUnauthorized: true } : { rejectUnauthorized: false };

    // One-time log so we can confirm the config is actually applied
    console.log("[db] creating pool", { isProd, sslRejectUnauthorized: ssl.rejectUnauthorized });

    return new Pool({
        connectionString,
        ssl,
        max: 5,
        idleTimeoutMillis: 30_000,
        connectionTimeoutMillis: 10_000,
    });
}

export const pool: Pool = global.__pgPool ?? (global.__pgPool = makePool());

export async function dbPing() {
    const res = await pool.query<{ now: string }>("select now()::text as now");
    return res.rows[0]?.now ?? "unknown";
}