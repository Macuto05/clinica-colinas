"use client";

import { useState, useEffect } from "react";
import { AlertCircle, Check, X, Plus, UserPlus, ArrowRight, Loader2, Factory, Trash2 } from "lucide-react";
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
    const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(false);

    // Quick assign all
    const [bulkSupplier, setBulkSupplier] = useState<string>("");

    // New Provider Creation State
    const [isCreatingProvider, setIsCreatingProvider] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [newProvider, setNewProvider] = useState({ nombre: "", rifNif: "" });

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            fetchSuppliers();
            setAssignments({});
            setCosts({});
            setBulkSupplier("");
            setIsCreatingProvider(false);
            setNewProvider({ nombre: "", rifNif: "" });
        } else {
            document.body.style.overflow = '';
        }
        
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    const fetchSuppliers = async () => {
        setIsLoadingSuppliers(true);
        try {
            const res = await fetch("/api/inventory/providers");
            if (res.ok) {
                const data = await res.json();
                setSuppliers(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoadingSuppliers(false);
        }
    };

    const createProvider = async () => {
        setIsCreating(true);
        try {
            const res = await fetch("/api/inventory/providers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newProvider)
            });
            if (res.ok) {
                const created = await res.json();
                setSuppliers([...suppliers, created]);
                setIsCreatingProvider(false);
                setNewProvider({ nombre: "", rifNif: "" });
                if (!bulkSupplier) setBulkSupplier(created.proveedorId);
            }
        } catch (error) {
            console.error("Error creating provider", error);
        } finally {
            setIsCreating(false);
        }
    };

    const handleAssign = (detalleId: string, proveedorId: string) => {
        setAssignments(prev => ({ ...prev, [detalleId]: proveedorId }));
    };

    const applyBulk = () => {
        if (!bulkSupplier) return;
        const newAssignments: Record<string, string> = {};
        pedido?.detalles.forEach((d: any) => {
            newAssignments[d.detalleId] = bulkSupplier;
        });
        setAssignments(newAssignments);
    };

    const handleCostChange = (detalleId: string, value: string) => {
        setCosts(prev => ({ ...prev, [detalleId]: value }));
    };

    const handleConfirm = () => {
        const payload = Object.entries(assignments).map(([detalleId, proveedorId]) => {
            const rawCost = costs[detalleId];
            const costoUnitario = rawCost && parseFloat(rawCost) > 0
                ? parseFloat(rawCost)
                : undefined;
            return { detalleId, proveedorId, costoUnitario };
        });
        onConfirm(pedido.pedidoId, payload);
    };

    const isComplete = pedido?.detalles.every((d: any) => 
        assignments[d.detalleId] && 
        costs[d.detalleId] && 
        parseFloat(costs[d.detalleId]) > 0
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
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-4xl bg-white/70 backdrop-blur-2xl backdrop-saturate-[1.2] rounded-[2rem] border border-white/60 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.15)] flex flex-col max-h-[90vh] overflow-hidden"
                    >
                        <div className="py-3 px-6 border-b border-white/60 flex justify-between items-center bg-white/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-lime-500/10 rounded-[1rem] text-lime-600 border border-lime-200/50 shadow-sm">
                                    <Check size={20} strokeWidth={3} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-gray-900 tracking-tight uppercase tracking-widest leading-none">
                                        Aprobar Orden
                                    </h3>
                                    <p className="text-[10px] font-mono text-gray-400 font-black uppercase tracking-widest mt-1">PEDIDO #{pedido.pedidoId}</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-rose-500/10 rounded-full transition-colors group active:scale-90">
                                <X size={20} className="text-gray-400 group-hover:text-rose-600" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                            <div className="bg-amber-500/10 border border-amber-200/50 p-6 rounded-[2rem] flex gap-5 items-start">
                                <AlertCircle className="text-amber-600 shrink-0 mt-1" size={24} />
                                <div>
                                    <p className="text-sm font-black text-amber-900 uppercase tracking-tight">Asignación de Proveedor y Costo Requerida</p>
                                    <p className="text-[11px] font-bold text-amber-700/80 mt-1 italic leading-relaxed">Para formalizar la aprobación, debe indicar el proveedor y el costo unitario de cada insumo solicitado.</p>
                                </div>
                            </div>

                            {/* Provider Creation Toggle */}
                            <div className="flex justify-end">
                                <button
                                    onClick={() => setIsCreatingProvider(!isCreatingProvider)}
                                    className={cn(
                                        "flex items-center gap-2 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shadow-sm active:scale-95",
                                        isCreatingProvider ? "bg-rose-500/10 text-rose-600 border border-rose-200/50" : "bg-blue-500/10 text-blue-600 border border-blue-200/50"
                                    )}
                                >
                                    {isCreatingProvider ? <X size={14} /> : <UserPlus size={14} />}
                                    {isCreatingProvider ? "Cancelar Registro" : "Nuevo Proveedor"}
                                </button>
                            </div>

                            {isCreatingProvider && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="bg-blue-500/5 border border-white shadow-inner p-8 rounded-[2rem] space-y-6"
                                >
                                    <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Nombre Comercial</label>
                                            <input
                                                className="w-full px-6 py-4 rounded-2xl border border-white/80 bg-white/50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none font-bold text-gray-800 shadow-inner transition-all sm:text-sm"
                                                placeholder="Ej: Droguería Americana"
                                                value={newProvider.nombre}
                                                onChange={e => setNewProvider({ ...newProvider, nombre: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">RIF / NIF</label>
                                            <input
                                                className="w-full px-6 py-4 rounded-2xl border border-white/80 bg-white/50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none font-bold text-gray-800 shadow-inner transition-all sm:text-sm"
                                                placeholder="J-12345678-9"
                                                value={newProvider.rifNif}
                                                onChange={e => setNewProvider({ ...newProvider, rifNif: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            disabled={!newProvider.nombre || isCreating}
                                            onClick={createProvider}
                                            className="px-8 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-40 transition-all flex items-center gap-3"
                                        >
                                            {isCreating ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} strokeWidth={3} />}
                                            Guardar Proveedor
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {/* Bulk Selection */}
                            <div className="bg-white/40 p-6 rounded-[2rem] border border-white shadow-sm flex flex-col md:flex-row items-center gap-6">
                                <div className="flex-1 w-full space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 italic leading-relaxed">Asignación Masiva</label>
                                    <select
                                        className="w-full px-6 py-4 rounded-2xl border border-white/80 bg-white/50 focus:ring-4 focus:ring-lime-500/10 outline-none font-black text-gray-800 shadow-inner transition-all appearance-none cursor-pointer text-sm"
                                        value={bulkSupplier}
                                        onChange={(e) => setBulkSupplier(e.target.value)}
                                    >
                                        <option value="">Seleccionar proveedor global...</option>
                                        {suppliers.map(s => (
                                            <option key={s.proveedorId} value={s.proveedorId}>{s.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                                <button
                                    onClick={applyBulk}
                                    disabled={!bulkSupplier}
                                    className="px-8 py-4 bg-gray-900 text-white rounded-2xl hover:bg-gray-800 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-gray-900/10 active:scale-95 disabled:opacity-40 transition-all flex items-center gap-3 whitespace-nowrap"
                                >
                                    Aplicar a Todo
                                </button>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Detalles del Pedido</h4>
                                <div className="overflow-x-auto rounded-[2rem] border border-white/50">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-white/30 backdrop-blur-md">
                                            <tr>
                                                <th className="px-8 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Insumo</th>
                                                <th className="px-8 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Cantidad</th>
                                                <th className="px-8 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Proveedor</th>
                                                <th className="px-8 py-4 text-[9px] font-black text-emerald-600 uppercase tracking-widest">Costo Unit. ($)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/20 bg-white/10">
                                            {pedido.detalles.map((d: any) => (
                                                <tr key={d.detalleId} className="hover:bg-white/40 transition-all">
                                                    <td className="px-8 py-5">
                                                        <div className="text-xs font-black text-gray-900 uppercase tracking-tight leading-tight">{d.insumo.nombre}</div>
                                                        <div className="text-[10px] font-mono text-gray-400">{d.insumo.codigo}</div>
                                                    </td>
                                                    <td className="px-8 py-5 text-sm font-black text-gray-600">
                                                        {d.cantidad} <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">{d.insumo.unidadMedida}</span>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <select
                                                            className={cn(
                                                                "w-full px-4 py-2 rounded-xl border outline-none font-black text-[10px] transition-all shadow-inner uppercase tracking-tight",
                                                                !assignments[d.detalleId] 
                                                                    ? 'border-rose-300 bg-rose-50/50 text-rose-700' 
                                                                    : 'border-white/80 bg-white/60 text-lime-700'
                                                            )}
                                                            value={assignments[d.detalleId] || ""}
                                                            onChange={(e) => handleAssign(d.detalleId, e.target.value)}
                                                        >
                                                            <option value="">Pendiente...</option>
                                                            {suppliers.map(s => (
                                                                <option key={s.proveedorId} value={s.proveedorId}>{s.nombre}</option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <div className="relative">
                                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-emerald-600">$</span>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                step="0.01"
                                                                placeholder="0.00"
                                                                value={costs[d.detalleId] || ""}
                                                                onChange={(e) => handleCostChange(d.detalleId, e.target.value)}
                                                                className="w-28 pl-6 pr-3 py-2 rounded-xl border border-emerald-200/60 bg-emerald-50/40 focus:bg-white/80 focus:ring-2 focus:ring-emerald-400/30 outline-none font-black text-sm text-emerald-800 shadow-inner transition-all"
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

                        <div className="py-3 px-6 border-t border-white/60 bg-white/50 backdrop-blur-md flex justify-end gap-3">
                            <button
                                onClick={onClose}
                                disabled={isProcessing}
                                className="px-6 py-2.5 rounded-[1rem] font-bold text-gray-500 hover:bg-gray-200/50 transition-all uppercase tracking-widest text-[10px]"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirm}
                                disabled={!isComplete || isProcessing}
                                className="px-6 py-2.5 bg-[#a1db4b] text-white rounded-[1rem] hover:bg-[#8cc63f] font-black uppercase tracking-widest text-[10px] shadow-lg shadow-lime-500/20 active:scale-95 disabled:opacity-40 transition-all flex items-center gap-2"
                            >
                                {isProcessing ? (
                                    <Loader2 size={14} className="animate-spin" />
                                ) : (
                                    <Check size={14} strokeWidth={3} />
                                )}
                                Aprobar y Procesar
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
