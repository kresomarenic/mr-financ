// components/badge.tsx
import clsx from "clsx"
import type { HTMLAttributes } from "react"

type Variant = "neutral" | "emerald" | "rose" | "sky"

export function Badge({
                          variant = "neutral",
                          className,
                          ...props
                      }: HTMLAttributes<HTMLSpanElement> & { variant?: Variant }) {
    const base =
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide"

    const variants: Record<Variant, string> = {
        neutral: "bg-slate-100 text-slate-700",
        emerald: "bg-emerald-600 text-white",
        rose: "bg-rose-600 text-white",
        sky: "bg-sky-600 text-white",
    }

    return (
        <span
            className={clsx(base, variants[variant], className)}
            {...props}
        />
    )
}