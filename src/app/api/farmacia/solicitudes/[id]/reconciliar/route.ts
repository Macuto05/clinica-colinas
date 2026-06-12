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
        const { lines } = await req.json(); // { solicitudDetalleId, consumedQty }[]

        // 1. Fetch Solicitud and its dispatch context
        const solicitud = await (prisma as any).solicitudInsumo.findUnique({
            where: { solicitudInsumoId: BigInt(solicitudId) },
            include: {
                detalles: true,
                cita: {
                    select: { citaId: true, emergencia: { select: { emergenciaId: true } } }
                }
            }
        });

        if (!solicitud) return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 });
        if (solicitud.estadoSolicitud !== "APROBADA") {
            return NextResponse.json({ error: "La solicitud debe estar en estado 'APROBADA' (En Piso) para ser reconciliada" }, { status: 400 });
        }

        // Find the dispatch movement to know which lots were used
        const dispatchMovement = await (prisma as any).movimientoInventario.findFirst({
            where: { solicitudInsumoId: solicitud.solicitudInsumoId, tipoMovimiento: 'SALIDA' },
            include: { detalles: true }
        });

        if (!dispatchMovement) {
            return NextResponse.json({ error: "No se encontró el movimiento de despacho original para esta solicitud" }, { status: 404 });
        }

        const result = await prisma.$transaction(async (tx) => {
            const returnDetails = [];
            const patientCargos = [];

            for (const line of lines) {
                const detId = BigInt(line.solicitudDetalleId);
                const originalDet = solicitud.detalles.find((d: any) => d.solicitudDetalleId === detId);
                if (!originalDet) continue;

                const approvedQty = parseFloat(originalDet.cantidadAprobada?.toString() || "0");
                const consumedQty = Math.max(0, Math.min(approvedQty, parseFloat(line.consumedQty.toString())));
                const toReturn = Math.max(0, approvedQty - consumedQty);

                // A. Create Charge for patient
                if (consumedQty > 0) {
                    patientCargos.push({
                        citaId:           solicitud.citaId,
                        emergenciaId:     solicitud.cita?.emergencia?.emergenciaId,
                        tipoCargo:        'INSUMO',
                        referenciaId:     originalDet.insumoId,
                        cantidad:         Math.ceil(consumedQty),
                        usuarioGenerador: usuarioId,
                        observaciones:    `Consumo Farmacia (Reconciliación) - Solicitud #${solicitudId}`,
                        movimientoId:     dispatchMovement.movimientoId
                    });
                }

                // B. Handle Stock Return if any
                if (toReturn > 0) {
                    // We return to the lots that were originally taken
                    const usedInsumoMovements = dispatchMovement.detalles.filter((md: any) => md.insumoId === originalDet.insumoId);
                    let remainingToReturn = toReturn;

                    for (const um of usedInsumoMovements) {
                        if (remainingToReturn <= 0) break;
                        
                        const tookAmount = parseFloat(um.cantidad.toString());
                        const returnToThisLote = Math.min(tookAmount, remainingToReturn);

                        // Global Stock return
                        const stock = await (tx as any).stock.findUnique({
                            where: { uq_stock: { almacenId: dispatchMovement.almacenId, insumoId: um.insumoId } }
                        });
                        if (stock) {
                            await (tx as any).stock.update({
                                where: { stockId: stock.stockId },
                                data: { cantidadActual: parseFloat(stock.cantidadActual.toString()) + returnToThisLote }
                            });
                        }

                        // Lote Stock return
                        if (um.loteId) {
                            const stockLote = await (tx as any).stockLote.findUnique({
                                where: { uq_stock_lote: { almacenId: dispatchMovement.almacenId, loteId: um.loteId } }
                            });
                            if (stockLote) {
                                await (tx as any).stockLote.update({
                                    where: { stockLoteId: stockLote.stockLoteId },
                                    data: { cantidadActual: parseFloat(stockLote.cantidadActual.toString()) + returnToThisLote }
                                });
                            }
                        }

                        returnDetails.push({
                            insumoId: um.insumoId,
                            loteId:   um.loteId,
                            cantidad: returnToThisLote
                        });

                        remainingToReturn -= returnToThisLote;
                    }
                }
            }

            // Create Return Movement if needed
            if (returnDetails.length > 0) {
                await (tx as any).movimientoInventario.create({
                    data: {
                        almacenId:         dispatchMovement.almacenId,
                        tipoMovimiento:    'ENTRADA',
                        usuarioId:         usuarioId,
                        solicitudInsumoId: solicitud.solicitudInsumoId,
                        referencia:        `REC-EMG #${solicitudId}`,
                        observaciones:     `Reingreso Sobrante (Reconciliación) - Solicitud #${solicitudId}`,
                        detalles: {
                            create: returnDetails
                        }
                    }
                });
            }

            // Create Charges
            for (const cargo of patientCargos) {
                await (tx as any).cargoCuentaPaciente.create({
                    data: cargo
                });
            }

            // Update Solicitud final state
            await (tx as any).solicitudInsumo.update({
                where: { solicitudInsumoId: solicitud.solicitudInsumoId },
                data: {
                    estadoSolicitud: 'DESPACHADA', // Finalized
                    fechaRespuesta:  new Date(), // Set as finalized date
                    usuarioResponde: usuarioId
                }
            });

            return { chargesCreated: patientCargos.length, returnedItems: returnDetails.length };
        });

        return NextResponse.json({ success: true, ...result });

    } catch (error) {
        console.error("Error reconciliando insumos:", error);
        return NextResponse.json({ 
            error: error instanceof Error ? error.message : "Error interno al procesar la reconciliación" 
        }, { status: 500 });
    }
}
