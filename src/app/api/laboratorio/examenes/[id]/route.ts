import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma/client";
import { z } from "zod";

// @ts-ignore
BigInt.prototype.toJSON = function () { return this.toString() };

const updateSchema = z.object({
    nombre:      z.string().min(2, "El nombre debe tener al menos 2 caracteres").optional(),
    descripcion: z.string().nullable().optional(),
    precio:      z.number().min(0, "El precio no puede ser negativo").optional(),
    activo:      z.boolean().optional(),
});

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const examenId = BigInt(id);
        const body = await req.json();
        const result = updateSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { error: "Datos inválidos", details: result.error.format() },
                { status: 400 }
            );
        }

        if (result.data.nombre) {
            const existing = await (prisma as any).examenLaboratorio.findFirst({
                where: { nombre: result.data.nombre, NOT: { examenId } },
            });
            if (existing) {
                return NextResponse.json(
                    { error: "Ya existe un examen con este nombre" },
                    { status: 400 }
                );
            }
        }

        const updated = await (prisma as any).examenLaboratorio.update({
            where: { examenId },
            data: result.data,
        });

        return NextResponse.json({ success: true, examenId: updated.examenId.toString() });
    } catch (error) {
        console.error("Error updating examen lab:", error);
        return NextResponse.json({ error: "Error al actualizar examen" }, { status: 500 });
    }
}
