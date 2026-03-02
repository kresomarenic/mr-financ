// lib/domain/validate.ts

export function mustUuid(v: unknown, name: string): string {
    if (typeof v !== "string" || !/^[0-9a-fA-F-]{36}$/.test(v)) {
        throw new Error(`${name} must be a uuid`);
    }
    return v;
}

export function mustNonEmptyString(v: unknown, name: string): string {
    const s = String(v ?? "").trim();
    if (!s) throw new Error(`${name} is required`);
    return s;
}