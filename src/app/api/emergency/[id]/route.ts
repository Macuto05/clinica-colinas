import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/infrastructure/database/prisma/client";
import { JWTService } from "@/infrastructure/services/JWTService";

// @ts-ignore
BigInt.prototype.toJSON = function () { return this.toString() };

const updateSchema = z.object({
    estadoEmergencia: z.enum(["EN_ATENCION", "HOSPITALIZADO", "CIRUGIA_URGENTE", "REFERIDO", "ALTA", "ATENDIDO"]).optional(),
    verificacionPago: z.enum(["PENDIENTE", "CONFIRMADO", "SIN_COBERTURA"]).optional(),
    tipoPago: z.enum(["PARTICULAR", "ASEGURADO", "PENDIENTE"]).optional(),
    observaciones: z.string().optional().nullable(),
    nivelUrgencia: z.enum(["CRITICO", "URGENTE", "MODERADO", "LEVE"]).optional(),
    medicoId: z.string().optional().nullable(),
});

// GET — Get emergency detail
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;

        const emergencia = await (prisma as any).emergencia.findUnique({
            where: { emergenciaId: BigInt(id) },
            include: {
                paciente: {
                    include: {
                        polizas: {
                            where: { estado: 'ACTIVA' },
                            include: { aseguradora: true }
                        }
                    }
                },
                medico: {
                    include: {
                        empleado: { select: { nombres: true, apellidos: true } },
                        especialidad: { select: { nombre: true } }
                    }
                },
                cartasAval: {
                    include: {
                        poliza: { include: { aseguradora: true } }
                    },
                    orderBy: { fechaSolicitud: 'desc' }
                },
                cita: {
                    include: {
                        factura: true
                    }
                }
            }
        });

        if (!emergencia) {
            return NextResponse.json({ error: "Emergencia no encontrada" }, { status: 404 });
        }

        // Serialize
        const serialized = JSON.parse(JSON.stringify(emergencia, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        return NextResponse.json(serialized);
    } catch (error) {
        console.error("Error fetching emergency:", error);
        return NextResponse.json({ error: "Error al cargar emergencia" }, { status: 500 });
    }
}

// PUT — Update emergency status
export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const token = req.cookies.get("auth-token")?.value;
        if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        const payload = await JWTService.verifyToken(token);
        if (!payload) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

        const { id } = await context.params;
        const body = await req.json();
        const result = updateSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json({ error: "Datos inválidos", details: result.error.format() }, { status: 400 });
        }

        const data: any = { ...result.data };

        // Convert medicoId string to BigInt if provided
        if (data.medicoId !== undefined) {
            data.medicoId = data.medicoId ? BigInt(data.medicoId) : null;
        }

        // Auto-set fechaAlta when status is ALTA, ATENDIDO or REFERIDO
        if (data.estadoEmergencia === 'ALTA' || data.estadoEmergencia === 'REFERIDO' || data.estadoEmergencia === 'ATENDIDO') {
            data.fechaAlta = new Date();
        }

        const updated = await (prisma as any).emergencia.update({
            where: { emergenciaId: BigInt(id) },
            data
        });

        return NextResponse.json({
            success: true,
            emergenciaId: updated.emergenciaId.toString()
        });

    } catch (error: any) {
        if (error.code === 'P2025') return NextResponse.json({ error: "Emergencia no encontrada" }, { status: 404 });
        console.error("Error updating emergency:", error);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}
