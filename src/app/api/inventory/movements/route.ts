import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma/client";


// GET: List Inventory Movements (Kardex)
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const almacenId = searchParams.get("almacenId");
        const tipo = searchParams.get("tipo");
        const insumoId = searchParams.get("insumoId");
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");
        const limit = parseInt(searchParams.get("limit") || "50");

        const where: any = {};

        if (almacenId) where.almacenId = BigInt(almacenId);
        if (tipo) where.tipoMovimiento = tipo;
        if (insumoId) {
            // Filter by specific insumo (needs join on details)
            where.detalles = { some: { insumoId: BigInt(insumoId) } };
        }

        // Date Range
        if (startDate || endDate) {
            where.fechaMovimiento = {};
            if (startDate) where.fechaMovimiento.gte = new Date(startDate);
            if (endDate) where.fechaMovimiento.lte = new Date(endDate);
        }

        const movimientos = await prisma.movimientoInventario.findMany({
            where,
            include: {
                almacen: { select: { nombre: true } },
                usuario: {
                    select: {
                        email: true,
                        empleado: {
                            select: {
                                nombres: true,
                                apellidos: true,
                                empleadoId: true
                            }
                        }
                    }
                },
                detalles: {
                    include: {
                        insumo: { select: { nombre: true, codigo: true, unidadMedida: true } },
                        lote: { select: { codigo: true, fechaVencimiento: true } }
                    }
                },
                pedidoCompra: { select: { pedidoId: true } }
            },
            orderBy: { fechaMovimiento: 'desc' },
            take: limit
        });

        // Transform BigInt to string
        const serialized = JSON.stringify(movimientos, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        );

        return new NextResponse(serialized, { status: 200, headers: { "Content-Type": "application/json" } });

    } catch (error) {
        console.error("Error fetching movements:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}

// POST: Create Inventory Movements
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { tipo, pedidoId, items, usuarioId, motivo, almacenDestinoId } = body;

        // Validation
        if (!tipo || !items || !Array.isArray(items) || items.length === 0 || !usuarioId) {
            return NextResponse.json({ error: "Datos incompletos (tipo, items, usuarioId)" }, { status: 400 });
        }

        // Group items by Warehouse (Almacen)
        const itemsByWarehouse: Record<string, any[]> = {};

        items.forEach((item: any) => {
            if (!item.almacenId) return;
            if (!itemsByWarehouse[item.almacenId]) {
                itemsByWarehouse[item.almacenId] = [];
            }
            itemsByWarehouse[item.almacenId].push(item);
        });

        // Use transaction to ensure data integrity
        await prisma.$transaction(async (tx) => {
            // Iterate over each warehouse group and create a movement
            for (const almacenIdStr in itemsByWarehouse) {
                const warehouseItems = itemsByWarehouse[almacenIdStr];
                const almacenId = BigInt(almacenIdStr);

                // Determine Prefix and Sequence
                let referencia = "";

                if (pedidoId) {
                    referencia = `PED-${pedidoId}`;
                } else {
                    let prefix = "MOV";
                    if (tipo === 'TRASLADO') prefix = "TRF";
                    else if (tipo === 'SALIDA') prefix = "SAL";
                    else if (tipo === 'ENTRADA') prefix = "ENT";
                    else if (tipo === 'AJUSTE') prefix = "AJU";

                    // Count existing references with this prefix to determine next number
                    const count = await tx.movimientoInventario.count({
                        where: {
                            referencia: {
                                startsWith: `${prefix}-`
                            }
                        }
                    });

                    referencia = `${prefix}-${count + 1}`;
                }

                // 1. Create Header for Source Warehouse
                const movimientoSource = await tx.movimientoInventario.create({
                    data: {
                        almacenId: almacenId,
                        tipoMovimiento: tipo,
                        fechaMovimiento: new Date(),
                        usuarioId: BigInt(usuarioId),
                        pedidoCompraId: pedidoId ? BigInt(pedidoId) : null,
                        observaciones: pedidoId
                            ? `Recepción de pedido #${pedidoId}`
                            : (tipo === 'TRASLADO' && almacenDestinoId
                                ? `Traslado hacia Almacén #${almacenDestinoId}`
                                : motivo || `Movimiento ${tipo}`),
                        referencia: referencia
                    }
                });

                // Prepare Header for Destination (only if TRASLADO and Destination exists)
                let movimientoDest: any = null;
                if (tipo === 'TRASLADO' && almacenDestinoId) {
                    movimientoDest = await tx.movimientoInventario.create({
                        data: {
                            almacenId: BigInt(almacenDestinoId),
                            tipoMovimiento: 'ENTRADA', // Logic: Transfer IN to destination is an ENTRY
                            fechaMovimiento: new Date(),
                            usuarioId: BigInt(usuarioId),
                            observaciones: `Traslado desde Almacén #${almacenId}`,
                            referencia: referencia // Shared Reference (e.g. TRF-5)
                        }
                    });
                }

                // 2. Process Details & Update Stock
                for (const item of warehouseItems) {
                    const insumoId = BigInt(item.insumoId);
                    const cantidadSolicitada = Number(item.cantidad);

                    // LOGIC A: ENTRADA (Standard or from external source)
                    if (tipo === 'ENTRADA') {
                        let loteId: bigint | null = null;
                        if (item.loteCodigo) {
                            const { loteCodigo, fechaVencimiento, fechaFabricacion } = item;
                            const lote = await tx.lote.upsert({
                                where: { uq_lote_insumo: { insumoId, codigo: loteCodigo } },
                                update: {},
                                create: {
                                    insumoId, codigo: loteCodigo,
                                    fechaVencimiento: fechaVencimiento ? new Date(fechaVencimiento) : null,
                                    fechaFabricacion: fechaFabricacion ? new Date(fechaFabricacion) : null,
                                    activo: true
                                }
                            });
                            loteId = lote.loteId;

                            // Update StockLote
                            const existingStockLote = await tx.stockLote.findUnique({
                                where: { uq_stock_lote: { almacenId, loteId } }
                            });
                            if (existingStockLote) {
                                await tx.stockLote.update({
                                    where: { stockLoteId: existingStockLote.stockLoteId },
                                    data: { cantidadActual: Number(existingStockLote.cantidadActual) + cantidadSolicitada }
                                });
                            } else {
                                await tx.stockLote.create({
                                    data: { almacenId, loteId, cantidadActual: cantidadSolicitada }
                                });
                            }
                        }

                        // Detail
                        await tx.movimientoDetalle.create({
                            data: { movimientoId: movimientoSource.movimientoId, insumoId, cantidad: cantidadSolicitada, loteId }
                        });

                        // Update Total Stock
                        const existingStock = await tx.stock.findUnique({ where: { uq_stock: { almacenId, insumoId } } });
                        if (existingStock) {
                            await tx.stock.update({
                                where: { stockId: existingStock.stockId },
                                data: { cantidadActual: Number(existingStock.cantidadActual) + cantidadSolicitada, actualizadoEn: new Date() }
                            });
                        } else {
                            await tx.stock.create({
                                data: { almacenId, insumoId, cantidadActual: cantidadSolicitada }
                            });
                        }
                    }

                    // LOGIC B: SALIDA / TRASLADO (Auto-Deduction FEFO/FIFO)
                    else if (tipo === 'SALIDA' || tipo === 'TRASLADO' || tipo === 'AJUSTE') {
                        let remainingQty = cantidadSolicitada;

                        // If specific lote provided in request, use strictly that (Manual Override)
                        if (item.loteId || item.loteCodigo) {
                            // Implementation for specific lot (Simplified: assumed verified by frontend for now, or add fetching logic)
                            // For this iteration, we focus on the AUTO logic requested.
                            // If explicit lot is needed, we would query it directly.
                            // Falling back to Auto Logic if no specific ID is properly passed, 
                            // but usually Transfer Request will just send Item + Qty for Auto.
                        }

                        // FEFO/FIFO Query
                        // Find batches with stock > 0
                        const availableBatches = await tx.stockLote.findMany({
                            where: {
                                almacenId: almacenId,
                                lote: {
                                    insumoId: insumoId,
                                    activo: true
                                },
                                cantidadActual: { gt: 0 }
                            },
                            include: { lote: true },
                            orderBy: [
                                { lote: { fechaVencimiento: 'asc' } }, // FEFO
                                { lote: { loteId: 'asc' } } // FIFO (oldest ID)
                            ]
                        });

                        const totalAvailable = availableBatches.reduce((sum, b) => sum + Number(b.cantidadActual), 0);
                        if (totalAvailable < cantidadSolicitada) {
                            throw new Error(`Stock insuficiente para insumo ${insumoId} en almacén ${almacenId}. Solicitado: ${cantidadSolicitada}, Disponible: ${totalAvailable}`);
                        }

                        // Distribute deduction
                        for (const batch of availableBatches) {
                            if (remainingQty <= 0) break;

                            const currentBatchQty = Number(batch.cantidadActual);
                            const takeFromBatch = Math.min(currentBatchQty, remainingQty);

                            // 1. Deduct from Source Batch
                            await tx.stockLote.update({
                                where: { stockLoteId: batch.stockLoteId },
                                data: { cantidadActual: currentBatchQty - takeFromBatch }
                            });

                            // 2. Create Detail for Source Movement
                            await tx.movimientoDetalle.create({
                                data: {
                                    movimientoId: movimientoSource.movimientoId,
                                    insumoId: insumoId,
                                    cantidad: takeFromBatch,
                                    loteId: batch.loteId
                                }
                            });

                            // 3. IF TRASLADO: Add to Destination
                            if (tipo === 'TRASLADO' && movimientoDest) {
                                // Add to Destination StockLote (Same Lote ID, preserving expiry)
                                const destStockLote = await tx.stockLote.findUnique({
                                    where: { uq_stock_lote: { almacenId: BigInt(almacenDestinoId), loteId: batch.loteId } }
                                });

                                if (destStockLote) {
                                    await tx.stockLote.update({
                                        where: { stockLoteId: destStockLote.stockLoteId },
                                        data: { cantidadActual: Number(destStockLote.cantidadActual) + takeFromBatch }
                                    });
                                } else {
                                    await tx.stockLote.create({
                                        data: {
                                            almacenId: BigInt(almacenDestinoId),
                                            loteId: batch.loteId,
                                            cantidadActual: takeFromBatch
                                        }
                                    });
                                }

                                // Create Detail for Destination Movement
                                await tx.movimientoDetalle.create({
                                    data: {
                                        movimientoId: movimientoDest.movimientoId,
                                        insumoId: insumoId,
                                        cantidad: takeFromBatch,
                                        loteId: batch.loteId
                                    }
                                });
                            }

                            // CHECK: Auto-Deactivate Lote if Global Stock is 0 OR Expired
                            // We do this after potential Transfer addition to ensure global count is accurate.
                            const globalStock = await tx.stockLote.aggregate({
                                where: { loteId: batch.loteId },
                                _sum: { cantidadActual: true }
                            });
                            const totalRemaining = Number(globalStock._sum.cantidadActual || 0);
                            const isExpired = batch.lote.fechaVencimiento ? new Date() > new Date(batch.lote.fechaVencimiento) : false;

                            if (totalRemaining <= 0) {
                                // Case 1: Just clean up empty batch
                                await tx.lote.update({
                                    where: { loteId: batch.loteId },
                                    data: { activo: false }
                                });
                            } else if (isExpired) {
                                // Case 2: Batch has stock BUT is expired. 
                                // Action: Annul stock (Write-off) so Global Stock reflects reality.

                                // 1. Find where this expired stock is located
                                const expiredStockLocations = await tx.stockLote.findMany({
                                    where: { loteId: batch.loteId, cantidadActual: { gt: 0 } }
                                });

                                for (const sl of expiredStockLocations) {
                                    const qtyToWriteOff = Number(sl.cantidadActual);

                                    // A. Deduct from Global Stock (Stock table)
                                    const st = await tx.stock.findUnique({
                                        where: { uq_stock: { almacenId: sl.almacenId, insumoId: insumoId } }
                                    });
                                    if (st) {
                                        await tx.stock.update({
                                            where: { stockId: st.stockId },
                                            data: { cantidadActual: Number(st.cantidadActual) - qtyToWriteOff, actualizadoEn: new Date() }
                                        });
                                    }

                                    // B. Zero out the Batch Stock (StockLote table)
                                    await tx.stockLote.update({
                                        where: { stockLoteId: sl.stockLoteId },
                                        data: { cantidadActual: 0 }
                                    });
                                }

                                // 2. Finally, deactivate the Lote
                                await tx.lote.update({
                                    where: { loteId: batch.loteId },
                                    data: { activo: false }
                                });
                            }

                            remainingQty -= takeFromBatch;
                        }

                        // Update Total Stock Source
                        const stockSource = await tx.stock.findUnique({ where: { uq_stock: { almacenId, insumoId } } });
                        if (stockSource) {
                            await tx.stock.update({
                                where: { stockId: stockSource.stockId },
                                data: { cantidadActual: Number(stockSource.cantidadActual) - cantidadSolicitada, actualizadoEn: new Date() }
                            });
                        }

                        // Update Total Stock Destination (If Transfer)
                        if (tipo === 'TRASLADO' && almacenDestinoId) {
                            const stockDest = await tx.stock.findUnique({ where: { uq_stock: { almacenId: BigInt(almacenDestinoId), insumoId } } });
                            if (stockDest) {
                                await tx.stock.update({
                                    where: { stockId: stockDest.stockId },
                                    data: { cantidadActual: Number(stockDest.cantidadActual) + cantidadSolicitada, actualizadoEn: new Date() }
                                });
                            } else {
                                await tx.stock.create({
                                    data: { almacenId: BigInt(almacenDestinoId), insumoId, cantidadActual: cantidadSolicitada }
                                });
                            }
                        }
                    }
                } // End item loop

                // 3. Mark Order as Dispatch/Completed
                if (pedidoId && tipo === 'ENTRADA') {
                    await tx.pedidoCompra.update({
                        where: { pedidoId: BigInt(pedidoId) },
                        data: { estado: 'DESPACHADO' }
                    });
                }
            }
        }, {
            maxWait: 5000,
            timeout: 20000
        });

        return NextResponse.json({ success: true, message: "Movimientos registrados correctamente" });

    } catch (error: any) {
        console.error("Error creating movements:", error);
        return NextResponse.json({
            error: error.message || "Error interno al procesar movimientos",
            stack: error.stack
        }, { status: 500 });
    }
}
