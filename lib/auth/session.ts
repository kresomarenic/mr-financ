// lib/auth/session.ts
import { cookies } from "next/headers";
import { pool } from "@/lib/db";

const COOKIE_NAME = "mrfin_session";
const SESSION_TTL_DAYS = 30;

function isProd() {
    return process.env.NODE_ENV === "production";
}

export async function createSession(userId: string): Promise<string> {
    const res = await pool.query<{ id: string }>(
        `
        INSERT INTO session (user_id, expires_at)
        VALUES ($1, now() + ($2 || ' days')::interval)
        RETURNING id
        `,
        [userId, String(SESSION_TTL_DAYS)]
    );

    const sessionId = res.rows[0]?.id;
    if (!sessionId) throw new Error("Failed to create session");

    const jar = await cookies();
    jar.set(COOKIE_NAME, sessionId, {
        httpOnly: true,
        sameSite: "lax",
        secure: isProd(),
        path: "/",
        maxAge: SESSION_TTL_DAYS * 24 * 60 * 60,
    });

    return sessionId;
}

export async function clearSession(): Promise<void> {
    const jar = await cookies();
    const sessionId = jar.get(COOKIE_NAME)?.value;

    if (sessionId) {
        // Best effort
        await pool.query(`DELETE FROM session WHERE id = $1`, [sessionId]).catch(() => {});
    }

    jar.set(COOKIE_NAME, "", {
        httpOnly: true,
        sameSite: "lax",
        secure: isProd(),
        path: "/",
        maxAge: 0,
    });
}

/** Returns userId if session cookie exists AND session is valid. Otherwise null. */
export async function getCurrentUserId(): Promise<string | null> {
    const jar = await cookies();
    const sessionId = jar.get(COOKIE_NAME)?.value;
    if (!sessionId) return null;

    const res = await pool.query<{ user_id: string }>(
        `
        SELECT user_id
        FROM session
        WHERE id = $1
          AND expires_at > now()
        LIMIT 1
        `,
        [sessionId]
    );

    return res.rows[0]?.user_id ?? null;
}

/** Use this in server components/actions that require auth */
export async function requireUserId(): Promise<string> {
    const userId = await getCurrentUserId();
    if (!userId) {
        // We can't redirect from here without importing next/navigation.
        // Keep it simple: throw, and callers can redirect.
        throw new Error("UNAUTHENTICATED");
    }
    return userId;
}