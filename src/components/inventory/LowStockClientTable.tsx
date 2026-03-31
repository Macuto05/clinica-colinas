"use client";

import { useState } from "react";
import { BatchDetailsModal } from "./BatchDetailsModal";
import { AlertCircle, Eye, CheckCircle, Package, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

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
    initialData: LowStockItem[];
}

export function LowStockClientTable({ initialData }: Props) {
    const [selectedInsumo, setSelectedInsumo] = useState<any | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleViewDetails = (item: LowStockItem) => {
        setSelectedInsumo({
            insumoId: item.insumoId,
            nombre: item.insumoNombre,
            codigo: item.insumoCodigo,
            unidad: item.unidad
        });
        setIsModalOpen(true);
    };

    if (initialData.length === 0) {
        return (
            <div className="p-20 text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-lime-500/10 rounded-full flex items-center justify-center text-lime-600 mb-6 border border-lime-200/50 shadow-sm">
                    <CheckCircle size={32} />
                </div>
                <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase tracking-widest">Sin Pendientes</h3>
                <p className="text-gray-400 font-medium text-sm mt-1 italic">Todos los insumos se encuentran por encima de su stock mínimo.</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-white/20 backdrop-blur-sm border-b border-white/40">
                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Insumo</th>
                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Ubicación</th>
                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Existencia</th>
                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Mínimo</th>
                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">Estado</th>
                        <th className="px-8 py-5 text-right"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/20">
                    {initialData.map((item) => (
                        <tr key={item.stockId} className="hover:bg-white/60 transition-all group">
                            <td className="px-8 py-6">
                                <div>
                                    <div className="text-sm font-black text-gray-900 uppercase tracking-tight">{item.insumoNombre}</div>
                                    <div className="text-[10px] font-mono text-gray-400 uppercase">{item.insumoCodigo}</div>
                                </div>
                            </td>
                            <td className="px-8 py-6">
                                <span className="text-xs font-bold text-gray-600 bg-white/50 px-3 py-1 rounded-xl border border-white shadow-sm italic">
                                    {item.almacenNombre}
                                </span>
                            </td>
                            <td className="px-8 py-6 text-right">
                                <div className="text-sm font-black text-rose-600">
                                    {item.cantidadActual} <span className="text-[10px] uppercase opacity-60 tracking-tighter">{item.unidad}</span>
                                </div>
                            </td>
                            <td className="px-8 py-6 text-right text-sm font-black text-gray-400 font-mono">
                                {item.stockMinimo}
                            </td>
                            <td className="px-8 py-6 text-center">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black bg-rose-500/10 text-rose-600 border border-rose-200/50 uppercase tracking-widest">
                                    <AlertCircle size={10} strokeWidth={3} />
                                    CRÍTICO
                                </span>
                            </td>
                            <td className="px-8 py-6 text-right">
                                <button
                                    onClick={() => handleViewDetails(item)}
                                    className="p-3 text-gray-400 hover:text-lime-600 bg-white/50 hover:bg-white rounded-2xl border border-white transition-all shadow-sm active:scale-90"
                                    title="Ver Detalles de Lotes"
                                >
                                    <ArrowRight size={18} />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Reuse the existing modal */}
            {selectedInsumo && (
                <BatchDetailsModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    insumo={selectedInsumo}
                />
            )}
        </div>
    );
}
