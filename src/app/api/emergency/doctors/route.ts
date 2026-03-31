import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma/client";

// @ts-ignore
BigInt.prototype.toJSON = function () { return this.toString() };

/**
 * GET /api/emergency/doctors
 * Returns all active doctors with their names and specialty for the
 * emergency doctor assignment dropdown.
 */
export async function GET(_req: NextRequest) {
    try {
        const medicos = await prisma.medico.findMany({
            where: { activo: true },
            include: {
                empleado: { select: { nombres: true, apellidos: true } },
                especialidad: { select: { nombre: true } },
            },
            orderBy: {
                empleado: { apellidos: "asc" }
            }
        });

        const formatted = medicos.map((m: any) => ({
            empleadoId: m.empleadoId.toString(),
            nombre: `${m.empleado.nombres} ${m.empleado.apellidos}`,
            especialidad: m.especialidad?.nombre || "—",
        }));

        return NextResponse.json(formatted);
    } catch (error) {
        console.error("Error fetching doctors for emergency:", error);
        return NextResponse.json({ error: "Error al cargar médicos" }, { status: 500 });
    }
}
