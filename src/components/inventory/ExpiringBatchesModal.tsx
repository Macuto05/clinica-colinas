import { X, AlertOctagon, Calendar, Archive, Loader2, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

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

    if (!isOpen) return null;

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
                    // AlmacenId at root is for documentation/grouping fallback, but route.ts splits by item.almacenId
                    almacenId: item.almacen?.almacenId || item.almacenId,
                    motivo: "VENCIMIENTO",
                    items: [
                        {
                            insumoId: item.insumoId || item.insumo.insumoId,
                            loteId: item.loteId,
                            cantidad: item.cantidad,
                            almacenId: item.almacen?.almacenId || item.almacenId // CRITICAL FIX: Required for backend grouping
                        }
                    ]
                })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Error al procesar baja");
            }

            toast.success("Lote dado de baja correctamente");

            // Optimistic Update: Remove from local list immediately
            setLocalItems(prev => prev.filter(i => i.stockLoteId !== item.stockLoteId));

            // Refresh server data in background
            router.refresh();

        } catch (error: any) {
            console.error(error);
            toast.error(error.message);
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl flex flex-col">
                <div className="p-6 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center bg-white dark:bg-zinc-900 sticky top-0">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${canWriteOff ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                            {canWriteOff ? <Trash2 size={20} /> : <AlertOctagon size={20} />}
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-4">
                    {localItems.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            No hay lotes en esta categoría.
                        </div>
                    ) : (
                        localItems.map((item, index) => {
                            const isExpired = new Date(item.fechaVencimiento) < new Date();
                            const daysDiff = Math.ceil((new Date(item.fechaVencimiento).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

                            return (
                                <div key={index} className={`p-4 rounded-xl border ${canWriteOff ? 'border-red-100 bg-red-50/50 dark:bg-red-900/10 dark:border-red-800' : 'border-orange-100 bg-orange-50/50 dark:bg-orange-900/10 dark:border-orange-800'} flex justify-between items-center group`}>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-semibold text-gray-900 dark:text-white">{item.insumo.nombre}</h3>
                                            <span className="text-xs font-mono text-gray-400">{item.insumo.codigo}</span>
                                        </div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400 flex flex-col gap-1">
                                            <div className="flex items-center gap-2">
                                                <Archive size={14} />
                                                <span>Lote: <span className="font-medium text-gray-900 dark:text-gray-200">{item.codigo || item.lote?.codigo}</span></span>
                                                <span className="text-gray-300">|</span>
                                                <span>{item.almacen.nombre}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Calendar size={14} />
                                                <span>{new Date(item.fechaVencimiento).toLocaleDateString()}</span>
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${canWriteOff ? 'bg-red-200 text-red-800' : 'bg-orange-200 text-orange-800'}`}>
                                                    {canWriteOff
                                                        ? `Vencido hace ${Math.abs(daysDiff)} días`
                                                        : `Vence en ${daysDiff} días`
                                                    }
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <div className="text-right">
                                            <span className="text-2xl font-bold text-gray-900 dark:text-white">{item.cantidad}</span>
                                            <span className="text-xs text-gray-500 uppercase ml-1">{item.insumo.unidadMedida || "UND"}</span>
                                        </div>

                                        {canWriteOff && (
                                            <button
                                                onClick={() => handleWriteOff(item)}
                                                disabled={!!processingId}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                                            >
                                                {processingId === item.stockLoteId ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                                                Dar de Baja (Descarte)
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                <div className="p-4 border-t border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors shadow-sm"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
}
