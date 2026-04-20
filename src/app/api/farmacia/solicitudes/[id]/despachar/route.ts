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
        const { almacenId, lines } = await req.json();

        if (!almacenId) return NextResponse.json({ error: "Debe seleccionar un almacén de origen" }, { status: 400 });

        // 1. Fetch Solicitud and its context
        const solicitud = await (prisma as any).solicitudInsumo.findUnique({
            where: { solicitudInsumoId: BigInt(solicitudId) },
            include: {
                cita: {
                    select: { citaId: true, emergencia: { select: { emergenciaId: true } } }
                }
            }
        });

        if (!solicitud) return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 });
        if (solicitud.estadoSolicitud === "DESPACHADA") {
            return NextResponse.json({ error: "Esta solicitud ya ha sido despachada anteriormente" }, { status: 409 });
        }

        // 2. Start Transaction
        // NOTE: CargoCuentaPaciente is NOT created here — it happens in the Reconciliation step
        // after nursing confirms actual consumption quantities.
        const result = await prisma.$transaction(async (tx) => {
            const movementDetails = [];
            
            // For tracking totalApproved per insumo
            const updatedDetails = [];

            for (const line of lines) {
                const insumoId = BigInt(line.insumoId);
                const requestedQty = parseFloat(line.cantidad.toString());
                let remainingQty = requestedQty;

                if (requestedQty <= 0) continue;

                // A. FEFO: consume from lots first
                const stockLotes = await (tx as any).stockLote.findMany({
                    where: {
                        almacenId: BigInt(almacenId),
                        lote: { insumoId: insumoId },
                        cantidadActual: { gt: 0 }
                    },
                    include: { lote: true },
                    orderBy: [
                        { lote: { fechaVencimiento: 'asc' } },
                        { stockLoteId: 'asc' }
                    ]
                });

                let approvedViaLots = 0;
                for (const sl of stockLotes) {
                    if (remainingQty <= 0) break;
                    const available = parseFloat(sl.cantidadActual.toString());
                    const toTake = Math.min(available, remainingQty);
                    await (tx as any).stockLote.update({
                        where: { stockLoteId: sl.stockLoteId },
                        data: { cantidadActual: available - toTake }
                    });
                    movementDetails.push({ insumoId, loteId: sl.loteId, cantidad: toTake });
                    remainingQty -= toTake;
                    approvedViaLots += toTake;
                }

                // B. Update Stock aggregate for lot-based dispatches
                if (approvedViaLots > 0) {
                    const currentStock = await (tx as any).stock.findUnique({
                        where: { uq_stock: { almacenId: BigInt(almacenId), insumoId } }
                    });
                    if (currentStock) {
                        await (tx as any).stock.update({
                            where: { stockId: currentStock.stockId },
                            data: { cantidadActual: parseFloat(currentStock.cantidadActual.toString()) - approvedViaLots }
                        });
                    }
                }

                // C. Fallback: si no había lotes (o no cubrieron todo), descontar de Stock directo
                if (remainingQty > 0) {
                    const currentStock = await (tx as any).stock.findUnique({
                        where: { uq_stock: { almacenId: BigInt(almacenId), insumoId } }
                    });
                    if (currentStock) {
                        const stockAvailable = parseFloat(currentStock.cantidadActual.toString());
                        const toTake = Math.min(stockAvailable, remainingQty);
                        if (toTake > 0) {
                            await (tx as any).stock.update({
                                where: { stockId: currentStock.stockId },
                                data: { cantidadActual: stockAvailable - toTake }
                            });
                            movementDetails.push({ insumoId, loteId: null, cantidad: toTake });
                            remainingQty -= toTake;
                        }
                    }
                }

                const approvedQty = requestedQty - remainingQty;
                updatedDetails.push({ insumoId, cantidadAprobada: approvedQty });
            }

            if (movementDetails.length === 0) {
                throw new Error("No hay stock disponible para ninguno de los insumos solicitados en este almacén.");
            }

            // 3. Create the Inventory Movement
            const movement = await (tx as any).movimientoInventario.create({
                data: {
                    almacenId:         BigInt(almacenId),
                    tipoMovimiento:    'SALIDA',
                    usuarioId:         usuarioId,
                    solicitudInsumoId: BigInt(solicitudId),
                    referencia:        `DES-EMG #${solicitudId}`,
                    observaciones:     `Despacho a Piso (Pendiente Reconciliación) - Solicitud #${solicitudId}`,
                    detalles: {
                        create: movementDetails
                    }
                }
            });

            // 4. Update Solicitud Details and Status
            // NOTE: Billing (CargoCuentaPaciente) is deferred to the Reconciliation step.
            for (const det of updatedDetails) {
                 await (tx as any).solicitudInsumoDetalle.updateMany({
                     where: {
                         solicitudInsumoId: BigInt(solicitudId),
                         insumoId: det.insumoId
                     },
                     data: {
                         cantidadAprobada: det.cantidadAprobada
                     }
                 });
            }

            const updatedSolicitud = await (tx as any).solicitudInsumo.update({
                where: { solicitudInsumoId: BigInt(solicitudId) },
                data: {
                    estadoSolicitud: 'APROBADA', // Moved to "Approved" (En Piso) but not yet "Despachada" (Finalized/Reconciled)
                    usuarioResponde: usuarioId,
                    fechaRespuesta:  new Date()
                }
            });

            return { movementId: movement.movimientoId.toString(), approvedCount: updatedDetails.length };
        });

        return NextResponse.json({ success: true, ...result });

    } catch (error) {
        console.error("Error despachando insumos:", error);
        return NextResponse.json({ 
            error: error instanceof Error ? error.message : "Error interno al procesar el despacho" 
        }, { status: 500 });
    }
}
