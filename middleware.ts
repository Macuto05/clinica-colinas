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

    // Redirect specific roles from generic dashboard to their panels
    if (req.nextUrl.pathname === "/dashboard") {
        if (role === "RECEPCION") return NextResponse.redirect(new URL("/recepcion", req.url));
        if (role === "MEDICO") return NextResponse.redirect(new URL("/medico", req.url));
        if (role === "ALMACEN") return NextResponse.redirect(new URL("/almacen", req.url));
        if (role === "CAJA" || role === "CAJA/FACTURACION") return NextResponse.redirect(new URL("/caja", req.url));
        if (role === "ADMIN") return NextResponse.redirect(new URL("/admin", req.url));
    }

    // Protect Admin Routes
    if (req.nextUrl.pathname.startsWith("/admin") && role !== "ADMIN") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Protect Doctor Routes
    if (req.nextUrl.pathname.startsWith("/medico") && role !== "MEDICO" && role !== "ADMIN") {
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
    if (req.nextUrl.pathname.startsWith("/caja") && role !== "CAJA" && role !== "CAJA/FACTURACION" && role !== "ADMIN") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Protect Reception Routes
    if (req.nextUrl.pathname.startsWith("/recepcion") && role !== "RECEPCION") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/dashboard/:path*", "/admin/:path*", "/api/appointments/:path*", "/almacen/:path*", "/caja/:path*", "/medico/:path*", "/recepcion/:path*"],
};
