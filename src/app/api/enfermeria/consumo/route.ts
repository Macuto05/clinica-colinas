import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/infrastructure/database/prisma/client";
import { JWTService } from "@/infrastructure/services/JWTService";

// @ts-ignore
BigInt.prototype.toJSON = function () { return this.toString() };

const consumoSchema = z.object({
    citaId:   z.string().min(1),
    insumos: z.array(z.object({
        insumoId:  z.string().min(1),
        cantidad:  z.number().positive(),
    })).min(1, "Debes agregar al menos un insumo"),
    observaciones: z.string().optional().nullable(),
});

/**
 * POST /api/enfermeria/consumo
 * Registers supply consumption for a hospitalized patient's emergency.
 * Creates a SolicitudInsumo (DESPACHADA) + SolicitudInsumoDetalle records.
 * Also creates a MovimientoInventario (SALIDA) to reduce stock.
 */
export async function POST(req: NextRequest) {
    try {
        const token = req.cookies.get("auth-token")?.value;
        if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        const payload = await JWTService.verifyToken(token);
        if (!payload) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

        const body   = await req.json();
        const result = consumoSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json({ error: "Datos invÃ¡lidos", details: result.error.format() }, { status: 400 });
        }

        const { citaId, insumos, observaciones } = result.data;
        const citaIdBig  = BigInt(citaId);
        const rawUserId = payload.userId ?? payload.sub;
        if (!rawUserId) return NextResponse.json({ error: "Token inválido: sin userId" }, { status: 401 });
        const usuarioId = BigInt(rawUserId);

        // Verify cita exists
        const cita = await prisma.citaMedica.findUnique({ where: { citaId: citaIdBig } });
        if (!cita) return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 });

        // Find a "Farmacia" or first available almacen from which to deduct stock
        const almacen = await (prisma as any).almacen.findFirst({
            where: {
                activo: true,
                nombre: { contains: "farmacia", mode: "insensitive" },
            },
        }) || await (prisma as any).almacen.findFirst({ where: { activo: true } });

        if (!almacen) return NextResponse.json({ error: "No hay almacÃ©n disponible" }, { status: 400 });

        await (prisma as any).$transaction(async (tx: any) => {
            // Lookup if this cita belongs to an emergencia (for cargo linkage)
            const emergenciaLink = await tx.emergencia.findUnique({
                where: { citaId: citaIdBig },
                select: { emergenciaId: true }
            }).catch(() => null);

            // 1. Create SolicitudInsumo
            const solicitud = await tx.solicitudInsumo.create({
                data: {
                    citaId:         citaIdBig,
                    usuarioSolicita: usuarioId,
                    estadoSolicitud: "DESPACHADA",
                    usuarioResponde: usuarioId,
                    fechaRespuesta:  new Date(),
                    observaciones:   observaciones || "Consumo registrado por EnfermerÃ­a",
                    detalles: {
                        create: insumos.map(i => ({
                            insumoId:          BigInt(i.insumoId),
                            cantidadSolicitada: i.cantidad,
                            cantidadAprobada:   i.cantidad,
                        })),
                    },
                },
            });

            // 2. Create MovimientoInventario (SALIDA) â cantidades siempre positivas
            const movimiento = await tx.movimientoInventario.create({
                data: {
                    almacenId:        almacen.almacenId,
                    tipoMovimiento:   "SALIDA",
                    usuarioId:        usuarioId,
                    solicitudInsumoId: solicitud.solicitudInsumoId,
                    referencia:       `ENF-CONSUMO-${citaId}`,
                    observaciones:    observaciones || null,
                    detalles: {
                        create: insumos.map(i => ({
                            insumoId: BigInt(i.insumoId),
                            cantidad: i.cantidad, // Positivo: la direcciÃ³n la indica tipoMovimiento
                        })),
                    },
                },
            });

            // 3. Update stock (deduct from almacen)
            for (const ins of insumos) {
                const insBig = BigInt(ins.insumoId);
                await tx.stock.updateMany({
                    where: { almacenId: almacen.almacenId, insumoId: insBig },
                    data: { cantidadActual: { decrement: ins.cantidad } },
                });
            }

            // 4. Create CargoCuentaPaciente for each consumed supply
            for (const ins of insumos) {
                await tx.cargoCuentaPaciente.create({
                    data: {
                        emergenciaId:     emergenciaLink?.emergenciaId || null,
                        citaId:           citaIdBig,
                        tipoCargo:        'INSUMO',
                        referenciaId:     BigInt(ins.insumoId),
                        cantidad:         ins.cantidad,
                        movimientoId:     movimiento.movimientoId,
                        usuarioGenerador: usuarioId,
                        observaciones:    'Consumo directo por EnfermerÃ­a',
                        estadoCobro:      'PENDIENTE',
                    },
                });
            }
        });

        return NextResponse.json({ success: true, message: "Consumo registrado correctamente" });
    } catch (error) {
        console.error("Error registering consumo:", error);
        return NextResponse.json({ error: "Error al registrar consumo" }, { status: 500 });
    }
}
