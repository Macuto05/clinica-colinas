
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/infrastructure/database/prisma/client";

const updateSpecialtySchema = z.object({
    nombre: z.string().min(3),
    descripcion: z.string().optional(),
    icono: z.string().optional(),
    activa: z.boolean().optional(),
});

export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ id: string }> } // Standard Next.js 15+ param handling
) {
    const { id } = await context.params;

    try {
        const body = await request.json();
        const validation = updateSpecialtySchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        const data = validation.data;
        const specialtyId = BigInt(id);

        // Check if name exists (excluding current)
        const existing = await prisma.especialidad.findFirst({
            where: {
                nombre: { equals: data.nombre, mode: 'insensitive' },
                especialidadId: { not: specialtyId }
            }
        });

        if (existing) {
            return NextResponse.json(
                { error: "Ya existe otra especialidad con este nombre" },
                { status: 400 }
            );
        }

        const updatedSpecialty = await prisma.especialidad.update({
            where: { especialidadId: specialtyId },
            data: {
                nombre: data.nombre,
                descripcion: data.descripcion,
                icono: data.icono,
                activa: data.activa
            }
        });

        return NextResponse.json({
            success: true,
            specialty: {
                ...updatedSpecialty,
                especialidadId: updatedSpecialty.especialidadId.toString()
            }
        });

    } catch (error) {
        console.error("Error updating specialty:", error);
        return NextResponse.json(
            { error: "Error al actualizar la especialidad" },
            { status: 500 }
        );
    }
}
