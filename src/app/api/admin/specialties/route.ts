
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/infrastructure/database/prisma/client";
import { JWTService } from "@/infrastructure/services/JWTService";

// Validation Schema
const createSpecialtySchema = z.object({
    nombre: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
    descripcion: z.string().optional(),
    icono: z.string().optional(), // Emoji char or icon name
    activa: z.boolean().optional().default(true),
});

export async function POST(req: NextRequest) {
    try {
        // 1. Auth Check
        const token = req.cookies.get("auth-token")?.value;
        if (!token) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }
        const payload = await JWTService.verifyToken(token);
        if (!payload || payload.role !== "ADMIN") {
            return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
        }

        // 2. Validate Input
        const body = await req.json();
        const result = createSpecialtySchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { error: "Datos inválidos", details: result.error.format() },
                { status: 400 }
            );
        }

        const { nombre, descripcion, icono, activa } = result.data;

        // 3. Create in DB
        const newSpecialty = await prisma.especialidad.create({
            data: {
                nombre,
                descripcion,
                icono,
                activa,
            },
        });

        return NextResponse.json(
            {
                success: true,
                specialty: {
                    ...newSpecialty,
                    especialidadId: newSpecialty.especialidadId.toString(),
                }
            },
            { status: 201 }
        );

    } catch (error: any) {
        if (error.code === 'P2002') {
            return NextResponse.json({ error: "Ya existe una especialidad con ese nombre" }, { status: 409 });
        }
        console.error("Error creating specialty:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}
