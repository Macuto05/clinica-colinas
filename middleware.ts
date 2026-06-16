import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { JWTService } from "@/infrastructure/services/JWTService";

/**
 * Role variants — kept inline here because middleware runs in Edge Runtime
 * and cannot import from barrel files that use Node.js APIs.
 */
const CAJA_ROLES = [
    "CAJA",
    "CAJA Y FACTURACION",
    "CAJA Y FACTURACIÓN",
    "CAJA/FACTURACION",
    "CAJA/FACTURACIÓN",
];

// Handles DB inconsistency where the role may be stored with or without accent
const ALMACEN_ROLES = ["ALMACEN", "ALMACÉN"];

export async function middleware(req: NextRequest) {
    const token = req.cookies.get("auth-token")?.value;
    const url = req.nextUrl.clone();
    const pathname = req.nextUrl.pathname;

    // ── Public paths that don't require authentication ──
    const publicPaths = ["/", "/login", "/registro", "/api/auth/login", "/api/auth/register", "/especialidades", "/servicios", "/medicos", "/nosotros", "/contacto"];

    // Check if the current path is public
    if (publicPaths.some((path) => pathname.startsWith(path)) || pathname.startsWith("/_next") || pathname.startsWith("/static") || pathname.startsWith("/images") || pathname.startsWith("/favicon.ico")) {
        return NextResponse.next();
    }

    // ── Public API endpoints (no auth needed) ──
    const publicApiPaths = ["/api/auth/", "/api/specialties", "/api/doctors"];
    if (publicApiPaths.some((path) => pathname.startsWith(path))) {
        return NextResponse.next();
    }

    if (!token) {
        // API routes return 401, page routes redirect to login
        if (pathname.startsWith("/api/")) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }
        url.pathname = "/login";
        url.searchParams.set("redirect", pathname);
        return NextResponse.redirect(url);
    }

    const payload = await JWTService.verifyToken(token);
    if (!payload) {
        if (pathname.startsWith("/api/")) {
            return NextResponse.json({ error: "Token inválido" }, { status: 401 });
        }
        url.pathname = "/login";
        url.searchParams.set("redirect", pathname);
        return NextResponse.redirect(url);
    }

    // Role-based redirection
    const role = (payload as any).role;

    // ── Redirect specific roles from generic dashboard to their panels ──
    if (pathname === "/dashboard") {
        if (role === "RECEPCION") return NextResponse.redirect(new URL("/recepcion", req.url));
        if (role === "MEDICO") return NextResponse.redirect(new URL("/medico", req.url));
        if (ALMACEN_ROLES.includes(role)) return NextResponse.redirect(new URL("/almacen", req.url));
        if (CAJA_ROLES.includes(role)) return NextResponse.redirect(new URL("/caja", req.url));
        if (role === "ADMIN") return NextResponse.redirect(new URL("/admin", req.url));
        if (role === "LABORATORIO") return NextResponse.redirect(new URL("/laboratorio", req.url));
        if (role === "IMAGENOLOGIA") return NextResponse.redirect(new URL("/imagenologia", req.url));
        if (role === "FARMACIA") return NextResponse.redirect(new URL("/farmacia", req.url));
        if (role === "ENFERMERIA") return NextResponse.redirect(new URL("/enfermeria", req.url));
    }

    // ── API Route Authorization ──
    // Admin API routes
    if (pathname.startsWith("/api/admin") && role !== "ADMIN") {
        return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    // Doctor API routes
    if (pathname.startsWith("/api/doctor") && role !== "MEDICO" && role !== "ADMIN") {
        return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    // Billing API routes (Caja + Admin)
    const allowedBillingRoles = [...CAJA_ROLES, "ADMIN"];
    if (pathname.startsWith("/api/billing") && !allowedBillingRoles.includes(role)) {
        return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    // Inventory API routes (Almacen + Admin)
    if (pathname.startsWith("/api/inventory") && !ALMACEN_ROLES.includes(role) && role !== "ADMIN") {
        return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    // Reception API routes
    if (pathname.startsWith("/api/reception") && role !== "RECEPCION" && role !== "ADMIN") {
        return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    // Laboratorio API routes
    if (pathname.startsWith("/api/laboratorio") && role !== "LABORATORIO" && role !== "ADMIN") {
        return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    // Imagenologia API routes
    if (pathname.startsWith("/api/imagenologia") && role !== "IMAGENOLOGIA" && role !== "ADMIN") {
        return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    // Farmacia API routes
    if (pathname.startsWith("/api/farmacia") && role !== "FARMACIA" && role !== "ADMIN") {
        return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    // Enfermeria API routes
    if (pathname.startsWith("/api/enfermeria") && role !== "ENFERMERIA" && role !== "ADMIN") {
        return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    // Emergency API routes (multiple roles can access)
    const allowedEmergencyRoles = ["RECEPCION", "MEDICO", "ADMIN", "ENFERMERIA", "PACIENTE", ...CAJA_ROLES];
    if (pathname.startsWith("/api/emergency") && !allowedEmergencyRoles.includes(role)) {
        return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    // ── Page Route Authorization ──
    // Protect Admin Routes
    if (pathname.startsWith("/admin") && role !== "ADMIN") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Protect Doctor Routes
    if (pathname.startsWith("/medico") && role !== "MEDICO" && role !== "ADMIN") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Protect Patient Routes
    if (pathname.startsWith("/dashboard/paciente") && role !== "PACIENTE") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Protect Storekeeper Routes
    if (pathname.startsWith("/almacen") && !ALMACEN_ROLES.includes(role) && role !== "ADMIN") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Protect Caja Routes
    const allowedCajaRoles = [...CAJA_ROLES, "ADMIN"];
    if (pathname.startsWith("/caja") && !allowedCajaRoles.includes(role)) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Protect Reception Routes
    if (pathname.startsWith("/recepcion") && role !== "RECEPCION") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Protect Laboratory Routes
    if (pathname.startsWith("/laboratorio") && role !== "LABORATORIO" && role !== "ADMIN") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Protect Imaging Routes
    if (pathname.startsWith("/imagenologia") && role !== "IMAGENOLOGIA" && role !== "ADMIN") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Protect Pharmacy Routes
    if (pathname.startsWith("/farmacia") && role !== "FARMACIA" && role !== "ADMIN") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Protect Nursing Routes
    if (pathname.startsWith("/enfermeria") && role !== "ENFERMERIA" && role !== "ADMIN") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        // Pages
        "/dashboard", "/dashboard/:path*",
        "/admin", "/admin/:path*",
        "/almacen", "/almacen/:path*",
        "/caja", "/caja/:path*",
        "/medico", "/medico/:path*",
        "/recepcion", "/recepcion/:path*",
        "/laboratorio", "/laboratorio/:path*",
        "/imagenologia", "/imagenologia/:path*",
        "/farmacia", "/farmacia/:path*",
        "/enfermeria", "/enfermeria/:path*",
        // BP-02: API routes now protected by middleware
        "/api/admin/:path*",
        "/api/doctor/:path*",
        "/api/billing/:path*",
        "/api/inventory/:path*",
        "/api/reception/:path*",
        "/api/emergency/:path*",
        "/api/laboratorio/:path*",
        "/api/imagenologia/:path*",
        "/api/farmacia/:path*",
        "/api/enfermeria/:path*",
        "/api/patient/:path*",
        "/api/patients/:path*",
        "/api/appointments/:path*",
        "/api/insumos/:path*",
        "/api/almacen/:path*",
        "/api/user/:path*",
    ],
};
