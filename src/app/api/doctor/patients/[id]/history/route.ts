
import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma/client";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const patientId = id;
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("userId");

        if (!patientId || isNaN(Number(patientId))) {
            return NextResponse.json([]);
        }

        let whereClause: any = {
            pacienteId: BigInt(patientId),
            estadoCita: 'ATENDIDA'
        };

        // If Doctor User ID is provided, filter by that doctor
        if (userId && userId !== "undefined" && userId !== "null" && !isNaN(Number(userId))) {
            const doctor = await prisma.medico.findFirst({
                where: { empleado: { usuarioId: BigInt(userId) } }
            });
        }



        const history = await prisma.citaMedica.findMany({
            where: whereClause,
            include: {
                medico: {
                    include: { empleado: { include: { usuario: true } } } // To get Doctor Name
                },
                diagnostico: true,
                receta: {
                    include: { detalles: true }
                }
            },
            orderBy: {
                fechaCita: 'desc'
            }
        });



        // Format BigInts and structure


        const formatted = history.map(h => ({
            id: h.citaId.toString(),
            fecha: h.fechaCita.toISOString(),
            motivo: h.motivoConsulta,
            doctor: h.medico.empleado.nombres + " " + h.medico.empleado.apellidos,
            diagnostico: h.diagnostico ? {
                descripcion: h.diagnostico.descripcion,
                tipo: h.diagnostico.tipo,
                notas: h.diagnostico.notas
            } : null,
            receta: h.receta ? {
                fecha: h.receta.fecha.toISOString(),
                detalles: h.receta.detalles.map(d => ({
                    medicamento: d.medicamento,
                    dosis: d.dosis,
                    frecuencia: d.frecuencia,
                    duracion: d.duracion
                }))
            } : null
        }));

        return NextResponse.json(formatted);

    } catch (error) {
        return NextResponse.json({ error: String(error), stack: error instanceof Error ? error.stack : undefined }, { status: 500 });
    }
}
