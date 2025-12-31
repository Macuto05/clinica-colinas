import { prisma } from "@/infrastructure/database/prisma/client";
import { LowStockClientTable } from "@/components/inventory/LowStockClientTable"; // We will create this
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function LowStockPage() {
    // Fetch all stocks that have a configured minimum (> 0)
    // We filter "Low Stock" in memory to reliably compare fields (Prisma limitations)
    const allConfiguredStocks = await prisma.stock.findMany({
        // Remove 'where' constraint on stockMinimo to avoid "Unknown argument" error if client is stale
        // We will filter everything in memory.
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
        },
        orderBy: {
            insumo: {
                nombre: 'asc'
            }
        }
    });

    // Filter: Current Quantity <= Minimum Stock
    const lowStocks = allConfiguredStocks.filter(s =>
        Number(s.cantidadActual) <= Number(s.stockMinimo)
    );

    const formattedStocks = lowStocks.map(s => ({
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

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link
                    href="/almacen"
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-900 dark:hover:bg-zinc-800 dark:hover:text-white"
                >
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Alerta de Stock Bajo</h1>
                    <p className="text-gray-500">
                        Insumos que han alcanzado su nivel mínimo por almacén.
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 dark:bg-zinc-900 dark:border-zinc-800 overflow-hidden">
                <LowStockClientTable initialData={formattedStocks} />
            </div>
        </div>
    );
}
