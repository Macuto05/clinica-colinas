import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Loader2, Package, MapPin, AlertCircle, Pencil, Check, X } from "lucide-react";

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
        // Safeguard against null/NaN values from backend
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
                const data = await res.json();
                // Update local state
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

    // Helper to calculate days until expiry
    const getExpiryStatus = (dateStr: string | null) => {
        if (!dateStr) return { color: "text-gray-500", bg: "bg-gray-100", label: "No Vence", days: null };

        const today = new Date();
        const expiry = new Date(dateStr);
        const diffTime = expiry.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return { color: "text-red-700", bg: "bg-red-100", label: "Vencido", days: diffDays };
        if (diffDays < 30) return { color: "text-red-600", bg: "bg-red-50", label: "< 1 Mes", days: diffDays };
        if (diffDays < 90) return { color: "text-amber-600", bg: "bg-amber-50", label: "< 3 Meses", days: diffDays };
        return { color: "text-green-700", bg: "bg-green-50", label: "OK", days: diffDays };
    };

    if (!insumo) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Detalle de Stock por Lotes"
        >
            <div className="space-y-6 max-h-[70vh] overflow-y-auto px-1">
                {/* Header Info */}
                <div className="bg-gray-50 dark:bg-zinc-800/50 p-4 rounded-lg flex gap-4 items-start border border-gray-100 dark:border-zinc-700">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg">
                        <Package size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">{insumo.nombre}</h3>
                        <p className="text-sm text-gray-500 font-mono">{insumo.codigo}</p>

                    </div>
                </div>

                {/* Content */}
                {isLoading ? (
                    <div className="flex justify-center py-12 text-gray-400">
                        <Loader2 className="animate-spin h-8 w-8" />
                    </div>
                ) : error ? (
                    <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm text-center">
                        {error}
                    </div>
                ) : details.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                        <AlertCircle className="mx-auto h-8 w-8 mb-2 opacity-50" />
                        <p>No hay stock disponible en ningún almacén.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {details.filter(wh => !filterAlmacenId || wh.almacenId === filterAlmacenId).map((wh) => (
                            <div key={wh.almacenId} className="border border-gray-200 dark:border-zinc-700 rounded-lg overflow-hidden">
                                <div className="bg-gray-50 dark:bg-zinc-800 px-4 py-3 border-b border-gray-200 dark:border-zinc-700 flex flex-wrap items-center gap-2">
                                    <MapPin className="h-4 w-4 text-gray-400" />
                                    <h4 className="font-semibold text-gray-700 dark:text-gray-200 text-sm">
                                        {wh.almacenNombre}
                                    </h4>

                                    {/* Min Stock Editor */}
                                    <div className="ml-auto flex items-center gap-2">
                                        {editingStoreId === wh.almacenId ? (
                                            <div className="flex items-center gap-1 bg-white dark:bg-zinc-900 border border-green-500 rounded px-1 py-0.5 shadow-sm">
                                                <input
                                                    type="number"
                                                    value={tempMin}
                                                    onChange={(e) => setTempMin(e.target.value)}
                                                    className="w-12 text-xs font-medium text-gray-900 dark:text-white outline-none bg-transparent text-right"
                                                    disabled={isSaving}
                                                    autoFocus
                                                />
                                                <button onClick={() => handleSaveMin(wh.almacenId)} disabled={isSaving} className="text-green-600 hover:text-green-700 p-0.5">
                                                    {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                                                </button>
                                                <button onClick={handleCancelEdit} disabled={isSaving} className="text-red-500 hover:text-red-600 p-0.5">
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handleEditStart(wh)}
                                                className="group flex items-center gap-1 text-xs font-medium bg-white dark:bg-zinc-900 px-2 py-0.5 rounded border border-gray-200 dark:border-zinc-700 text-gray-500 hover:border-green-400 dark:hover:border-green-500 transition-all cursor-pointer"
                                                title="Editar Stock Mínimo"
                                            >
                                                <span>Mínimo:</span>
                                                <span className={`${wh.lotes.reduce((sum, l) => sum + l.cantidad, 0) <= wh.stockMinimo ? "text-red-600 font-bold" : "text-gray-700 dark:text-gray-300 group-hover:text-green-600"}`}>
                                                    {wh.stockMinimo}
                                                </span>
                                                <Pencil size={10} className="text-gray-300 group-hover:text-green-500 transition-colors opacity-0 group-hover:opacity-100" />
                                            </button>
                                        )}
                                    </div>

                                    <div className="h-4 w-px bg-gray-300 dark:bg-zinc-600 mx-1"></div>

                                    <span className="text-xs font-medium bg-white dark:bg-zinc-900 px-2 py-0.5 rounded border border-gray-200 dark:border-zinc-700 text-gray-500">
                                        Total: {wh.lotes.reduce((sum, l) => sum + l.cantidad, 0)}
                                    </span>
                                </div>

                                {wh.lotes.length > 0 ? (
                                    <table className="w-full text-sm">
                                        <thead className="bg-white dark:bg-zinc-900 text-gray-500 text-xs text-left">
                                            <tr>
                                                <th className="px-4 py-2 font-medium">Lote</th>
                                                <th className="px-4 py-2 font-medium">Fabricación</th>
                                                <th className="px-4 py-2 font-medium">Vencimiento</th>
                                                <th className="px-4 py-2 font-medium text-right">Cantidad</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                                            {wh.lotes.map((lote) => {
                                                const status = getExpiryStatus(lote.fechaVencimiento);
                                                return (
                                                    <tr key={lote.loteId} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50">
                                                        <td className="px-4 py-2 font-mono text-gray-700 dark:text-gray-300">
                                                            {lote.codigo}
                                                        </td>
                                                        <td className="px-4 py-2 text-gray-500">
                                                            {lote.fechaFabricacion ? new Date(lote.fechaFabricacion).toLocaleDateString() : '-'}
                                                        </td>
                                                        <td className="px-4 py-2">
                                                            <div className="flex items-center gap-2">
                                                                {lote.fechaVencimiento ? new Date(lote.fechaVencimiento).toLocaleDateString() : '-'}
                                                                {lote.fechaVencimiento && (
                                                                    <span className={`text-[10px] px-1.5 rounded-full ${status.bg} ${status.color}`}>
                                                                        {status.label}
                                                                    </span>
                                                                )}
                                                                {!lote.fechaVencimiento && (
                                                                    <span className="text-[10px] px-1.5 rounded-full bg-gray-100 text-gray-500 dark:bg-zinc-800">
                                                                        No Vence
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-2 text-right font-medium">
                                                            {lote.cantidad}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div className="p-4 text-center text-xs text-gray-400 italic">
                                        No hay lotes con stock, pero existe el registro del almacén.
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Modal>
    );
}
