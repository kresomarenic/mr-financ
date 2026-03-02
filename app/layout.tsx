// app/layout.tsx
import "./globals.css";
import type { ReactNode } from "react";
import { Providers } from "./providers";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";

export const metadata = {
    title: "Personal Finance Tracker",
};

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
        <body className="min-h-dvh antialiased bg-background text-foreground isolate">
        <Providers>
            <div className="flex min-h-dvh w-full">
                <div className="hidden md:block">
                    <Sidebar />
                </div>

                <div className="flex min-w-0 flex-1 flex-col">
                    <div className="sticky top-0 z-50">
                        <Header />
                    </div>

                    <main className="flex-1 relative z-0">
                        <div className="mx-auto w-full max-w-6xl p-4 md:p-8">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </Providers>
        </body>
        </html>
    );
}