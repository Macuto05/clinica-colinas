import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma/client";

// @ts-ignore
BigInt.prototype.toJSON = function () { return this.toString() };

/**
 * Determina el turno activo según la hora UTC actual.
 * MAÑANA: 07:00–19:00 (hora Venezuela = UTC-4, entonces 11:00–23:00 UTC)
 * NOCHE:  19:00–07:00
 */
function getTurnoActual(): "MAÑANA" | "NOCHE" {
    const horaVE = new Date().toLocaleString("en-US", { timeZone: "America/Caracas", hour: "numeric", hour12: false });
    const hora = parseInt(horaVE, 10);
    return hora >= 7 && hora < 19 ? "MAÑANA" : "NOCHE";
}

/**
 * GET /api/emergency/doctors
 * Devuelve el médico de guardia para el turno actual.
 * Si no hay guardia configurada hoy, devuelve todos los médicos activos como fallback.
 */
export async function GET(_req: NextRequest) {
    try {
        const turno = getTurnoActual();
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        const guardia = await prisma.guardiaEmergencia.findUnique({
            where: { fecha_turno: { fecha: hoy, turno } },
            include: {
                medico: {
                    include: {
                        empleado: { select: { nombres: true, apellidos: true } },
                        especialidad: { select: { nombre: true } },
                    },
                },
            },
        });

        if (guardia) {
            return NextResponse.json([{
                empleadoId: guardia.medicoId.toString(),
                nombre: `${guardia.medico.empleado.nombres} ${guardia.medico.empleado.apellidos}`,
                especialidad: guardia.medico.especialidad?.nombre ?? "—",
                turno,
                esGuardia: true,
            }]);
        }

        // Fallback: sin guardia configurada → retorna todos los activos
        const medicos = await prisma.medico.findMany({
            where: { activo: true },
            include: {
                empleado: { select: { nombres: true, apellidos: true } },
                especialidad: { select: { nombre: true } },
            },
            orderBy: { empleado: { apellidos: "asc" } },
        });

        return NextResponse.json(
            medicos.map((m: any) => ({
                empleadoId: m.empleadoId.toString(),
                nombre: `${m.empleado.nombres} ${m.empleado.apellidos}`,
                especialidad: m.especialidad?.nombre ?? "—",
                esGuardia: false,
            }))
        );
    } catch (error) {
        console.error("Error fetching doctors for emergency:", error);
        return NextResponse.json({ error: "Error al cargar médicos" }, { status: 500 });
    }
}