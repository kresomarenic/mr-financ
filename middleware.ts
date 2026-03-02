// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "mrfin_session";

export function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // Allow login + Next assets + favicon
    if (
        pathname.startsWith("/login") ||
        pathname.startsWith("/_next") ||
        pathname.startsWith("/favicon.ico") ||
        pathname.startsWith("/public")
    ) {
        return NextResponse.next();
    }

    const sessionCookie = req.cookies.get(COOKIE_NAME)?.value;
    if (!sessionCookie) {
        const url = req.nextUrl.clone();
        url.pathname = "/login";
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!api).*)"],
};