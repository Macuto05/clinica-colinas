import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { JWTService } from "@/infrastructure/services/JWTService";

export async function middleware(req: NextRequest) {
    const token = req.cookies.get("auth-token")?.value;
    const url = req.nextUrl.clone();

    // Public paths that don't require authentication
    const publicPaths = ["/", "/login", "/registro", "/api/auth/login", "/api/auth/register", "/especialidades", "/servicios", "/medicos", "/nosotros", "/contacto"];

    // Check if the current path is public
    if (publicPaths.some((path) => req.nextUrl.pathname.startsWith(path)) || req.nextUrl.pathname.startsWith("/_next") || req.nextUrl.pathname.startsWith("/static") || req.nextUrl.pathname.startsWith("/images") || req.nextUrl.pathname.startsWith("/favicon.ico")) {
        return NextResponse.next();
    }

    if (!token) {
        url.pathname = "/login";
        url.searchParams.set("redirect", req.nextUrl.pathname);
        return NextResponse.redirect(url);
    }

    const payload = await JWTService.verifyToken(token);
    if (!payload) {
        url.pathname = "/login";
        url.searchParams.set("redirect", req.nextUrl.pathname);
        return NextResponse.redirect(url);
    }

    // Role-based redirection
    const role = (payload as any).role;

    // Protect Admin Routes
    if (req.nextUrl.pathname.startsWith("/admin") && role !== "ADMIN") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Protect Doctor Routes
    if (req.nextUrl.pathname.startsWith("/dashboard/medico") && role !== "MEDICO") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Protect Patient Routes
    if (req.nextUrl.pathname.startsWith("/dashboard/paciente") && role !== "PACIENTE") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Protect Storekeeper Routes
    if (req.nextUrl.pathname.startsWith("/almacen") && role !== "ALMACEN" && role !== "ADMIN") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Protect Caja Routes
    if (req.nextUrl.pathname.startsWith("/caja") && role !== "CAJA/FACTURACION" && role !== "ADMIN") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/dashboard/:path*", "/admin/:path*", "/api/appointments/:path*", "/almacen/:path*", "/caja/:path*"],
};
