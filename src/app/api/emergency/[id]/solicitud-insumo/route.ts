import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma/client";
import { JWTService } from "@/infrastructure/services/JWTService";

// @ts-ignore
BigInt.prototype.toJSON = function () { return this.toString() };

/* ─────────────────────────────────────────────────────────
   GET  /api/emergency/[id]/solicitud-insumo
   Returns all supply requests (insumos) linked to this emergency's cita
───────────────────────────────────────────────────────── */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        // Get the emergency's cita_id first
        const emergencia = await (prisma as any).emergencia.findUnique({
            where: { emergenciaId: BigInt(id) },
            select: { citaId: true },
        });

        if (!emergencia?.citaId) {
            return NextResponse.json([]);
        }

        const solicitudes = await (prisma as any).solicitudInsumo.findMany({
            where: { citaId: emergencia.citaId },
            include: {
                solicitante: {
                    select: { email: true, empleado: { select: { nombres: true, apellidos: true } } },
                },
                detalles: {
                    include: { insumo: { select: { nombre: true, unidadMedida: true } } },
                },
            },
            orderBy: { fechaSolicitud: "desc" },
        });

        return NextResponse.json(
            solicitudes.map((s: any) => ({
                solicitudInsumoId: s.solicitudInsumoId.toString(),
                estadoSolicitud:   s.estadoSolicitud,
                fechaSolicitud:    s.fechaSolicitud,
                solicitante:       s.solicitante?.empleado
                    ? `${s.solicitante.empleado.nombres} ${s.solicitante.empleado.apellidos}`
                    : s.solicitante?.email || "—",
                insumos: s.detalles.map((d: any) => ({
                    solicitudDetalleId: d.solicitudDetalleId.toString(),
                    nombre:             d.insumo.nombre,
                    unidad:             d.insumo.unidadMedida,
                    cantidad:           parseFloat(d.cantidadSolicitada.toString()),
                })),
            }))
        );
    } catch (error) {
        console.error("Error fetching insumo solicitudes:", error);
        return NextResponse.json({ error: "Error al cargar solicitudes de farmacia" }, { status: 500 });
    }
}

/* ─────────────────────────────────────────────────────────
   POST /api/emergency/[id]/solicitud-insumo
   Body: { insumos: { insumoId: string, cantidad: string | number }[] }
   Creates SolicitudInsumo + details linked to cita_id
───────────────────────────────────────────────────────── */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const token = req.cookies.get("auth-token")?.value;
        if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        const payload = await JWTService.verifyToken(token);
        if (!payload) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

        const rawUserId = payload.userId ?? payload.sub;
        if (!rawUserId) return NextResponse.json({ error: "Token inválido: sin userId" }, { status: 401 });
        const usuarioId = BigInt(rawUserId);
        const { insumos } = await req.json();

        if (!insumos || !Array.isArray(insumos) || insumos.length === 0) {
            return NextResponse.json({ error: "Debes añadir al menos un insumo a la solicitud" }, { status: 400 });
        }

        const { id } = await params;

        // Get the emergency's cita_id
        const emergencia = await (prisma as any).emergencia.findUnique({
            where: { emergenciaId: BigInt(id) },
            select: { citaId: true },
        });

        if (!emergencia?.citaId) {
            return NextResponse.json({ error: "Esta emergencia no tiene una cita médica asociada" }, { status: 409 });
        }

        const solicitud = await (prisma as any).solicitudInsumo.create({
            data: {
                citaId:         emergencia.citaId,
                usuarioSolicita: usuarioId,
                estadoSolicitud: "PENDIENTE",
                detalles: {
                    create: insumos.map((i: any) => ({
                        insumoId:           BigInt(i.insumoId),
                        cantidadSolicitada: parseFloat(i.cantidad.toString()),
                    })),
                },
            },
        });

        return NextResponse.json({ success: true, solicitudInsumoId: solicitud.solicitudInsumoId.toString() }, { status: 201 });
    } catch (error) {
        console.error("Error creating insumo solicitud:", error);
        return NextResponse.json({ error: "Error al crear solicitud a farmacia" }, { status: 500 });
    }
}
