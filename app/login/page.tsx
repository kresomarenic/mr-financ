// app/login/page.tsx
import { loginAction } from "./actions";

export default async function LoginPage(props: {
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
    const sp = (await props.searchParams) ?? {};
    const error = sp.error === "1";

    return (
        <main className="min-h-dvh flex items-center justify-center px-4 py-10">
            <div className="w-full max-w-sm">
                {/* Card */}
                <div className="rounded-2xl border border-border bg-background p-5 shadow-sm md:p-6">
                    {/* Brand / title */}
                    <div className="mb-5">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
                                {/* simple mark */}
                                <span className="text-sm font-semibold">$</span>
                            </div>

                            <div className="leading-tight">
                                <h1 className="text-lg font-semibold tracking-tight">
                                    Sign in
                                </h1>
                                <p className="mt-0.5 text-sm text-foreground/60">
                                    Use your email and password.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="mb-4 rounded-xl border border-red-300 bg-background px-3 py-2 text-sm text-red-700">
                            Invalid email or password.
                        </div>
                    )}

                    <form action={loginAction} className="grid gap-4">
                        <label className="grid gap-1.5 text-sm">
                            <span className="font-semibold text-foreground/80">Email</span>
                            <input
                                name="email"
                                type="email"
                                required
                                autoComplete="email"
                                inputMode="email"
                                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-base outline-none ring-0 placeholder:text-foreground/40 focus:border-emerald-600"
                                placeholder="you@domain.com"
                            />
                        </label>

                        <label className="grid gap-1.5 text-sm">
                            <span className="font-semibold text-foreground/80">Password</span>
                            <input
                                name="password"
                                type="password"
                                required
                                autoComplete="current-password"
                                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-base outline-none ring-0 placeholder:text-foreground/40 focus:border-emerald-600"
                                placeholder="••••••••"
                            />
                        </label>

                        <button
                            type="submit"
                            className="mt-1 inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:opacity-95 active:opacity-90"
                        >
                            Sign in
                        </button>

                        {/*<div className="text-center text-xs text-foreground/60">*/}
                        {/*    Tip: add a theme toggle later if you want.*/}
                        {/*</div>*/}
                    </form>
                </div>

                {/* Footer note */}
                <p className="mt-4 text-center text-xs text-foreground/50">
                    Personal Finance Tracker
                </p>
            </div>
        </main>
    );
}