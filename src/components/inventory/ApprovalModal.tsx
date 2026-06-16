"use client";

import { useState, useEffect } from "react";
import { AlertCircle, Check, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface Supplier {
    proveedorId: string;
    nombre: string;
}

interface ApprovalModalProps {
    pedido: any;
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (pedidoId: string, assignments: { detalleId: string, proveedorId: string, costoUnitario?: number }[]) => Promise<void>;
    isProcessing: boolean;
}

export function ApprovalModal({ pedido, isOpen, onClose, onConfirm, isProcessing }: ApprovalModalProps) {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [assignments, setAssignments] = useState<Record<string, string>>({});
    const [costs, setCosts] = useState<Record<string, string>>({});
    const [bulkSupplier, setBulkSupplier] = useState<string>("");

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            fetchSuppliers();
            setAssignments({});
            setCosts({});
            setBulkSupplier("");
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    const fetchSuppliers = async () => {
        try {
            const res = await fetch("/api/inventory/providers");
            if (res.ok) setSuppliers(await res.json());
        } catch (error) {
            console.error(error);
        }
    };

    const handleAssign = (detalleId: string, proveedorId: string) =>
        setAssignments(prev => ({ ...prev, [detalleId]: proveedorId }));

    const applyBulk = () => {
        if (!bulkSupplier) return;
        const next: Record<string, string> = {};
        pedido?.detalles.forEach((d: any) => { next[d.detalleId] = bulkSupplier; });
        setAssignments(next);
    };

    const handleCostChange = (detalleId: string, value: string) =>
        setCosts(prev => ({ ...prev, [detalleId]: value }));

    const handleConfirm = () => {
        const payload = Object.entries(assignments).map(([detalleId, proveedorId]) => {
            const raw = costs[detalleId];
            return { detalleId, proveedorId, costoUnitario: raw && parseFloat(raw) > 0 ? parseFloat(raw) : undefined };
        });
        onConfirm(pedido.pedidoId, payload);
    };

    const isComplete = pedido?.detalles.every((d: any) =>
        assignments[d.detalleId] && costs[d.detalleId] && parseFloat(costs[d.detalleId]) > 0
    );

    if (!pedido) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/50"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 12 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 12 }}
                        className="relative w-full max-w-3xl bg-white rounded-2xl border border-gray-200 shadow-2xl flex flex-col max-h-[88vh] overflow-hidden"
                    >
                        {/* Header */}
                        <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
                            <div className="flex items-center gap-2.5">
                                <div className="p-1.5 bg-lime-100 rounded-lg text-lime-600 border border-lime-200">
                                    <Check size={15} strokeWidth={3} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest leading-none">
                                        Aprobar Orden
                                    </h3>
                                    <p className="text-[9px] font-mono text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                                        PEDIDO #{pedido.pedidoId}
                                    </p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-1.5 hover:bg-red-50 rounded-full transition-colors group">
                                <X size={16} className="text-gray-400 group-hover:text-red-500" />
                            </button>
                        </div>

                        {/* Scrollable content */}
                        <div
                            className="flex-1 overflow-y-auto p-4 space-y-3"
                            style={{ overscrollBehavior: 'contain' }}
                        >
                            {/* Alert Banner */}
                            <div className="bg-amber-50 border border-amber-200 px-3 py-2.5 rounded-xl flex gap-2.5 items-center">
                                <AlertCircle className="text-amber-500 shrink-0" size={14} />
                                <p className="text-[11px] font-semibold text-amber-800 leading-snug">
                                    Asigne un <span className="font-black">proveedor</span> y un <span className="font-black">costo unitario</span> a cada insumo para completar la aprobación.
                                </p>
                            </div>

                            {/* Bulk assign toolbar */}
                            <div className="flex gap-2 items-center">
                                <select
                                    className="flex-1 px-3 py-2 rounded-lg border border-gray-200 bg-white outline-none text-xs font-semibold text-gray-700 shadow-sm focus:ring-2 focus:ring-lime-400/40 appearance-none cursor-pointer"
                                    value={bulkSupplier}
                                    onChange={e => setBulkSupplier(e.target.value)}
                                >
                                    <option value="">Asignación masiva: Seleccionar proveedor...</option>
                                    {suppliers.map(s => (
                                        <option key={s.proveedorId} value={s.proveedorId}>{s.nombre}</option>
                                    ))}
                                </select>
                                <button
                                    onClick={applyBulk}
                                    disabled={!bulkSupplier}
                                    className="px-3 py-2 bg-gray-900 text-white rounded-lg text-[10px] font-black uppercase tracking-wider disabled:opacity-40 transition-all active:scale-95 whitespace-nowrap"
                                >
                                    Aplicar a todo
                                </button>
                            </div>

                            {/* Items Table */}
                            <div>
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 ml-0.5">
                                    Detalles del Pedido — {pedido.detalles.length} insumo{pedido.detalles.length !== 1 ? 's' : ''}
                                </p>
                                <div className="rounded-xl border border-gray-200 overflow-hidden">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-3 py-2 text-[9px] font-black text-gray-400 uppercase tracking-widest">Insumo</th>
                                                <th className="px-3 py-2 text-[9px] font-black text-gray-400 uppercase tracking-widest w-20 text-center">Cant.</th>
                                                <th className="px-3 py-2 text-[9px] font-black text-gray-400 uppercase tracking-widest">Proveedor</th>
                                                <th className="px-3 py-2 text-[9px] font-black text-emerald-600 uppercase tracking-widest w-28 text-right">Costo Unit.</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 bg-white">
                                            {pedido.detalles.map((d: any) => (
                                                <tr key={d.detalleId} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-3 py-2.5">
                                                        <div className="text-xs font-bold text-gray-900 leading-tight">{d.insumo.nombre}</div>
                                                        <div className="text-[9px] font-mono text-gray-400">{d.insumo.codigo}</div>
                                                    </td>
                                                    <td className="px-3 py-2.5 text-center">
                                                        <span className="text-sm font-black text-gray-700">{d.cantidad}</span>
                                                        <span className="text-[9px] font-bold text-gray-400 uppercase ml-0.5">{d.insumo.unidadMedida}</span>
                                                    </td>
                                                    <td className="px-3 py-2.5">
                                                        <select
                                                            className={cn(
                                                                "w-full px-2 py-1.5 rounded-lg border outline-none text-[11px] font-semibold transition-colors cursor-pointer",
                                                                !assignments[d.detalleId]
                                                                    ? 'border-rose-300 bg-rose-50 text-rose-700'
                                                                    : 'border-lime-300 bg-lime-50 text-lime-800'
                                                            )}
                                                            value={assignments[d.detalleId] || ""}
                                                            onChange={e => handleAssign(d.detalleId, e.target.value)}
                                                        >
                                                            <option value="">Pendiente...</option>
                                                            {suppliers.map(s => (
                                                                <option key={s.proveedorId} value={s.proveedorId}>{s.nombre}</option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                    <td className="px-3 py-2.5">
                                                        <div className="relative flex justify-end">
                                                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-black text-emerald-600">$</span>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                step="0.01"
                                                                placeholder="0.00"
                                                                value={costs[d.detalleId] || ""}
                                                                onChange={e => handleCostChange(d.detalleId, e.target.value)}
                                                                className="w-24 pl-5 pr-2 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 focus:bg-white focus:ring-2 focus:ring-emerald-400/30 outline-none text-xs font-bold text-emerald-800 transition-colors text-right"
                                                            />
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-4 py-3 border-t border-gray-100 bg-white flex justify-end gap-2 shrink-0">
                            <button
                                onClick={onClose}
                                disabled={isProcessing}
                                className="px-4 py-2 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-100 transition-colors uppercase tracking-wider"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirm}
                                disabled={!isComplete || isProcessing}
                                className="px-5 py-2 bg-[#a1db4b] text-white rounded-lg hover:bg-[#8cc63f] text-xs font-black uppercase tracking-wider shadow-lg shadow-lime-500/20 active:scale-95 disabled:opacity-40 transition-colors flex items-center gap-1.5"
                            >
                                {isProcessing ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} strokeWidth={3} />}
                                Aprobar y Procesar
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
