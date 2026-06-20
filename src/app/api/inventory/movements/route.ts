import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma/client";
import { logAuditoria } from "@/infrastructure/services/AuditService";


// GET: List Inventory Movements (Kardex)
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const almacenId = searchParams.get("almacenId");
        const tipo = searchParams.get("tipo");
        const motivo = searchParams.get("motivo");
        const insumoId = searchParams.get("insumoId");
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");
        const limit = parseInt(searchParams.get("limit") || "50");

        const where: any = {};

        if (almacenId) where.almacenId = BigInt(almacenId);
        if (tipo) where.tipoMovimiento = tipo;
        if (motivo) where.observaciones = motivo;
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
        const { tipo, pedidoId, items, usuarioId, motivo, almacenDestinoId, observaciones: obsCustom } = body;

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
                            : obsCustom || (tipo === 'TRASLADO' && almacenDestinoId
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
                            observaciones: obsCustom || `Traslado desde Almacén #${almacenId}`,
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

                    // LOGIC B: SALIDA / TRASLADO / AJUSTE (Deduction)
                    else if (tipo === 'SALIDA' || tipo === 'TRASLADO' || tipo === 'AJUSTE') {
                        let remainingQty = cantidadSolicitada;
                        const targetLoteId = item.loteId ? BigInt(item.loteId) : null;

                        // Scenario 1: Specific Lot Requested (Manual Selection / Write-off)
                        if (targetLoteId) {
                            const specificBatch = await tx.stockLote.findUnique({
                                where: { uq_stock_lote: { almacenId, loteId: targetLoteId } },
                                include: { lote: true }
                            });

                            if (!specificBatch) {
                                throw new Error(`El lote seleccionado no existe en este almacén.`);
                            }

                            if (Number(specificBatch.cantidadActual) < cantidadSolicitada) {
                                throw new Error(`Stock insuficiente en el lote ${specificBatch.lote.codigo}. Disponible: ${specificBatch.cantidadActual}`);
                            }

                            // Strict Expiration Check
                            const isExpired = specificBatch.lote.fechaVencimiento ? new Date() > new Date(specificBatch.lote.fechaVencimiento) : false;

                            // BLOCK if expired AND not an Adjustment (Write-off)
                            if (isExpired && tipo !== 'AJUSTE') {
                                throw new Error(`BLOQUEO: El lote ${specificBatch.lote.codigo} está vencido. No se puede vender ni trasladar. Use 'AJUSTE' para darlo de baja.`);
                            }

                            // Deduct from Specific Batch
                            await tx.stockLote.update({
                                where: { stockLoteId: specificBatch.stockLoteId },
                                data: { cantidadActual: Number(specificBatch.cantidadActual) - cantidadSolicitada }
                            });

                            // Create Detail
                            await tx.movimientoDetalle.create({
                                data: {
                                    movimientoId: movimientoSource.movimientoId,
                                    insumoId: insumoId,
                                    cantidad: cantidadSolicitada,
                                    loteId: targetLoteId
                                }
                            });

                            remainingQty = 0; // Fulfilled
                        }

                        // Scenario 2: Auto-Pick (FEFO) - ONLY Valid Lots
                        else {
                            // Find batches with stock > 0 AND NOT EXPIRED
                            const availableBatches = await tx.stockLote.findMany({
                                where: {
                                    almacenId: almacenId,
                                    lote: {
                                        insumoId: insumoId,
                                        activo: true,
                                        // CRITICAL: Filter out expired lots for auto-assignment
                                        OR: [
                                            { fechaVencimiento: null },
                                            { fechaVencimiento: { gte: new Date() } }
                                        ]
                                    },
                                    cantidadActual: { gt: 0 }
                                },
                                include: { lote: true },
                                orderBy: [
                                    { lote: { fechaVencimiento: 'asc' } }, // FEFO
                                    { lote: { loteId: 'asc' } }
                                ]
                            });

                            const totalAvailable = availableBatches.reduce((sum, b) => sum + Number(b.cantidadActual), 0);

                            if (totalAvailable < cantidadSolicitada) {
                                // Double check if we have *expired* stock that causes confusion
                                const totalIncludingExpired = await tx.stockLote.aggregate({
                                    where: { almacenId, lote: { insumoId }, cantidadActual: { gt: 0 } },
                                    _sum: { cantidadActual: true }
                                });
                                const realTotal = Number(totalIncludingExpired._sum.cantidadActual || 0);

                                if (realTotal >= cantidadSolicitada) {
                                    throw new Error(`Stock insuficiente de lotes VIGENTES. Hay ${realTotal} unidades en total, pero solo ${totalAvailable} están aptas para venta (el resto venció).`);
                                }
                                throw new Error(`Stock insuficiente para insumo ${insumoId}. Solicitado: ${cantidadSolicitada}, Disponible: ${totalAvailable}`);
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
                                    // Add to Destination StockLote
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

                                remainingQty -= takeFromBatch;
                            }
                        }

                        // Update Total Stock Source (Always happens regardless of specific vs auto)
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

                        // Cleanup: Check for empty/expired batches to mark inactive (Optimization)
                        // Triggered asynchronously or periodically in a real system, but we can do a quick check if needed.
                        // For now, the strict filter handles the immediate safety.
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

        const tipoDescMap: Record<string, string> = {
            ENTRADA: 'Entrada de mercancía',
            SALIDA: 'Salida de inventario',
            TRASLADO: 'Traslado entre almacenes',
            AJUSTE: 'Ajuste de inventario',
        };
        logAuditoria({
            usuarioId: usuarioId,
            nombreUsuario: String(usuarioId),
            rolUsuario: 'ALMACEN',
            modulo: 'ALMACEN',
            accion: `MOVIMIENTO_${tipo}`,
            descripcion: `${tipoDescMap[tipo] || tipo}: ${items.length} ítem(s)${pedidoId ? ` — Pedido #${pedidoId}` : ''}`,
            severidad: tipo === 'AJUSTE' ? 'WARNING' : 'INFO',
            entidadTipo: 'MovimientoInventario',
            metadatos: { tipo, cantidadItems: items.length, pedidoId, almacenDestinoId, motivo },
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
