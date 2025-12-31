import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma/client";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ insumoId: string }> } // Params is a Promise in Next.js 15+
) {
    try {
        const { insumoId: idStr } = await params;
        const insumoId = BigInt(idStr);

        // Fetch StockLote entries for this supply
        // We need to group them by Almacen
        // 1. Fetch ALL Stock identifiers (Store + Min Stock) for this Item
        // This ensures even empty stores appear if they have a record
        const stocksGlobal = await prisma.stock.findMany({
            where: { insumoId },
            include: { almacen: { select: { nombre: true, almacenId: true } } }
        });

        // 2. Fetch specific Batches (StockLote)
        const stocksLote = await prisma.stockLote.findMany({
            where: {
                lote: { insumoId, activo: true },
                cantidadActual: { gt: 0 }
            },
            include: {
                lote: {
                    select: {
                        loteId: true, codigo: true, fechaVencimiento: true, fechaFabricacion: true
                    }
                }
            },
            orderBy: { lote: { fechaVencimiento: 'asc' } }
        });

        // 3. Merge Data: Create a list of all Warehouses available (either from global record or active batches)
        // Map by AlmacenId
        const mapa = new Map();

        // Initialize with Global Stock Info
        stocksGlobal.forEach(s => {
            const id = s.almacenId.toString();
            mapa.set(id, {
                almacenId: id,
                almacenNombre: s.almacen.nombre,
                // Total is sum of batches, but we can verify vs s.cantidadActual
                stockMinimo: Number(s.stockMinimo) || 0,
                lotes: []
            });
        });

        // Fill with Lotes
        stocksLote.forEach(sl => {
            const id = sl.almacenId.toString();
            // If store didn't exist in Stock (rare but possible if inconsistent), create entry.
            // (But normally Stock record should exist if StockLote exists)
            // Just in case we fetch details for store not in first query:
            // (Requires fetching name, but sticking to map for now)

            if (mapa.has(id)) {
                const group = mapa.get(id);
                group.lotes.push({
                    loteId: sl.lote.loteId.toString(),
                    codigo: sl.lote.codigo,
                    fechaVencimiento: sl.lote.fechaVencimiento,
                    fechaFabricacion: sl.lote.fechaFabricacion,
                    cantidad: Number(sl.cantidadActual)
                });
            }
        });

        const result = Array.from(mapa.values());

        return NextResponse.json(result);

    } catch (error) {
        console.error("Error fetching stock details:", error);
        return NextResponse.json(
            { error: "Error interno al obtener detalles de stock" },
            { status: 500 }
        );
    }
}
