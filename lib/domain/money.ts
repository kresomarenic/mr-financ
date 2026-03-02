// lib/domain/money.ts

import type { Cents } from "@/lib/domain/types"

export function formatEurFromCents(centsText: string, opts?: { abs?: boolean }) {
    let cents = BigInt(centsText);

    if (opts?.abs && cents < 0n) {
        cents = -cents;
    }

    const sign = cents < 0n ? "-" : "";
    const abs = cents < 0n ? -cents : cents;
    const euros = abs / 100n;
    const rem = abs % 100n;
    return `${sign}${euros.toString()}.${rem.toString().padStart(2, "0")} €`;
}

export function parseEurToAbsCents(amountEurRaw: unknown): bigint {
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

export function formatAbsEurForInput(centsText: string) {
    const cents = BigInt(centsText);
    const abs = cents < 0n ? -cents : cents;
    const euros = abs / 100n;
    const rem = abs % 100n;
    return `${euros.toString()}.${rem.toString().padStart(2, "0")}`;
}

// Rule you specified:
// 1.70 -> 0.30
// 12.00 -> 1.00 (if enabled)
export function computeRoundupCents(absExpenseCents: bigint): bigint {
    const rem = absExpenseCents % 100n;
    return 100n - rem; // rem==0 => 100
}

// legacy methods used while working with fake data
export function formatCents(cents: Cents, currency = "EUR"): string {
    const value = cents / 100
    return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency,
        maximumFractionDigits: 2,
    }).format(value)
}

export function sumCents(values: readonly Cents[]): Cents {
    return values.reduce((acc, v) => acc + v, 0)
}

/**
 * Parses user input like "12.34" or "12,34" into integer cents.
 * Returns null if invalid or <= 0.
 */
export function parseMoneyToCents(input: string): Cents | null {
    const s = input.trim().replace(",", ".")
    if (!s) return null

    // allow "12", "12.3", "12.34"
    if (!/^\d+(\.\d{0,2})?$/.test(s)) return null

    const n = Number(s)
    if (!Number.isFinite(n) || n <= 0) return null

    return Math.round(n * 100)
}