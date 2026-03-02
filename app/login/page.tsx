// app/login/page.tsx
import { loginAction } from "./actions";

export default async function LoginPage(props: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
    const sp = (await props.searchParams) ?? {};
    const error = sp.error === "1";

    return (
        <main className="min-h-[80vh] flex items-center justify-center p-6">
            <div className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
                <h1 className="text-xl font-semibold">Sign in</h1>
                <p className="mt-1 text-sm text-neutral-600">Use your email and password.</p>

                {error && (
                    <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                        Invalid email or password.
                    </div>
                )}

                <form action={loginAction} className="mt-4 grid gap-3">
                    <label className="grid gap-1 text-sm">
                        <span className="font-medium">Email</span>
                        <input
                            name="email"
                            type="email"
                            required
                            autoComplete="email"
                            className="w-full rounded-md border border-neutral-300 px-3 py-2"
                        />
                    </label>

                    <label className="grid gap-1 text-sm">
                        <span className="font-medium">Password</span>
                        <input
                            name="password"
                            type="password"
                            required
                            autoComplete="current-password"
                            className="w-full rounded-md border border-neutral-300 px-3 py-2"
                        />
                    </label>

                    <button
                        type="submit"
                        className="mt-2 rounded-md border border-neutral-300 bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800"
                    >
                        Sign in
                    </button>
                </form>
            </div>
        </main>
    );
}