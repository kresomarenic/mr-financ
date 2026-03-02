// components/mobile-sidebar.tsx
"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export function MobileSidebar({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    // Close on ESC
    useEffect(() => {
        function onKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape") setOpen(false);
        }
        if (open) window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [open]);

    // Prevent body scroll when open
    useEffect(() => {
        if (!open) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prev;
        };
    }, [open]);

    return (
        <>
            <button
                type="button"
                className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-md hover:bg-muted"
                onClick={() => setOpen(true)}
                aria-label="Open menu"
            >
                <span className="text-xl leading-none">☰</span>
            </button>

            {mounted && open
                ? createPortal(
                    <div className="fixed inset-0 z-[9999] md:hidden">
                        {/* Overlay */}
                        <button
                            className="absolute inset-0 bg-black/40"
                            onClick={() => setOpen(false)}
                            aria-label="Close overlay"
                        />

                        {/* Drawer */}
                        <div
                            className="absolute left-0 top-0 h-full w-80 max-w-[85vw] border-r border-border bg-background p-2"
                            role="dialog"
                            aria-modal="true"
                        >
                            <div className="flex items-center justify-between px-2 py-2">
                                <div className="text-sm font-semibold">Menu</div>
                                <button
                                    type="button"
                                    className="inline-flex h-10 w-10 items-center justify-center rounded-md hover:bg-muted"
                                    onClick={() => setOpen(false)}
                                    aria-label="Close menu"
                                >
                                    <span className="text-xl leading-none">✕</span>
                                </button>
                            </div>

                            {/* Close drawer when clicking a link */}
                            <div
                                className="h-[calc(100%-52px)] overflow-auto"
                                onClick={(e) => {
                                    const t = e.target as HTMLElement;
                                    if (t.closest("a")) setOpen(false);
                                }}
                            >
                                {children}
                            </div>
                        </div>
                    </div>,
                    document.body
                )
                : null}
        </>
    );
}