import { cookies } from "next/headers";
import { prisma } from "@/infrastructure/database/prisma/client";
import { JWTService } from "@/infrastructure/services/JWTService";
import { PrismaUserRepository } from "@/infrastructure/database/prisma/repositories/PrismaUserRepository";
import { DashboardCards } from "@/components/inventory/DashboardCards";

export default async function AlmacenDashboard() {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;

    // Auth check (redundant if layout protects it, but safe for fetching user data)
    let user = null;
    if (token) {
        const payload = await JWTService.verifyToken(token);
        if (payload) {
            const userRepository = new PrismaUserRepository();
            user = await userRepository.findByEmail(payload.email);
        }
    }

    const firstName = user?.firstName?.split(" ")[0] || "";
    const lastName = user?.lastName?.split(" ")[0] || "";
    const displayName = `${firstName} ${lastName}`.trim() || user?.name || "Usuario";

    // --- Stats Calculation ---
    // 1. Total Insumos
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

    // 3. Stock Bajo (Per Warehouse Limit)
    // We fetch all stocks to filter in memory, bypassing Prisma "unknown field" validation if client is stale
    const allStocks = await prisma.stock.findMany({
        include: {
            insumo: {
                select: {
                    insumoId: true,
                    nombre: true,
                    codigo: true,
                    unidadMedida: true
                }
            },
            almacen: {
                select: {
                    almacenId: true,
                    nombre: true
                }
            }
        }
    });

    // Filter in memory. We cast to 'any' to access stockMinimo if TS complains it doesn't exist.
    const lowStockItems = allStocks
        .filter(s => {
            const min = Number((s as any).stockMinimo) || 0;
            return min > 0 && Number(s.cantidadActual) <= min;
        })
        .map(s => ({
            stockId: s.stockId.toString(),
            insumoId: s.insumoId.toString(),
            almacenId: s.almacenId.toString(),
            insumoNombre: s.insumo.nombre,
            insumoCodigo: s.insumo.codigo,
            unidad: s.insumo.unidadMedida,
            almacenNombre: s.almacen.nombre,
            cantidadActual: Number(s.cantidadActual),
            stockMinimo: Number((s as any).stockMinimo) || 0
        }));

    const stockBajo = lowStockItems.length;

    // 4. Pedidos Pendientes (Waiting for Approval)
    const pendingApprovalCount = await prisma.pedidoCompra.count({
        where: { estado: "PENDIENTE" }
    });

    // 5. Pedidos por Recibir (Approved)
    const pendingReceptionCount = await prisma.pedidoCompra.count({
        where: { estado: "APROBADO" }
    });

    // 6. Lotes Vencidos (Expired - Urgent!)
    const today = new Date();
    // Reset time to start of day for accurate comparison (optional, but safer)
    today.setHours(0, 0, 0, 0);

    const expiredStockLotes = await prisma.stockLote.findMany({
        where: {
            cantidadActual: { gt: 0 },
            lote: {
                fechaVencimiento: {
                    lt: today // Strictly less than start of today
                },
                activo: true
            }
        },
        include: {
            lote: { include: { insumo: true } },
            almacen: true
        },
        orderBy: { lote: { fechaVencimiento: 'asc' } }
    });

    // 7. Lotes Por Vencer (Next 90 Days)
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setDate(threeMonthsFromNow.getDate() + 90);

    const expiringStockLotes = await prisma.stockLote.findMany({
        where: {
            cantidadActual: { gt: 0 },
            lote: {
                fechaVencimiento: {
                    gte: today, // From today onwards
                    lte: threeMonthsFromNow
                },
                activo: true
            }
        },
        include: {
            lote: { include: { insumo: true } },
            almacen: true
        },
        orderBy: { lote: { fechaVencimiento: 'asc' } }
    });

    const formatBatch = (sl: any) => ({
        stockLoteId: sl.stockLoteId.toString(),
        loteId: sl.loteId.toString(),
        cantidad: Number(sl.cantidadActual),
        fechaVencimiento: sl.lote.fechaVencimiento,
        codigo: sl.lote.codigo,
        insumoId: sl.lote.insumoId.toString(),
        insumo: {
            nombre: sl.lote.insumo.nombre,
            codigo: sl.lote.insumo.codigo,
            unidadMedida: sl.lote.insumo.unidadMedida
        },
        almacen: {
            almacenId: sl.almacenId.toString(),
            nombre: sl.almacen.nombre
        }
    });

    const expiredBatches = expiredStockLotes.map(formatBatch);
    const expiringBatches = expiringStockLotes.map(formatBatch);

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 dark:bg-zinc-900 dark:border-zinc-800">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Bienvenido, {displayName}
                </h1>
                <p className="text-gray-500 mt-1">
                    Panel de resumen y gestión general del inventario.
                </p>
            </div>

            <DashboardCards
                totalInsumos={totalInsumos}
                movimientosHoy={movimientosHoy}
                stockBajoCount={stockBajo}
                lowStockItems={lowStockItems}
                pendingApprovalCount={pendingApprovalCount}
                pendingReceptionCount={pendingReceptionCount}
                expiringCount={expiringBatches.length}
                expiringBatches={expiringBatches}
                expiredCount={expiredBatches.length}
                expiredBatches={expiredBatches}
            />

        </div>
    );
}
