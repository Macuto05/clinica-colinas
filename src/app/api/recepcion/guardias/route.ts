import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma/client";

// @ts-ignore
BigInt.prototype.toJSON = function () { return this.toString() };

/**
 * GET /api/recepcion/guardias?semana=2026-06-30
 * Devuelve todas las guardias de los 7 días de la semana indicada (lunes base).
 */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const semanaParam = searchParams.get("semana");

    if (!semanaParam) {
        return NextResponse.json({ error: "Parámetro 'semana' requerido" }, { status: 400 });
    }

    const lunes = new Date(semanaParam + "T00:00:00Z");
    const domingo = new Date(lunes);
    domingo.setUTCDate(lunes.getUTCDate() + 6);

    try {
        const guardias = await prisma.guardiaEmergencia.findMany({
            where: { fecha: { gte: lunes, lte: domingo } },
            include: {
                medico: {
                    include: {
                        empleado: { select: { nombres: true, apellidos: true } },
                        especialidad: { select: { nombre: true } },
                    },
                },
            },
            orderBy: [{ fecha: "asc" }, { turno: "asc" }],
        });

        return NextResponse.json(guardias.map((g: any) => ({
            guardiaId: g.guardiaId.toString(),
            medicoId: g.medicoId.toString(),
            fecha: g.fecha.toISOString().split("T")[0],
            turno: g.turno,
            medico: {
                nombre: `${g.medico.empleado.nombres} ${g.medico.empleado.apellidos}`,
                especialidad: g.medico.especialidad?.nombre ?? "—",
            },
        })));
    } catch (error) {
        console.error("Error al obtener guardias:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}

/**
 * POST /api/recepcion/guardias
 * Agrega un médico a un turno/fecha. Ignora si ya está asignado.
 * Body: { fecha: "YYYY-MM-DD", turno: "MAÑANA"|"NOCHE", medicoId: string, creadoPor: string }
 */
export async function POST(req: NextRequest) {
    try {
        const { fecha, turno, medicoId, creadoPor } = await req.json();

        if (!fecha || !turno || !medicoId) {
            return NextResponse.json({ error: "fecha, turno y medicoId son requeridos" }, { status: 400 });
        }

        const fechaDate = new Date(fecha + "T00:00:00Z");

        const guardia = await prisma.guardiaEmergencia.upsert({
            where: { fecha_turno_medicoId: { fecha: fechaDate, turno, medicoId: BigInt(medicoId) } },
            update: {},
            create: {
                fecha: fechaDate,
                turno,
                medicoId: BigInt(medicoId),
                creadoPor: BigInt(creadoPor ?? 1),
            },
        });

        return NextResponse.json({ ok: true, guardiaId: guardia.guardiaId.toString() });
    } catch (error) {
        console.error("Error al agregar guardia:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}

/**
 * DELETE /api/recepcion/guardias?id=123
 * Elimina una guardia específica por su ID.
 */
export async function DELETE(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
        return NextResponse.json({ error: "Parámetro 'id' requerido" }, { status: 400 });
    }

    try {
        await prisma.guardiaEmergencia.delete({ where: { guardiaId: BigInt(id) } });
        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Error al eliminar guardia:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}