/**
 * Centralized auth helper for API route handlers.
 * Extracts and validates JWT token, enforces role-based access.
 */

import { NextRequest, NextResponse } from "next/server";
import { JWTService, TokenPayload } from "@/infrastructure/services/JWTService";

export interface AuthResult {
    payload: TokenPayload;
    userId: bigint;
    role: string;
}

/**
 * Authenticates a request and optionally checks role authorization.
 * Returns the authenticated payload or a NextResponse error.
 *
 * @param req - The incoming request
 * @param allowedRoles - Optional array of roles allowed to access this endpoint.
 *                       If omitted, any authenticated user is allowed.
 *
 * Usage:
 * ```ts
 * const auth = await requireAuth(req, ["ADMIN", "CAJA"]);
 * if (auth instanceof NextResponse) return auth; // error response
 * const { userId, role, payload } = auth;
 * ```
 */
export async function requireAuth(
    req: NextRequest,
    allowedRoles?: string[]
): Promise<AuthResult | NextResponse> {
    const token = req.cookies.get("auth-token")?.value;

    if (!token) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const payload = await JWTService.verifyToken(token);
    if (!payload) {
        return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    const rawUserId = payload.userId ?? payload.sub;
    if (!rawUserId) {
        return NextResponse.json({ error: "Token inválido: sin userId" }, { status: 401 });
    }

    const role = payload.role || "";

    if (allowedRoles && allowedRoles.length > 0) {
        if (!allowedRoles.includes(role)) {
            return NextResponse.json(
                { error: "Acceso denegado: rol insuficiente" },
                { status: 403 }
            );
        }
    }

    return {
        payload,
        userId: BigInt(rawUserId),
        role,
    };
}
