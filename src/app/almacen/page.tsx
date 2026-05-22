import { cookies } from "next/headers";
import { prisma } from "@/infrastructure/database/prisma/client";
import { JWTService } from "@/infrastructure/services/JWTService";
import { PrismaUserRepository } from "@/infrastructure/database/prisma/repositories/PrismaUserRepository";
import { DashboardCards } from "@/components/inventory/DashboardCards";

export default async function AlmacenDashboard() {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;

    // Verificación de autenticación (redundante si el layout lo protege, pero seguro para obtener datos del usuario)
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

    // --- Cálculo de estadísticas ---
    // 1. Total de insumos
    const totalInsumos = await prisma.insumo.count({
        where: { activo: true }
    });

    // 2. Movimientos hoy
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

    // 3. Stock bajo (por límite de almacén)
    // Obtener todos los stocks para filtrar en memoria, evitando validación de "campo desconocido" en Prisma
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

    // Filtrar en memoria. Cast a 'any' para acceder a stockMinimo si TS lo rechaza.
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

    // 4. Pedidos pendientes (esperando aprobación)
    const pendingApprovalCount = await prisma.pedidoCompra.count({
        where: { estado: "PENDIENTE" }
    });

    // 5. Pedidos por recibir (aprobados)
    const pendingReceptionCount = await prisma.pedidoCompra.count({
        where: { estado: "APROBADO" }
    });

    // 6. Lotes vencidos (¡urgente!)
    const today = new Date();
    // Resetear hora al inicio del día para comparación precisa
    today.setHours(0, 0, 0, 0);

    const expiredStockLotes = await prisma.stockLote.findMany({
        where: {
            cantidadActual: { gt: 0 },
            lote: {
                fechaVencimiento: {
                    lt: today // Estrictamente menor que el inicio de hoy
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

    // 7. Lotes por vencer (próximos 90 días)
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setDate(threeMonthsFromNow.getDate() + 90);

    const expiringStockLotes = await prisma.stockLote.findMany({
        where: {
            cantidadActual: { gt: 0 },
            lote: {
                fechaVencimiento: {
                    gte: today, // A partir de hoy
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
            <div className="bg-white/40 backdrop-blur-md border border-white/50 rounded-3xl p-8 shadow-[0_4px_16px_0_rgba(0,0,0,0.02)] relative overflow-hidden group">
                {/* Decorative background element */}
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-lime-500/10 rounded-full blur-3xl transition-all duration-700 group-hover:bg-lime-500/20" />
                
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                    Bienvenido, <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600">{displayName}</span>
                </h1>
                <p className="text-gray-500 font-medium mt-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-lime-500 animate-pulse" />
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
