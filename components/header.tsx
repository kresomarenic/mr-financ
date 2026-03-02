// components/header.tsx
"use client";

import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/logout/actions";
import { Sidebar } from "@/components/sidebar";
import { MobileSidebar } from "@/components/mobile-sidebar";

function getPageTitle(pathname: string) {
    if (pathname.startsWith("/mvp")) return "MVP";
    if (pathname.startsWith("/accounts")) return "Accounts";
    if (pathname.startsWith("/cycles")) return "Cycles";
    if (pathname.startsWith("/planning")) return "Planning";
    if (pathname.startsWith("/expenses")) return "Expenses";
    if (pathname.startsWith("/savings")) return "Savings";
    return "Dashboard";
}

export function Header() {
    const pathname = usePathname();
    if (pathname.startsWith("/login")) return null;

    const title = getPageTitle(pathname);

    return (
        <header className="relative z-50 flex h-14 items-center justify-between border-b border-border bg-background/80 px-3 backdrop-blur md:px-6">
            {/* Left */}
            <div className="flex min-w-0 items-center gap-2">
                {/* Mobile hamburger */}
                <MobileSidebar>
                    <Sidebar />
                </MobileSidebar>

                <div className="min-w-0 leading-tight">
                    <h1 className="truncate text-sm font-semibold tracking-tight">
                        {title}
                    </h1>
                    <span className="hidden text-xs text-foreground/60 sm:block">
            Ledger-based accounting
          </span>
                </div>
            </div>

            {/* Right */}
            <div className="flex items-center gap-2 md:gap-4">
                <div className="hidden text-xs text-foreground/60 sm:block">
                    Feb 2026 Cycle
                </div>

                <div className="rounded-md bg-emerald-600 px-2 py-1 text-xs font-medium text-white md:px-3">
                    $5,500.00
                </div>

                <form action={logoutAction}>
                    <button
                        type="submit"
                        className="rounded-md border border-border bg-background px-2 py-1 text-xs font-medium hover:bg-muted md:px-3"
                    >
                        Logout
                    </button>
                </form>
            </div>
        </header>
    );
}