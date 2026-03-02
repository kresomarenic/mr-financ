// components/sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

import {
    HomeIcon,
    ArrowPathIcon,
    ClipboardDocumentListIcon,
    ReceiptPercentIcon,
    BanknotesIcon,
    WalletIcon,
} from "@heroicons/react/24/outline";
import { ArrowRightIcon } from "@heroicons/react/16/solid";

const navItems = [
    { title: "MVP", href: "/mvp", icon: ArrowRightIcon },
    { title: "Dashboard", href: "/dashboard", icon: HomeIcon },
    { title: "Cycles", href: "/cycles", icon: ArrowPathIcon },
    { title: "Planning", href: "/planning", icon: ClipboardDocumentListIcon },
    { title: "Expenses", href: "/expenses", icon: ReceiptPercentIcon },
    { title: "Savings", href: "/savings", icon: BanknotesIcon },
    { title: "Accounts", href: "/accounts", icon: WalletIcon },
];

export function Sidebar() {
    const pathname = usePathname();
    if (pathname.startsWith("/login")) return null;

    return (
        <aside className="flex w-64 flex-col border-r border-border bg-background">
            {/* Header */}
            <div className="border-b border-border px-5 py-5">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600">
                        <WalletIcon className="h-5 w-5 text-white" />
                    </div>

                    <div className="leading-tight">
                        <div className="text-sm font-semibold">Personal Finance</div>
                        <div className="text-xs text-foreground/60">Ledger Tracker</div>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 px-3 py-4">
                <div className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-widest text-foreground/50">
                    Navigation
                </div>

                <nav className="space-y-0.5">
                    {navItems.map((item) => {
                        const isActive =
                            pathname === item.href ||
                            (item.href !== "/mvp" && pathname.startsWith(item.href));

                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.title}
                                href={item.href}
                                className={clsx(
                                    "group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                                    isActive
                                        ? "bg-emerald-500/10 text-emerald-700"
                                        : "text-foreground/80 hover:bg-muted hover:text-foreground"
                                )}
                            >
                                {isActive && (
                                    <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r bg-emerald-500" />
                                )}

                                <Icon
                                    className={clsx(
                                        "h-5 w-5 flex-shrink-0",
                                        isActive
                                            ? "text-emerald-700"
                                            : "text-foreground/50 group-hover:text-foreground"
                                    )}
                                />

                                <span className="font-medium">{item.title}</span>
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Footer */}
            <div className="border-t border-border p-4">
                <div className="rounded-lg bg-muted p-3 ring-1 ring-black/5">
                    <div className="mb-1 text-[10px] uppercase tracking-widest text-foreground/50">
                        Active Cycle
                    </div>
                    <div className="text-sm font-semibold">Feb 15, 2026</div>
                    <div className="text-xs font-mono text-emerald-700">$5,500.00</div>
                </div>
            </div>
        </aside>
    );
}