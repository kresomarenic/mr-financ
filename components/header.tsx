// components/header.tsx

"use client"

import { usePathname } from "next/navigation"
import { logoutAction } from "@/app/logout/actions";

function getPageTitle(pathname: string) {
    if (pathname.startsWith("/mvp")) return "MVP"
    if (pathname.startsWith("/accounts")) return "Accounts"
    if (pathname.startsWith("/cycles")) return "Cycles"
    if (pathname.startsWith("/planning")) return "Planning"
    if (pathname.startsWith("/expenses")) return "Expenses"
    if (pathname.startsWith("/savings")) return "Savings"
    return "Dashboard"
}

export function Header() {
    const pathname = usePathname()
    if (pathname.startsWith("/login")) return null;
    const title = getPageTitle(pathname)

    return (
        <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-6">
            {/* Left */}
            <div className="flex flex-col leading-tight">
                <h1 className="text-sm font-semibold tracking-tight text-slate-900">
                    {title}
                </h1>
                <span className="text-xs text-slate-500">Ledger-based accounting</span>
            </div>

            {/* Right */}
            <div className="flex items-center gap-4">
                <div className="text-xs text-slate-500">Feb 2026 Cycle</div>

                <div className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-medium text-white">
                    $5,500.00
                </div>

                <form action={logoutAction}>
                    <button
                        type="submit"
                        className="rounded-md border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                    >
                        Logout
                    </button>
                </form>
            </div>        </header>
    )
}