"use client";

import { X, AlertOctagon, Calendar, Archive, Loader2, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    items: any[];
    title?: string;
    canWriteOff?: boolean;
}

export function ExpiringBatchesModal({ isOpen, onClose, items, title = "Lotes por Vencer", canWriteOff = false }: Props) {
    const { user } = useAuth();
    const router = useRouter();
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [localItems, setLocalItems] = useState(items);

    useEffect(() => {
        setLocalItems(items);
    }, [items]);

    const handleWriteOff = async (item: any) => {
        if (!confirm(`¿Estás seguro de dar de baja el lote ${item.codigo} por vencimiento? Esta acción descontará ${item.cantidad} unidades y no se puede deshacer.`)) return;

        setProcessingId(item.stockLoteId);
        try {
            const res = await fetch("/api/inventory/movements", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    tipo: "AJUSTE",
                    usuarioId: user?.id || 1,
                    almacenId: item.almacen?.almacenId || item.almacenId,
                    motivo: "VENCIMIENTO",
                    items: [
                        {
                            insumoId: item.insumoId || item.insumo.insumoId,
                            loteId: item.loteId,
                            cantidad: item.cantidad,
                            almacenId: item.almacen?.almacenId || item.almacenId
                        }
                    ]
                })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Error al procesar baja");
            }

            toast.success("Lote dado de baja correctamente");
            setLocalItems(prev => prev.filter(i => i.stockLoteId !== item.stockLoteId));
            router.refresh();
        } catch (error: any) {
            console.error(error);
            toast.error(error.message);
        } finally {
            setProcessingId(null);
        }
    };

    return (
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
                        className="relative w-full max-w-2xl bg-white/70 backdrop-blur-2xl backdrop-saturate-[1.2] rounded-[2.5rem] shadow-[0_8px_32px_0_rgba(0,0,0,0.12)] border border-white/60 flex flex-col max-h-[85vh] overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-8 border-b border-white/40 flex justify-between items-center shrink-0 bg-white/30 backdrop-blur-md">
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "p-3 rounded-2xl border",
                                    canWriteOff 
                                        ? 'bg-rose-500/10 text-rose-600 border-rose-200/50' 
                                        : 'bg-amber-500/10 text-amber-600 border-amber-200/50'
                                )}>
                                    {canWriteOff ? <Trash2 size={24} /> : <AlertOctagon size={24} />}
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-gray-900 tracking-tight">{title}</h2>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Control de caducidad de inventario</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-full transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-8 overflow-y-auto custom-scrollbar bg-white/20 space-y-4">
                            {localItems.length === 0 ? (
                                <div className="text-center py-20">
                                    <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-600 mx-auto mb-6 border border-emerald-200/50">
                                        <Archive className="opacity-40" size={32} />
                                    </div>
                                    <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">No hay lotes en esta categoría.</p>
                                </div>
                            ) : (
                                localItems.map((item, index) => {
                                    const daysDiff = Math.ceil((new Date(item.fechaVencimiento).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

                                    return (
                                        <div key={index} className={cn(
                                            "p-6 rounded-3xl border transition-all duration-300 group flex justify-between items-center relative overflow-hidden",
                                            canWriteOff 
                                                ? 'bg-rose-500/5 border-rose-200/50 hover:bg-rose-500/10 hover:shadow-lg hover:shadow-rose-100' 
                                                : 'bg-amber-500/5 border-amber-200/50 hover:bg-amber-500/10 hover:shadow-lg hover:shadow-amber-100'
                                        )}>
                                            <div className="relative z-10">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="font-black text-gray-900 uppercase tracking-tight text-base group-hover:text-rose-700 transition-colors">{item.insumo.nombre}</h3>
                                                    <span className="text-[10px] font-mono bg-white/60 px-2 py-0.5 rounded border border-white/80 text-gray-400">{item.insumo.codigo}</span>
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-3 text-xs font-bold text-gray-500 uppercase tracking-widest">
                                                        <div className="flex items-center gap-1.5 opacity-70">
                                                            <Archive size={14} />
                                                            <span>LOTE: {item.codigo || item.lote?.codigo}</span>
                                                        </div>
                                                        <div className="w-1 h-1 bg-gray-300 rounded-full" />
                                                        <span className="text-gray-700">{item.almacen.nombre}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className={cn(
                                                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border flex items-center gap-2",
                                                            canWriteOff 
                                                                ? 'bg-rose-500/10 text-rose-700 border-rose-200/50' 
                                                                : 'bg-amber-500/10 text-amber-700 border-amber-200/50'
                                                        )}>
                                                            <Calendar size={12} />
                                                            {new Date(item.fechaVencimiento).toLocaleDateString()}
                                                            <div className="w-1 h-1 bg-current rounded-full opacity-30" />
                                                            {canWriteOff
                                                                ? `Vencido hace ${Math.abs(daysDiff)} días`
                                                                : `Vence en ${daysDiff} días`
                                                            }
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-3 relative z-10">
                                                <div className="text-right">
                                                    <div className="text-3xl font-black text-gray-900 group-hover:scale-110 transition-transform origin-right">
                                                        {item.cantidad}
                                                    </div>
                                                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">
                                                        {item.insumo.unidadMedida || "UND"}
                                                    </div>
                                                </div>

                                                {canWriteOff && (
                                                    <button
                                                        onClick={() => handleWriteOff(item)}
                                                        disabled={!!processingId}
                                                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl flex items-center gap-2 shadow-lg shadow-rose-500/20 shadow-none hover:shadow-md transition-all active:scale-95 disabled:opacity-50"
                                                    >
                                                        {processingId === item.stockLoteId ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                                                        Dar de Baja
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-8 border-t border-white/40 bg-white/30 backdrop-blur-md shrink-0 flex justify-end">
                            <button
                                onClick={onClose}
                                className="px-10 py-3 bg-white/50 border border-white/60 text-gray-700 rounded-2xl text-sm font-bold transition-all hover:bg-white/80 active:scale-95 shadow-sm"
                            >
                                Cerrar Ventana
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
