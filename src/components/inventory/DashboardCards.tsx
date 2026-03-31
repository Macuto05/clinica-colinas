"use client";

import { useState } from "react";
import Link from "next/link";
import { Package, ArrowLeftRight, AlertTriangle, AlertOctagon, Boxes, ClipboardList, CheckCircle2 } from "lucide-react";
import { LowStockModal } from "./LowStockModal";
import { ExpiringBatchesModal } from "./ExpiringBatchesModal";
import { cn } from "@/lib/utils";

interface Props {
    totalInsumos: number;
    movimientosHoy: number;
    stockBajoCount: number;
    lowStockItems: any[];
    pendingApprovalCount: number;
    pendingReceptionCount: number;
    expiringCount: number;
    expiringBatches: any[];
    expiredCount: number;
    expiredBatches: any[];
}

export function DashboardCards({
    totalInsumos,
    movimientosHoy,
    stockBajoCount,
    lowStockItems,
    pendingApprovalCount,
    pendingReceptionCount,
    expiringCount,
    expiringBatches,
    expiredCount,
    expiredBatches
}: Props) {
    const [isLowStockModalOpen, setIsLowStockModalOpen] = useState(false);
    const [isExpiringModalOpen, setIsExpiringModalOpen] = useState(false);
    const [isExpiredModalOpen, setIsExpiredModalOpen] = useState(false);

    const cardClass = "relative overflow-hidden bg-white/40 backdrop-blur-md border border-white/50 rounded-3xl p-6 shadow-[0_4px_16px_0_rgba(0,0,0,0.02)] transition-all duration-300 hover:scale-[1.02] hover:bg-white/60 hover:shadow-xl group cursor-pointer";

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Total Insumos */}
                <Link href="/almacen/insumos">
                    <div className={cardClass}>
                        <div className="flex items-center gap-4">
                            <div className="p-4 bg-blue-500/10 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform">
                                <Boxes size={28} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Insumos</p>
                                <p className="text-3xl font-black text-gray-900">{totalInsumos}</p>
                            </div>
                        </div>
                        <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Boxes size={100} />
                        </div>
                    </div>
                </Link>

                {/* Movimientos Hoy */}
                <Link href="/almacen/movimientos">
                    <div className={cardClass}>
                        <div className="flex items-center gap-4">
                            <div className="p-4 bg-lime-500/10 text-lime-600 rounded-2xl group-hover:scale-110 transition-transform">
                                <ArrowLeftRight size={28} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Movimientos Hoy</p>
                                <p className="text-3xl font-black text-gray-900">{movimientosHoy}</p>
                            </div>
                        </div>
                        <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <ArrowLeftRight size={100} />
                        </div>
                    </div>
                </Link>

                {/* Lotes VENCIDOS (Critical) */}
                <div onClick={() => setIsExpiredModalOpen(true)} className={cn(cardClass, "border-red-200/50")}>
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            "p-4 rounded-2xl group-hover:scale-110 transition-transform shadow-lg shadow-red-500/10",
                            expiredCount > 0 ? "bg-red-500 text-white animate-pulse" : "bg-gray-100/50 text-gray-400"
                        )}>
                            <AlertOctagon size={28} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Lotes Vencidos</p>
                            <p className={cn("text-3xl font-black", expiredCount > 0 ? "text-red-600" : "text-gray-900")}>
                                {expiredCount}
                            </p>
                        </div>
                    </div>
                    <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity text-red-600">
                        <AlertOctagon size={100} />
                    </div>
                </div>

                {/* Stock Bajo */}
                <div onClick={() => setIsLowStockModalOpen(true)} className={cn(cardClass, "border-yellow-200/50 shadow-yellow-500/5")}>
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            "p-4 rounded-2xl group-hover:scale-110 transition-transform",
                            stockBajoCount > 0 ? "bg-yellow-500/20 text-yellow-700 shadow-sm shadow-yellow-200" : "bg-gray-100/50 text-gray-400"
                        )}>
                            <AlertTriangle size={28} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Stock Bajo</p>
                            <p className={cn("text-3xl font-black", stockBajoCount > 0 ? "text-yellow-700" : "text-gray-900")}>
                                {stockBajoCount}
                            </p>
                        </div>
                    </div>
                    <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity text-yellow-600">
                        <AlertTriangle size={100} />
                    </div>
                </div>

                {/* Lotes por Vencer (Warning) */}
                <div onClick={() => setIsExpiringModalOpen(true)} className={cn(cardClass, "border-orange-200/50 shadow-orange-500/5")}>
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            "p-4 rounded-2xl group-hover:scale-110 transition-transform",
                            expiringCount > 0 ? "bg-orange-500/20 text-orange-700 shadow-sm shadow-orange-200" : "bg-gray-100/50 text-gray-400"
                        )}>
                            <Package size={28} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Por Vencer (90d)</p>
                            <p className={cn("text-3xl font-black", expiringCount > 0 ? "text-orange-700" : "text-gray-900")}>
                                {expiringCount}
                            </p>
                        </div>
                    </div>
                    <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity text-orange-600">
                        <Package size={100} />
                    </div>
                </div>

                {/* Pedidos por Aprobar */}
                <Link href="/almacen/pedidos">
                    <div className={cn(cardClass, "border-purple-200/50 shadow-purple-500/5")}>
                        <div className="flex items-center gap-4">
                            <div className={cn(
                                "p-4 rounded-2xl group-hover:scale-110 transition-transform",
                                pendingApprovalCount > 0 ? "bg-purple-500/20 text-purple-700 shadow-sm shadow-purple-200" : "bg-gray-100/50 text-gray-400"
                            )}>
                                <CheckCircle2 size={28} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Por Aprobar</p>
                                <p className={cn("text-3xl font-black", pendingApprovalCount > 0 ? "text-purple-700" : "text-gray-900")}>
                                    {pendingApprovalCount}
                                </p>
                            </div>
                        </div>
                        <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity text-purple-600">
                            <CheckCircle2 size={100} />
                        </div>
                    </div>
                </Link>
            </div>

            <LowStockModal
                isOpen={isLowStockModalOpen}
                onClose={() => setIsLowStockModalOpen(false)}
                items={lowStockItems}
            />

            {/* Expiring (Por Vencer) */}
            <ExpiringBatchesModal
                isOpen={isExpiringModalOpen}
                onClose={() => setIsExpiringModalOpen(false)}
                items={expiringBatches}
                title="Lotes por Vencer (Próximos 3 Meses)"
                canWriteOff={false}
            />

            {/* Expired (Vencidos) */}
            <ExpiringBatchesModal
                isOpen={isExpiredModalOpen}
                onClose={() => setIsExpiredModalOpen(false)}
                items={expiredBatches}
                title="Lotes Vencidos (Acción Requerida)"
                canWriteOff={true}
            />
        </>
    );
}
