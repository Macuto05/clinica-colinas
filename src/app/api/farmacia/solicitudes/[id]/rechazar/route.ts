import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma/client";
import { JWTService } from "@/infrastructure/services/JWTService";

// @ts-ignore
BigInt.prototype.toJSON = function () { return this.toString() };

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const token = req.cookies.get("auth-token")?.value;
        if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        const payload = await JWTService.verifyToken(token);
        if (!payload) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

        const rawUserId = payload.userId ?? payload.sub;
        if (!rawUserId) return NextResponse.json({ error: "Token inválido: sin userId" }, { status: 401 });
        const usuarioId = BigInt(rawUserId);
        const { id: solicitudId } = await params;
        const { motivo } = await req.json();

        if (!motivo) return NextResponse.json({ error: "El motivo del rechazo es obligatorio" }, { status: 400 });

        // 1. Fetch Solicitud and validate status
        const solicitud = await (prisma as any).solicitudInsumo.findUnique({
            where: { solicitudInsumoId: BigInt(solicitudId) }
        });

        if (!solicitud) return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 });
        if (solicitud.estadoSolicitud !== "PENDIENTE" && solicitud.estadoSolicitud !== "PROCESANDO") {
            return NextResponse.json({ error: `No se puede rechazar una solicitud en estado ${solicitud.estadoSolicitud}` }, { status: 409 });
        }

        // 2. Transacción para actualizar estado y registrar respuesta
        const updated = await (prisma as any).solicitudInsumo.update({
            where: { solicitudInsumoId: BigInt(solicitudId) },
            data: {
                estadoSolicitud: 'RECHAZADA',
                observaciones: motivo,
                usuarioResponde: usuarioId,
                fechaRespuesta:  new Date()
            }
        });

        return NextResponse.json({ success: true, solicitudId: updated.solicitudInsumoId.toString() });

    } catch (error) {
        console.error("Error rechazando solicitud de farmacia:", error);
        return NextResponse.json({ 
            error: error instanceof Error ? error.message : "Error interno al procesar el rechazo" 
        }, { status: 500 });
    }
}
