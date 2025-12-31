"use client";

import { useState } from "react";
import { BatchDetailsModal } from "./BatchDetailsModal";
import { Modal } from "@/components/ui/Modal";
import { AlertCircle, Eye, Check, ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";

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

        // Calculate suggested replenishments to reach minimum
        const replenishmentItems = items.map(item => ({
            insumoId: item.insumoId,
            cantidad: Math.max(0, item.stockMinimo - item.cantidadActual)
        })).filter(i => i.cantidad > 0);

        if (replenishmentItems.length === 0) return;

        // Encode data for URL
        const data = encodeURIComponent(JSON.stringify(replenishmentItems));
        push(`/almacen/pedidos?replenish=${data}`);
        onClose();
    };

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title="Alerta de Stock Bajo" className="max-w-4xl">
                <div className="max-h-[60vh] overflow-y-auto">
                    {items.length === 0 ? (
                        <div className="p-12 text-center text-gray-500 flex flex-col items-center">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4">
                                <Check size={24} />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Todo en orden</h3>
                            <p>No hay insumos por debajo del stock mínimo.</p>
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-zinc-800 text-xs uppercase text-gray-500 font-medium sticky top-0">
                                <tr>
                                    <th className="px-6 py-3 text-left">Insumo</th>
                                    <th className="px-6 py-3 text-center">Ubicación</th>
                                    <th className="px-6 py-3 text-center">Cantidad</th>
                                    <th className="px-6 py-3 text-center">Mínimo</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                                {items.map((item) => (
                                    <tr
                                        key={item.stockId}
                                        className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 cursor-pointer transition-colors"
                                        onClick={() => handleViewDetails(item)}
                                    >
                                        <td className="px-6 py-4 text-left">
                                            <div>
                                                <div className="font-medium text-gray-900 dark:text-gray-100">{item.insumoNombre}</div>
                                                <div className="text-xs text-gray-500 font-mono">{item.insumoCodigo}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center text-gray-600 dark:text-gray-400">
                                            {item.almacenNombre}
                                        </td>
                                        <td className="px-6 py-4 text-center font-medium text-red-600">
                                            {item.cantidadActual} {item.unidad}
                                        </td>
                                        <td className="px-6 py-4 text-center text-gray-500 font-mono">
                                            {item.stockMinimo}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-zinc-800 mt-4 px-6 pb-6">
                    <p className="text-xs text-gray-500">
                        {items.length} ítems requieren atención
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 dark:bg-zinc-800 dark:text-gray-300 dark:hover:bg-zinc-700 transition-colors"
                        >
                            Cerrar
                        </button>
                        {items.length > 0 && (
                            <button
                                onClick={handleGenerateOrder}
                                className="px-4 py-2 bg-lime-600 text-white rounded-lg hover:bg-lime-700 transition-colors shadow-sm flex items-center gap-2"
                            >
                                <ShoppingCart size={16} />
                                Generar Orden de Reposición
                            </button>
                        )}
                    </div>
                </div>
            </Modal>

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
