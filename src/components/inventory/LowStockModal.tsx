"use client";

import { useState } from "react";
import { BatchDetailsModal } from "./BatchDetailsModal";
import { AlertCircle, Eye, Check, ShoppingCart, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface LowStockItem {
    stockId: string;
    insumoId: string;
    almacenId: string;
    insumoNombre: string;
    insumoCodigo: string;
    unidad: string;
    almacenNombre: string;
    cantidadActual: number;
    stockMinimo: number;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    items: LowStockItem[];
}

export function LowStockModal({ isOpen, onClose, items }: Props) {
    const [selectedInsumo, setSelectedInsumo] = useState<any | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const { push } = useRouter();

    const handleViewDetails = (item: LowStockItem) => {
        setSelectedInsumo({
            insumoId: item.insumoId,
            nombre: item.insumoNombre,
            codigo: item.insumoCodigo,
            unidad: item.unidad
        });
        setIsDetailModalOpen(true);
    };

    const handleGenerateOrder = () => {
        if (items.length === 0) return;

        const replenishmentItems = items.map(item => ({
            insumoId: item.insumoId,
            cantidad: Math.max(0, item.stockMinimo - item.cantidadActual)
        })).filter(i => i.cantidad > 0);

        if (replenishmentItems.length === 0) return;

        const data = encodeURIComponent(JSON.stringify(replenishmentItems));
        push(`/almacen/pedidos?replenish=${data}`);
        onClose();
    };

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={onClose}
                            className="fixed inset-0 bg-slate-900/30 backdrop-blur-md transition-opacity"
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-4xl bg-white/70 backdrop-blur-2xl backdrop-saturate-[1.2] rounded-[2.5rem] shadow-[0_8px_32px_0_rgba(0,0,0,0.12)] border border-white/60 flex flex-col max-h-[90vh] overflow-hidden"
                        >
                            {/* Header */}
                            <div className="p-8 border-b border-white/40 flex justify-between items-center shrink-0 bg-white/30 backdrop-blur-md">
                                <div>
                                    <h2 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                                        <div className="p-2 bg-rose-500/10 rounded-xl">
                                            <AlertCircle className="text-rose-600" size={24} />
                                        </div>
                                        Alerta de Stock Bajo
                                    </h2>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Insumos por debajo del nivel mínimo</p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-full transition-colors"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Body */}
                            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-white/20">
                                {items.length === 0 ? (
                                    <div className="p-20 text-center flex flex-col items-center">
                                        <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-600 mb-6 border border-emerald-200/50">
                                            <Check size={32} />
                                        </div>
                                        <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Todo en orden</h3>
                                        <p className="text-gray-500 font-medium mt-1">No hay insumos por debajo del stock mínimo.</p>
                                    </div>
                                ) : (
                                    <div className="bg-white/40 backdrop-blur-md border border-white/50 rounded-3xl overflow-hidden shadow-sm">
                                        <table className="w-full text-left text-sm border-collapse">
                                            <thead>
                                                <tr className="bg-white/30 border-b border-white/40">
                                                    <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Insumo</th>
                                                    <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Ubicación</th>
                                                    <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Cantidad Actual</th>
                                                    <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Mínimo</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/30">
                                                {items.map((item) => (
                                                    <tr
                                                        key={item.stockId}
                                                        className="hover:bg-white/60 cursor-pointer transition-all group"
                                                        onClick={() => handleViewDetails(item)}
                                                    >
                                                        <td className="px-6 py-4">
                                                            <div className="font-bold text-gray-900 group-hover:text-rose-700 transition-colors uppercase tracking-tight">{item.insumoNombre}</div>
                                                            <div className="text-[10px] font-mono text-gray-400">{item.insumoCodigo}</div>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <span className="text-xs font-bold text-gray-600 bg-white/50 px-3 py-1 rounded-full border border-white/60">
                                                                {item.almacenNombre}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <div className="text-sm font-black text-rose-600 flex flex-col items-center">
                                                                {item.cantidadActual}
                                                                <span className="text-[8px] uppercase tracking-widest text-rose-400">{item.unidad}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <div className="text-xs font-black text-gray-400 flex flex-col items-center">
                                                                {item.stockMinimo}
                                                                <span className="text-[8px] uppercase tracking-widest">{item.unidad}</span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="p-8 border-t border-white/40 bg-white/30 backdrop-blur-md shrink-0 flex justify-between items-center">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    {items.length} ítems requieren reposición inmediata
                                </p>
                                <div className="flex gap-4">
                                    <button
                                        onClick={onClose}
                                        className="px-8 py-3 bg-white/50 border border-white/60 text-gray-700 rounded-2xl text-sm font-bold transition-all hover:bg-white/80 active:scale-95 shadow-sm"
                                    >
                                        Cerrar
                                    </button>
                                    {items.length > 0 && (
                                        <button
                                            onClick={handleGenerateOrder}
                                            className="px-8 py-3 bg-[#a1db4b] hover:bg-[#8cc63f] text-white font-black uppercase tracking-widest shadow-[0_8px_20px_rgba(161,219,75,0.3)] border border-white/20 transition-all flex items-center gap-2 active:scale-95 text-xs"
                                        >
                                            <ShoppingCart size={16} />
                                            Generar Orden de Reposición
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {selectedInsumo && (
                <BatchDetailsModal
                    isOpen={isDetailModalOpen}
                    onClose={() => setIsDetailModalOpen(false)}
                    insumo={selectedInsumo}
                />
            )}
        </>
    );
}
