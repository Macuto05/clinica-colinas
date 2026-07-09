import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma/client";

// @ts-ignore
BigInt.prototype.toJSON = function () { return this.toString() };

function getTurnoActual(): "MAÑANA" | "NOCHE" {
    const horaVE = new Date().toLocaleString("en-US", { timeZone: "America/Caracas", hour: "numeric", hour12: false });
    const hora = parseInt(horaVE, 10);
    return hora >= 7 && hora < 19 ? "MAÑANA" : "NOCHE";
}

/**
 * GET /api/emergency/doctors
 * - ?todos=true  → todos los médicos activos (para gestión de guardias)
 * - sin params   → médicos de guardia del turno actual; fallback a todos si no hay guardia
 */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const todos = searchParams.get("todos") === "true";

    try {
        if (todos) {
            const medicos = await prisma.medico.findMany({
                where: { activo: true },
                include: {
                    empleado: { select: { nombres: true, apellidos: true } },
                    especialidad: { select: { nombre: true } },
                },
                orderBy: { empleado: { apellidos: "asc" } },
            });

            return NextResponse.json(medicos.map((m: any) => ({
                empleadoId: m.empleadoId.toString(),
                nombre: `${m.empleado.nombres} ${m.empleado.apellidos}`,
                especialidad: m.especialidad?.nombre ?? "—",
                esGuardia: false,
            })));
        }

        // Filtrar por turno activo
        const turno = getTurnoActual();
        const hoy = new Date();
        hoy.setUTCHours(0, 0, 0, 0);

        const guardias = await prisma.guardiaEmergencia.findMany({
            where: { fecha: hoy, turno },
            include: {
                medico: {
                    include: {
                        empleado: { select: { nombres: true, apellidos: true } },
                        especialidad: { select: { nombre: true } },
                    },
                },
            },
        });

        if (guardias.length > 0) {
            return NextResponse.json(guardias.map((g: any) => ({
                empleadoId: g.medicoId.toString(),
                nombre: `${g.medico.empleado.nombres} ${g.medico.empleado.apellidos}`,
                especialidad: g.medico.especialidad?.nombre ?? "—",
                turno,
                esGuardia: true,
            })));
        }

        // Fallback: sin guardia configurada → todos los activos
        const medicos = await prisma.medico.findMany({
            where: { activo: true },
            include: {
                empleado: { select: { nombres: true, apellidos: true } },
                especialidad: { select: { nombre: true } },
            },
            orderBy: { empleado: { apellidos: "asc" } },
        });

        return NextResponse.json(medicos.map((m: any) => ({
            empleadoId: m.empleadoId.toString(),
            nombre: `${m.empleado.nombres} ${m.empleado.apellidos}`,
            especialidad: m.especialidad?.nombre ?? "—",
            esGuardia: false,
        })));
    } catch (error) {
        console.error("Error fetching doctors for emergency:", error);
        return NextResponse.json({ error: "Error al cargar médicos" }, { status: 500 });
    }
}