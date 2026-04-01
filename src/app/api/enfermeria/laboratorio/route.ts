import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/infrastructure/database/prisma/client";
import { JWTService } from "@/infrastructure/services/JWTService";

// @ts-ignore
BigInt.prototype.toJSON = function () { return this.toString() };

const labSchema = z.object({
    citaId:        z.string().min(1),
    examenes:      z.array(z.object({ examenId: z.string().min(1) })).min(1),
    observaciones: z.string().optional().nullable(),
});

/**
 * GET  /api/enfermeria/laboratorio  → list all ExamenLaboratorio
 * POST /api/enfermeria/laboratorio  → create SolicitudLaboratorio
 */
export async function GET(_req: NextRequest) {
    try {
        const examenes = await prisma.examenLaboratorio.findMany({
            where:   { activo: true },
            orderBy: { nombre: "asc" },
        });

        return NextResponse.json(
            examenes.map((e: any) => ({
                examenId:   e.examenId.toString(),
                nombre:     e.nombre,
                descripcion: e.descripcion,
            }))
        );
    } catch (error) {
        console.error("Error fetching examenes:", error);
        return NextResponse.json({ error: "Error al cargar exámenes" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const token = req.cookies.get("auth-token")?.value;
        if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        const payload = await JWTService.verifyToken(token);
        if (!payload) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

        const body   = await req.json();
        const result = labSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json({ error: "Datos inválidos", details: result.error.format() }, { status: 400 });
        }

        const { citaId, examenes, observaciones } = result.data;
        const citaIdBig = BigInt(citaId);
        const usuarioId = BigInt((payload as any).userId || (payload as any).sub || 1);

        const cita = await prisma.citaMedica.findUnique({ where: { citaId: citaIdBig } });
        if (!cita) return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 });

        const solicitud = await (prisma as any).solicitudLaboratorio.create({
            data: {
                citaId:         citaIdBig,
                usuarioSolicita: usuarioId,
                estadoSolicitud: "PENDIENTE",
                observaciones:   observaciones || null,
                detalles: {
                    create: examenes.map(e => ({
                        examenId: BigInt(e.examenId),
                    })),
                },
            },
            include: { detalles: true },
        });

        return NextResponse.json({
            success:        true,
            solicitudLabId: solicitud.solicitudLabId.toString(),
        }, { status: 201 });

    } catch (error) {
        console.error("Error creating solicitud laboratorio:", error);
        return NextResponse.json({ error: "Error al registrar solicitud" }, { status: 500 });
    }
}
