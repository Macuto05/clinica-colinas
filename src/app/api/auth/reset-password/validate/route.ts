import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma/client";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const token = searchParams.get("token");

        if (!token) {
            return NextResponse.json({ valid: false, error: "Token no proporcionado" }, { status: 400 });
        }

        const record = await prisma.passwordResetToken.findUnique({
            where: { token },
        });

        if (!record) {
            return NextResponse.json({ valid: false, error: "Enlace inválido o no existe" });
        }

        if (record.used) {
            return NextResponse.json({ valid: false, error: "Este enlace ya fue utilizado" });
        }

        if (record.expiresAt < new Date()) {
            return NextResponse.json({ valid: false, error: "El enlace ha expirado. Solicita uno nuevo." });
        }

        return NextResponse.json({ valid: true });
    } catch (error) {
        console.error("Token validation error:", error);
        return NextResponse.json({ valid: false, error: "Error al validar el enlace" }, { status: 500 });
    }
}
