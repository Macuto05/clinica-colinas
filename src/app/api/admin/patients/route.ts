import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma/client";
import { JWTService } from "@/infrastructure/services/JWTService";

export async function GET(req: NextRequest) {
    try {
        const token = req.cookies.get("auth-token")?.value;
        if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        const payload = await JWTService.verifyToken(token);
        if (!payload) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

        const patients = await prisma.paciente.findMany({
            where: { estado: 'ACTIVO' },
            select: {
                pacienteId: true,
                nombres: true,
                apellidos: true,
            },
            orderBy: { nombres: 'asc' },
        });

        return NextResponse.json({
            patients: patients.map(p => ({
                pacienteId: p.pacienteId.toString(),
                nombres: p.nombres,
                apellidos: p.apellidos,
            })),
        });
    } catch (error) {
        console.error("Error fetching patients:", error);
        return NextResponse.json({ error: "Error al cargar pacientes" }, { status: 500 });
    }
}
