"use client";

import { useState } from "react";
import { BatchDetailsModal } from "./BatchDetailsModal";
import { AlertCircle, Eye } from "lucide-react";

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
        // Construct the object expected by BatchDetailsModal
        // It primarily needs insumoId and basic display info
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
            <div className="p-12 text-center text-gray-500 flex flex-col items-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4">
                    <CheckCircle size={24} />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Todo en orden</h3>
                <p>No hay insumos por debajo del stock mínimo.</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 dark:bg-zinc-800 text-xs uppercase text-gray-500 font-medium">
                    <tr>
                        <th className="px-6 py-3">Insumo</th>
                        <th className="px-6 py-3">Ubicación</th>
                        <th className="px-6 py-3 text-right">Cantidad</th>
                        <th className="px-6 py-3 text-right">Mínimo</th>
                        <th className="px-6 py-3 text-center">Estado</th>
                        <th className="px-6 py-3 text-center">Acción</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                    {initialData.map((item) => (
                        <tr key={item.stockId} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50">
                            <td className="px-6 py-4">
                                <div>
                                    <div className="font-medium text-gray-900 dark:text-gray-100">{item.insumoNombre}</div>
                                    <div className="text-xs text-gray-500 font-mono">{item.insumoCodigo}</div>
                                </div>
                            </td>
                            <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                                {item.almacenNombre}
                            </td>
                            <td className="px-6 py-4 text-right font-medium text-red-600">
                                {item.cantidadActual} {item.unidad}
                            </td>
                            <td className="px-6 py-4 text-right text-gray-500 font-mono">
                                {item.stockMinimo}
                            </td>
                            <td className="px-6 py-4 text-center">
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                                    <AlertCircle size={12} className="mr-1" />
                                    Bajo Stock
                                </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                                <button
                                    onClick={() => handleViewDetails(item)}
                                    className="text-blue-600 hover:text-blue-700 font-medium text-xs py-1 px-3 border border-blue-200 rounded hover:bg-blue-50 transition-colors dark:border-blue-800 dark:hover:bg-blue-900/20"
                                >
                                    Ver Detalle
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

function CheckCircle({ size, className }: { size?: number, className?: string }) {
    // Simple inline icon component to avoid importing another one if not needed
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
    )
}
