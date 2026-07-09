import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma/client";

// @ts-ignore
BigInt.prototype.toJSON = function () { return this.toString() };

/**
 * GET /api/recepcion/guardias?semana=2026-06-30
 * Devuelve las 14 guardias (7 días × 2 turnos) de la semana indicada.
 * `semana` debe ser el lunes de la semana en formato YYYY-MM-DD.
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
            where: {
                fecha: { gte: lunes, lte: domingo },
            },
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

        const formatted = guardias.map((g: any) => ({
            guardiaId: g.guardiaId.toString(),
            medicoId: g.medicoId.toString(),
            fecha: g.fecha.toISOString().split("T")[0],
            turno: g.turno,
            medico: {
                nombre: `${g.medico.empleado.nombres} ${g.medico.empleado.apellidos}`,
                especialidad: g.medico.especialidad?.nombre ?? "—",
            },
        }));

        return NextResponse.json(formatted);
    } catch (error) {
        console.error("Error al obtener guardias:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}

/**
 * PUT /api/recepcion/guardias
 * Asigna o elimina el médico de guardia para un turno/fecha específico.
 * Body: { fecha: "YYYY-MM-DD", turno: "MAÑANA"|"NOCHE", medicoId: string | null }
 * Si medicoId es null elimina la guardia de ese slot.
 */
export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const { fecha, turno, medicoId, creadoPor } = body;

        if (!fecha || !turno) {
            return NextResponse.json({ error: "fecha y turno son requeridos" }, { status: 400 });
        }

        const fechaDate = new Date(fecha + "T00:00:00Z");

        if (!medicoId) {
            // Eliminar guardia si existe
            await prisma.guardiaEmergencia.deleteMany({
                where: { fecha: fechaDate, turno },
            });
            return NextResponse.json({ ok: true, accion: "eliminada" });
        }

        const guardia = await prisma.guardiaEmergencia.upsert({
            where: { fecha_turno: { fecha: fechaDate, turno } },
            update: { medicoId: BigInt(medicoId), creadoPor: BigInt(creadoPor ?? 1) },
            create: {
                fecha: fechaDate,
                turno,
                medicoId: BigInt(medicoId),
                creadoPor: BigInt(creadoPor ?? 1),
            },
        });

        return NextResponse.json({ ok: true, guardiaId: guardia.guardiaId.toString() });
    } catch (error) {
        console.error("Error al guardar guardia:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}