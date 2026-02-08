import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { JWTService } from "@/infrastructure/services/JWTService";

// Helper to serialize BigInt
const bigIntReplacer = (key: string, value: any) => {
    if (typeof value === 'bigint') {
        return value.toString();
    }
    return value;
};

export async function GET(req: NextRequest) {
    try {
        console.log("--- API START: /api/patient/clinical-history ---");
        // 1. Verify Auth
        const cookieStore = await cookies();
        const token = cookieStore.get("auth-token"); // Fixed cookie name

        if (!token) {
            console.log("Error: No token found for key 'auth-token'");
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const payload = await JWTService.verifyToken(token.value);

        if (!payload) {
            console.log("Error: Invalid token payload");
            return NextResponse.json({ error: "Token inválido" }, { status: 401 });
        }

        const userId = Number(payload.userId); // JWTService uses userId
        console.log("User ID authenticated:", userId);

        // 2. Find Patient linked to User
        const paciente = await prisma.paciente.findUnique({
            where: { usuarioId: BigInt(userId) },
            select: { pacienteId: true }
        });

        if (!paciente) {
            console.log("Error: No patient profile found for user", userId);
            return NextResponse.json({ error: "Perfil de paciente no encontrado" }, { status: 404 });
        }
        console.log("Patient ID found:", paciente.pacienteId);

        // 3. Fetch Clinical History
        const historia = await prisma.historiaClinica.findUnique({
            where: { pacienteId: paciente.pacienteId }
        });

        console.log("History found:", !!historia);

        // 4. Return Data (Empty object if none exists, to prevent frontend crash)
        const responseData = historia || { contenido: {}, updatedAt: null };

        const json = JSON.stringify(responseData, bigIntReplacer);
        return new NextResponse(json, {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error("Error fetching patient history:", error);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}
