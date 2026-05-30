import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma/client";
import { z } from "zod";

// @ts-ignore
BigInt.prototype.toJSON = function () { return this.toString() };

const createExamenSchema = z.object({
    nombre:      z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    descripcion: z.string().optional(),
    precio:      z.number().min(0, "El precio no puede ser negativo")
});

/* GET /api/imagenologia/examenes — Catálogo de estudios disponibles */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const todos = searchParams.get("todos") === "true";

        const examenes = await (prisma as any).examenImagenologia.findMany({
            where: todos ? undefined : { activo: true },
            select: { examenId: true, nombre: true, descripcion: true, precio: true, activo: true },
            orderBy: { nombre: "asc" },
        });

        return NextResponse.json(
            examenes.map((e: any) => ({
                examenId:    e.examenId.toString(),
                nombre:      e.nombre,
                descripcion: e.descripcion ?? null,
                precio:      Number(e.precio || 0),
                activo:      e.activo,
            }))
        );
    } catch (error) {
        console.error("Error fetching examenes img:", error);
        return NextResponse.json({ error: "Error al cargar estudios radiológicos" }, { status: 500 });
    }
}

/* POST /api/imagenologia/examenes — Crear nuevo estudio (Caja/Admin) */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const result = createExamenSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json({ error: "Datos inválidos", details: result.error.format() }, { status: 400 });
        }

        const { nombre, descripcion, precio } = result.data;

        // Check unique
        const existing = await (prisma as any).examenImagenologia.findUnique({
            where: { nombre }
        });
        if (existing) {
            return NextResponse.json({ error: "Ya existe un estudio con este nombre" }, { status: 400 });
        }

        const exam = await (prisma as any).examenImagenologia.create({
            data: {
                nombre,
                descripcion: descripcion || null,
                precio: precio
            }
        });

        return NextResponse.json({ success: true, examenId: exam.examenId.toString() }, { status: 201 });
    } catch (error) {
        console.error("Error creating examen img:", error);
        return NextResponse.json({ error: "Error de servidor al guardar estudio" }, { status: 500 });
    }
}
