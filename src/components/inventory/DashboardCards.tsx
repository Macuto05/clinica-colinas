"use client";

import { useState } from "react";
import Link from "next/link";
import { Package, ArrowLeftRight, AlertTriangle, AlertOctagon } from "lucide-react";
import { LowStockModal } from "./LowStockModal";
import { ExpiringBatchesModal } from "./ExpiringBatchesModal";

interface Props {
    totalInsumos: number;
    movimientosHoy: number;
    stockBajoCount: number;
    lowStockItems: any[];
    pendingApprovalCount: number;
    pendingReceptionCount: number;
    expiringCount: number;
    expiringBatches: any[];
}

export function DashboardCards({
    totalInsumos,
    movimientosHoy,
    stockBajoCount,
    lowStockItems,
    pendingApprovalCount,
    pendingReceptionCount,
    expiringCount,
    expiringBatches
}: Props) {
    const [isLowStockModalOpen, setIsLowStockModalOpen] = useState(false);
    const [isExpiringModalOpen, setIsExpiringModalOpen] = useState(false);

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Total Insumos */}
                <Link href="/almacen/insumos" className="block transition-transform hover:scale-[1.02]">
                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm flex items-center gap-4 cursor-pointer hover:border-lime-500/50 transition-colors">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-lg dark:bg-blue-900/30 dark:text-blue-400">
                            <Package size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Insumos</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalInsumos}</p>
                        </div>
                    </div>
                </Link>

                {/* Movimientos Hoy */}
                <Link href="/almacen/movimientos" className="block transition-transform hover:scale-[1.02]">
                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm flex items-center gap-4 cursor-pointer hover:border-lime-500/50 transition-colors">
                        <div className="p-3 bg-green-100 text-green-600 rounded-lg dark:bg-green-900/30 dark:text-green-400">
                            <ArrowLeftRight size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Movimientos Hoy</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{movimientosHoy}</p>
                        </div>
                    </div>
                </Link>

                {/* Stock Bajo (Clickable -> Open Modal) */}
                <div
                    onClick={() => setIsLowStockModalOpen(true)}
                    className="block transition-transform hover:scale-[1.02] cursor-pointer"
                >
                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm flex items-center gap-4 hover:border-lime-500/50 transition-colors">
                        <div className="p-3 bg-yellow-100 text-yellow-600 rounded-lg dark:bg-yellow-900/30 dark:text-yellow-400">
                            <AlertTriangle size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Stock Bajo</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stockBajoCount}</p>
                        </div>
                    </div>
                </div>

                {/* Lotes por Vencer (New Card) */}
                <div
                    onClick={() => setIsExpiringModalOpen(true)}
                    className="block transition-transform hover:scale-[1.02] cursor-pointer"
                >
                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm flex items-center gap-4 hover:border-lime-500/50 transition-colors">
                        <div className="p-3 bg-red-100 text-red-600 rounded-lg dark:bg-red-900/30 dark:text-red-400">
                            <AlertOctagon size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Lotes por Vencer</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{expiringCount}</p>
                        </div>
                    </div>
                </div>

                {/* Pedidos por Aprobar */}
                <Link href="/almacen/pedidos" className="block transition-transform hover:scale-[1.02]">
                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm flex items-center gap-4 cursor-pointer hover:border-lime-500/50 transition-colors">
                        <div className="p-3 bg-purple-100 text-purple-600 rounded-lg dark:bg-purple-900/30 dark:text-purple-400">
                            <Package size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Por Aprobar</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{pendingApprovalCount}</p>
                        </div>
                    </div>
                </Link>

                {/* Pedidos por Recibir */}
                <Link href="/almacen/pedidos" className="block transition-transform hover:scale-[1.02]">
                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm flex items-center gap-4 cursor-pointer hover:border-lime-500/50 transition-colors">
                        <div className="p-3 bg-indigo-100 text-indigo-600 rounded-lg dark:bg-indigo-900/30 dark:text-indigo-400">
                            <Package size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Por Recibir</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{pendingReceptionCount}</p>
                        </div>
                    </div>
                </Link>
            </div>

            <LowStockModal
                isOpen={isLowStockModalOpen}
                onClose={() => setIsLowStockModalOpen(false)}
                items={lowStockItems}
            />

            <ExpiringBatchesModal
                isOpen={isExpiringModalOpen}
                onClose={() => setIsExpiringModalOpen(false)}
                items={expiringBatches}
            />
        </>
    );
}
