
import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma/client";
import { calculateAge, formatTimeAMPM } from "@/lib/utils";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json({ error: "ID de cita requerido" }, { status: 400 });
        }

        const app = await prisma.citaMedica.findUnique({
            where: { citaId: BigInt(id) },
            include: {
                paciente: true,
                diagnostico: true,
                receta: {
                    include: { detalles: true }
                },
                ordenEstudio: {
                    include: { detalles: true }
                }
            }
        });

        if (!app) {
            return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 });
        }

        // Format Response
        const formatted = {
            id: app.citaId.toString(),
            paciente: {
                id: app.paciente.pacienteId.toString(),
                nombre: `${app.paciente.nombres} ${app.paciente.apellidos}`,
                documento: app.paciente.documentoIdentidad,
                edad: app.paciente.fechaNacimiento ? calculateAge(new Date(app.paciente.fechaNacimiento)) : 'N/A'
            },
            hora: formatTimeAMPM(app.horaInicio),
            motivo: app.motivoConsulta,
            estado: app.estadoCita,
            tipo: app.tipoCita,
            yaAtendida: !!app.diagnostico,
            diagnostico: app.diagnostico ? {
                ...app.diagnostico,
                diagnosticoId: app.diagnostico.diagnosticoId.toString(),
                citaId: app.diagnostico.citaId.toString(),
                usuarioId: app.diagnostico.usuarioId.toString(),
            } : null,
            receta: app.receta ? {
                ...app.receta,
                recetaId: app.receta.recetaId.toString(),
                citaId: app.receta.citaId.toString(),
                detalles: app.receta.detalles.map(d => ({
                    ...d,
                    detalleId: d.detalleId.toString(),
                    recetaId: d.recetaId.toString()
                }))
            } : null,
            ordenes: app.ordenEstudio
                ? app.ordenEstudio.detalles.map(d => ({
                    id: d.detalleId.toString(),
                    estudio: d.estudio,
                    tipo: d.tipo,
                }))
                : []
        };

        return NextResponse.json(formatted);

    } catch (error) {
        console.error("Error fetching appointment detail:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}

