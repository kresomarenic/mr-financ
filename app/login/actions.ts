// app/login/actions.ts
"use server";

import { redirect } from "next/navigation";
import { pool } from "@/lib/db";
import { createSession } from "@/lib/auth/session";
import { mustNonEmptyString } from "@/lib/domain/validate";

export async function loginAction(formData: FormData) {
    const email = mustNonEmptyString(formData.get("email"), "email").toLowerCase();
    const password = mustNonEmptyString(formData.get("password"), "password");

    // pgcrypto bcrypt verify:
    const res = await pool.query<{ id: string }>(
        `
        SELECT id
        FROM app_user
        WHERE email = $1
          AND archived = false
          AND password_hash IS NOT NULL
          AND password_hash = crypt($2, password_hash)
        LIMIT 1
        `,
        [email, password]
    );

    const userId = res.rows[0]?.id;
    if (!userId) {
        // MVP-friendly: just redirect with a query param
        redirect("/login?error=1");
    }

    await createSession(userId);
    redirect("/mvp");
}