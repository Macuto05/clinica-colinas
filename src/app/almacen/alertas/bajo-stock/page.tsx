import { prisma } from "@/infrastructure/database/prisma/client";
import { LowStockClientTable } from "@/components/inventory/LowStockClientTable";
import { ArrowLeft, AlertCircle } from "lucide-react";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function LowStockPage() {
    const allConfiguredStocks = await prisma.stock.findMany({
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
        <div className="space-y-8 pb-20">
            <div className="bg-white/40 backdrop-blur-md border border-white/50 rounded-3xl p-8 shadow-[0_4px_16px_0_rgba(0,0,0,0.02)] flex flex-col md:flex-row items-center gap-6">
                <Link
                    href="/almacen"
                    className="p-4 bg-white/50 hover:bg-white rounded-2xl border border-white transition-all shadow-sm active:scale-90 group"
                >
                    <ArrowLeft size={20} className="text-gray-400 group-hover:text-gray-900" />
                </Link>
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-rose-500/10 rounded-xl">
                            <AlertCircle className="text-rose-600" size={24} />
                        </div>
                        Alerta de Stock Bajo
                    </h1>
                    <p className="text-gray-500 text-sm font-medium mt-1 italic leading-relaxed">Insumos que han alcanzado su nivel crítico de existencia por almacén.</p>
                </div>
            </div>

            <div className="bg-white/40 backdrop-blur-md rounded-[2.5rem] border border-white/50 overflow-hidden shadow-[0_8px_32px_0_rgba(0,0,0,0.03)] min-h-[400px]">
                <LowStockClientTable initialData={formattedStocks} />
            </div>
        </div>
    );
}
