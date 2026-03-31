"use client";

import { useEffect, useState } from "react";
import { Loader2, Package, MapPin, AlertCircle, Pencil, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface BatchDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    insumo: any | null; // The insumo object from the parent table
    filterAlmacenId?: string;
}

interface StockDetail {
    almacenId: string;
    almacenNombre: string;
    stockMinimo: number;
    lotes: {
        loteId: string;
        codigo: string;
        fechaVencimiento: string | null;
        fechaFabricacion: string | null;
        cantidad: number;
    }[];
}

export function BatchDetailsModal({ isOpen, onClose, insumo, filterAlmacenId }: BatchDetailsModalProps) {
    const [details, setDetails] = useState<StockDetail[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Editing State
    const [editingStoreId, setEditingStoreId] = useState<string | null>(null);
    const [tempMin, setTempMin] = useState<string>("");
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen && insumo?.insumoId) {
            fetchDetails(insumo.insumoId);
        } else {
            setDetails([]);
            setError(null);
            setEditingStoreId(null);
        }
    }, [isOpen, insumo]);

    const fetchDetails = async (insumoId: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/inventory/stocks/${insumoId}`);
            if (res.ok) {
                const data = await res.json();
                setDetails(data);
            } else {
                setError("Error al cargar detalles del stock.");
            }
        } catch (err) {
            setError("Error de conexión.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditStart = (store: StockDetail) => {
        setEditingStoreId(store.almacenId);
        const val = store.stockMinimo ?? 0;
        setTempMin(val.toString());
    };

    const handleCancelEdit = () => {
        setEditingStoreId(null);
        setTempMin("");
    };

    const handleSaveMin = async (almacenId: string) => {
        if (!insumo) return;
        setIsSaving(true);
        try {
            const res = await fetch("/api/inventory/stocks/minimo", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    insumoId: insumo.insumoId,
                    almacenId: almacenId,
                    stockMinimo: parseFloat(tempMin)
                })
            });

            if (res.ok) {
                setDetails(prev => prev.map(d =>
                    d.almacenId === almacenId ? { ...d, stockMinimo: parseFloat(tempMin) } : d
                ));
                setEditingStoreId(null);
            } else {
                alert("Error al guardar");
            }
        } catch (error) {
            console.error(error);
            alert("Error de conexión");
        } finally {
            setIsSaving(false);
        }
    };

    const getExpiryStatus = (dateStr: string | null) => {
        if (!dateStr) return { color: "text-gray-500", bg: "bg-gray-100/50", label: "No Vence", days: null };

        const today = new Date();
        const expiry = new Date(dateStr);
        const diffTime = expiry.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return { color: "text-rose-700", bg: "bg-rose-500/10", label: "Vencido", days: diffDays };
        if (diffDays < 30) return { color: "text-rose-600", bg: "bg-rose-500/5", label: "< 1 Mes", days: diffDays };
        if (diffDays < 90) return { color: "text-amber-600", bg: "bg-amber-500/10", label: "< 3 Meses", days: diffDays };
        return { color: "text-emerald-700", bg: "bg-emerald-500/10", label: "OK", days: diffDays };
    };

    if (!insumo) return null;

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
                        className="relative w-full max-w-4xl bg-white/70 backdrop-blur-2xl backdrop-saturate-[1.2] rounded-[2.5rem] shadow-[0_8px_32px_0_rgba(0,0,0,0.12)] border border-white/60 flex flex-col max-h-[85vh] overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-8 border-b border-white/40 flex justify-between items-center shrink-0 bg-white/30 backdrop-blur-md">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-500/10 text-blue-600 rounded-2xl border border-blue-200/50">
                                    <Package size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-gray-900 tracking-tight">{insumo.nombre}</h2>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Código: {insumo.codigo}</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-full transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-white/20">
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-4">
                                    <Loader2 className="animate-spin text-lime-600" size={40} />
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest animate-pulse">Cargando detalles de stock...</p>
                                </div>
                            ) : error ? (
                                <div className="bg-rose-500/10 text-rose-700 border border-rose-200/50 p-6 rounded-3xl text-sm font-bold text-center">
                                    {error}
                                </div>
                            ) : details.length === 0 ? (
                                <div className="text-center py-20">
                                    <div className="w-16 h-16 bg-gray-500/10 rounded-full flex items-center justify-center text-gray-400 mx-auto mb-6 border border-gray-200/50 opacity-40">
                                        <AlertCircle size={32} />
                                    </div>
                                    <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">No hay stock disponible en ningún almacén.</p>
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    {details.filter(wh => !filterAlmacenId || wh.almacenId === filterAlmacenId).map((wh) => (
                                        <div key={wh.almacenId} className="bg-white/40 backdrop-blur-md border border-white/50 rounded-3xl overflow-hidden shadow-sm shadow-white/20">
                                            {/* Warehouse Header */}
                                            <div className="bg-white/30 px-6 py-4 border-b border-white/40 flex flex-wrap items-center gap-4">
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="h-4 w-4 text-gray-400" />
                                                    <h4 className="font-black text-gray-800 uppercase tracking-tight text-sm">
                                                        {wh.almacenNombre}
                                                    </h4>
                                                </div>

                                                <div className="ml-auto flex items-center gap-4">
                                                    {/* Min Stock Editor */}
                                                    {editingStoreId === wh.almacenId ? (
                                                        <div className="flex items-center gap-1.5 bg-white/60 border border-lime-500/50 rounded-xl px-2 py-1 shadow-inner">
                                                            <input
                                                                type="number"
                                                                value={tempMin}
                                                                onChange={(e) => setTempMin(e.target.value)}
                                                                className="w-16 text-xs font-black text-gray-900 outline-none bg-transparent text-right"
                                                                disabled={isSaving}
                                                                autoFocus
                                                            />
                                                            <div className="flex items-center gap-1">
                                                                <button onClick={() => handleSaveMin(wh.almacenId)} disabled={isSaving} className="text-lime-600 hover:bg-lime-500/10 p-1 rounded-lg transition-colors">
                                                                    {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                                                                </button>
                                                                <button onClick={handleCancelEdit} disabled={isSaving} className="text-rose-500 hover:bg-rose-500/10 p-1 rounded-lg transition-colors">
                                                                    <X size={14} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleEditStart(wh)}
                                                            className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-white/50 px-3 py-1.5 rounded-full border border-white/80 text-gray-500 hover:border-lime-400 hover:text-lime-700 transition-all cursor-pointer"
                                                        >
                                                            <span>Mínimo:</span>
                                                            <span className={cn(
                                                                "px-2 rounded-lg",
                                                                wh.lotes.reduce((sum, l) => sum + l.cantidad, 0) <= wh.stockMinimo 
                                                                    ? "bg-rose-500/10 text-rose-600" 
                                                                    : "text-gray-700"
                                                            )}>
                                                                {wh.stockMinimo}
                                                            </span>
                                                            <Pencil size={12} className="opacity-40 group-hover:opacity-100 transition-opacity" />
                                                        </button>
                                                    )}

                                                    <div className="h-6 w-px bg-white/40" />

                                                    <div className="text-[10px] font-black uppercase tracking-widest bg-lime-500/10 text-lime-700 px-3 py-1.5 rounded-full border border-lime-200/50">
                                                        Total: {wh.lotes.reduce((sum, l) => sum + l.cantidad, 0)}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Lot Table */}
                                            {wh.lotes.length > 0 ? (
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-left text-sm border-collapse">
                                                        <thead className="bg-white/20 border-b border-white/40">
                                                            <tr>
                                                                <th className="px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Lote</th>
                                                                <th className="px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Fabricación</th>
                                                                <th className="px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Vencimiento</th>
                                                                <th className="px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Cantidad</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-white/20">
                                                            {wh.lotes.map((lote) => {
                                                                const status = getExpiryStatus(lote.fechaVencimiento);
                                                                return (
                                                                    <tr key={lote.loteId} className="hover:bg-white/60 transition-all group">
                                                                        <td className="px-6 py-4">
                                                                            <span className="font-mono text-xs font-bold text-gray-700 bg-white/50 px-2 py-0.5 rounded border border-white/60">
                                                                                {lote.codigo}
                                                                            </span>
                                                                        </td>
                                                                        <td className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-tight">
                                                                            {lote.fechaFabricacion ? new Date(lote.fechaFabricacion).toLocaleDateString() : '—'}
                                                                        </td>
                                                                        <td className="px-6 py-4">
                                                                            <div className="flex items-center gap-3">
                                                                                <span className="text-xs font-bold text-gray-700">
                                                                                    {lote.fechaVencimiento ? new Date(lote.fechaVencimiento).toLocaleDateString() : '—'}
                                                                                </span>
                                                                                <span className={cn(
                                                                                    "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border transition-all",
                                                                                    status.bg,
                                                                                    status.color,
                                                                                    "border-current/20"
                                                                                )}>
                                                                                    {status.label}
                                                                                </span>
                                                                            </div>
                                                                        </td>
                                                                        <td className="px-6 py-4 text-right">
                                                                            <div className="text-lg font-black text-gray-900 group-hover:text-lime-700 transition-colors">
                                                                                {lote.cantidad}
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            ) : (
                                                <div className="p-8 text-center">
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">
                                                        No hay lotes con stock en este almacén.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-8 border-t border-white/40 bg-white/30 backdrop-blur-md shrink-0 flex justify-end">
                            <button
                                onClick={onClose}
                                className="px-10 py-3 bg-white/50 border border-white/60 text-gray-700 rounded-2xl text-sm font-bold transition-all hover:bg-white/80 active:scale-95 shadow-sm"
                            >
                                Cerrar Detalle
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
