import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma/client";

export async function GET() {
    try {
        // 1. Total Insumos Activos
        const totalInsumos = await prisma.insumo.count({
            where: { activo: true }
        });

        // 2. Movimientos Hoy
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const movimientosHoy = await prisma.movimientoInventario.count({
            where: {
                fechaMovimiento: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            }
        });

        // 3. Stock Bajo (requires calculating global stock per insumo)
        // Fetch inputs with their stock in all warehouses
        const insumos = await prisma.insumo.findMany({
            where: { activo: true },
            select: {
                stock: {
                    select: {
                        cantidadActual: true,
                        stockMinimo: true
                    }
                }
            }
        });

        let stockBajoCount = 0;

        insumos.forEach(insumo => {
            const totalStock = insumo.stock.reduce((sum, s) => sum + Number(s.cantidadActual), 0);
            const totalMinimo = insumo.stock.reduce((sum, s) => sum + Number(s.stockMinimo), 0);
            if (insumo.stock.length > 0 && totalStock <= totalMinimo) {
                stockBajoCount++;
            }
        });

        return NextResponse.json({
            totalInsumos,
            movimientosHoy,
            stockBajo: stockBajoCount
        });

    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        return NextResponse.json(
            { error: "Error al obtener estadísticas" },
            { status: 500 }
        );
    }
}
