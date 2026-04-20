import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma/client";
import { JWTService } from "@/infrastructure/services/JWTService";

// @ts-ignore
BigInt.prototype.toJSON = function () { return this.toString() };

/* ─────────────────────────────────────────────────────────
   GET  /api/emergency/[id]/solicitud-img
   Returns all imaging requests linked to this emergency
───────────────────────────────────────────────────────── */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const emergencia = await (prisma as any).emergencia.findUnique({
            where: { emergenciaId: BigInt(id) },
            select: { citaId: true },
        });

        if (!emergencia?.citaId) {
            return NextResponse.json([]);
        }

        const solicitudes = await (prisma as any).solicitudImagenologia.findMany({
            where: { citaId: emergencia.citaId },
            include: {
                solicitante: {
                    select: { email: true, empleado: { select: { nombres: true, apellidos: true } } },
                },
                detalles: {
                    include: { examen: { select: { nombre: true } } },
                },
            },
            orderBy: { fechaSolicitud: "desc" },
        });

        return NextResponse.json(
            solicitudes.map((s: any) => ({
                solicitudImgId:  s.solicitudImgId.toString(),
                estadoSolicitud: s.estadoSolicitud,
                fechaSolicitud:  s.fechaSolicitud,
                observaciones:   s.observaciones,
                solicitante:     s.solicitante?.empleado
                    ? `${s.solicitante.empleado.nombres} ${s.solicitante.empleado.apellidos}`
                    : s.solicitante?.email || "—",
                examenes: s.detalles.map((d: any) => ({
                    detalleImgId: d.detalleImgId.toString(),
                    nombre:       d.examen.nombre,
                })),
            }))
        );
    } catch (error) {
        console.error("Error fetching img solicitudes:", error);
        return NextResponse.json({ error: "Error al cargar solicitudes de imagenología" }, { status: 500 });
    }
}

/* ─────────────────────────────────────────────────────────
   POST /api/emergency/[id]/solicitud-img
   Body: { examenIds: string[], observaciones?: string }
   Creates SolicitudImagenologia + details + Charge
───────────────────────────────────────────────────────── */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const token = req.cookies.get("auth-token")?.value;
        if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        const payload = await JWTService.verifyToken(token);
        if (!payload) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

        const rawUserId = payload.userId ?? payload.sub;
        if (!rawUserId) return NextResponse.json({ error: "Token inválido: sin userId" }, { status: 401 });
        const usuarioId = BigInt(rawUserId);
        const { examenIds, observaciones } = await req.json();

        if (!examenIds || !Array.isArray(examenIds) || examenIds.length === 0) {
            return NextResponse.json({ error: "Debes seleccionar al menos un estudio" }, { status: 400 });
        }

        const emergencia = await (prisma as any).emergencia.findUnique({
            where: { emergenciaId: BigInt(id) },
            select: { citaId: true },
        });

        if (!emergencia?.citaId) {
            return NextResponse.json({ error: "Esta emergencia no tiene una cita médica asociada" }, { status: 409 });
        }

        const solicitud = await (prisma as any).$transaction(async (tx: any) => {
            // 1. Create request
            const sol = await tx.solicitudImagenologia.create({
                data: {
                    citaId:         emergencia.citaId,
                    usuarioSolicita: usuarioId,
                    estadoSolicitud: "PENDIENTE",
                    observaciones:   observaciones || null,
                    detalles: {
                        create: examenIds.map((eid: string) => ({
                            examenId: BigInt(eid),
                        })),
                    },
                },
            });

            return sol;
        });

        return NextResponse.json({ success: true, solicitudImgId: solicitud.solicitudImgId.toString() }, { status: 201 });
    } catch (error) {
        console.error("Error creating img solicitud:", error);
        return NextResponse.json({ error: "Error al crear solicitud de imagenología" }, { status: 500 });
    }
}
