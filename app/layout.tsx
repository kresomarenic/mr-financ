// app/layout.tsx

import "./globals.css"
import type { ReactNode } from "react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"

export const metadata = {
    title: "Personal Finance Tracker",
}

export default function RootLayout({
                                       children,
                                   }: {
    children: ReactNode
}) {
    return (
        <html lang="en">
        <body className="bg-slate-100 text-slate-900 antialiased">
        <div className="flex min-h-screen w-full">
            {/* Sidebar */}
            <Sidebar />

            {/* Main Column */}
            <div className="flex min-w-0 flex-1 flex-col">
                {/* Sticky Header */}
                <div className="sticky top-0 z-20">
                    <Header />
                </div>

                {/* Scrollable Content */}
                <main className="flex-1 overflow-auto">
                    <div className="mx-auto w-full max-w-6xl p-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
        </body>
        </html>
    )
}