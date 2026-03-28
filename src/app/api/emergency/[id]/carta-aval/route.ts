import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/infrastructure/database/prisma/client";
import { JWTService } from "@/infrastructure/services/JWTService";

// @ts-ignore
BigInt.prototype.toJSON = function () { return this.toString() };

const cartaAvalSchema = z.object({
    polizaId: z.string().min(1, "Póliza es requerida"),
    codigoAval: z.string().optional().nullable(),
    montoAprobado: z.number().optional().nullable(),
    estado: z.enum(["SOLICITADA", "APROBADA", "RECHAZADA", "PENDIENTE_PAGO"]).optional(),
    observaciones: z.string().optional().nullable(),
});

// POST — Request or register a carta aval for an emergency
export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const token = req.cookies.get("auth-token")?.value;
        if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        const payload = await JWTService.verifyToken(token);
        if (!payload) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

        const { id } = await context.params;
        const emergenciaId = BigInt(id);

        // Verify emergency exists
        const emergencia = await (prisma as any).emergencia.findUnique({
            where: { emergenciaId }
        });
        if (!emergencia) return NextResponse.json({ error: "Emergencia no encontrada" }, { status: 404 });

        const body = await req.json();
        const result = cartaAvalSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json({ error: "Datos inválidos", details: result.error.format() }, { status: 400 });
        }

        const { polizaId, codigoAval, montoAprobado, estado, observaciones } = result.data;

        const cartaAval = await (prisma as any).cartaAval.create({
            data: {
                polizaId: BigInt(polizaId),
                emergenciaId,
                codigoAval: codigoAval || null,
                montoAprobado: montoAprobado || null,
                estado: estado || 'SOLICITADA',
                observaciones: observaciones || null,
                fechaRespuesta: (estado === 'APROBADA' || estado === 'RECHAZADA') ? new Date() : null,
            }
        });

        // If approved, update emergency payment verification
        if (estado === 'APROBADA') {
            await (prisma as any).emergencia.update({
                where: { emergenciaId },
                data: {
                    verificacionPago: 'CONFIRMADO',
                    tipoPago: 'ASEGURADO'
                }
            });
        }

        return NextResponse.json({
            success: true,
            cartaAvalId: cartaAval.cartaAvalId.toString()
        }, { status: 201 });

    } catch (error) {
        console.error("Error creating carta aval:", error);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}
