"use client";

import { useEffect, useState } from "react";
import { ClipboardList, Plus, Search, CheckCircle, XCircle, Clock, Truck, Loader2, MoreVertical, FileText } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ReceivingModal } from "@/components/inventory/ReceivingModal";
import { Button } from "@/components/ui/Button"; // Corrected casing

interface Insumo {
    insumoId: string;
    nombre: string;
    codigo: string;
    unidadMedida: string;
}

interface Almacen {
    almacenId: string;
    nombre: string;
}

interface Pedido {
    pedidoId: string;
    fechaSolicitud: string;
    estado: "PENDIENTE" | "APROBADO" | "RECHAZADO" | "DESPACHADO";
    observaciones: string;
    detalles: {
        detalleId: string;
        insumoId: string;
        insumo: { nombre: string; unidadMedida: string; codigo: string };
        cantidad: number;
    }[];
    solicitante: { email: string };
}

import { useRouter, useSearchParams } from "next/navigation";

export default function PedidosPage() {
    const { user } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [pedidos, setPedidos] = useState<Pedido[]>([]);
    const [insumos, setInsumos] = useState<Insumo[]>([]);
    const [almacenes, setAlmacenes] = useState<Almacen[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Create Modal State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [observaciones, setObservaciones] = useState("");
    const [selectedItems, setSelectedItems] = useState<{ insumoId: string, cantidad: number }[]>([]);
    const [itemSearch, setItemSearch] = useState("");
    const [filteredInsumos, setFilteredInsumos] = useState<Insumo[]>([]);

    // Receiving (Dispatch) Modal State
    const [isReceivingModalOpen, setIsReceivingModalOpen] = useState(false);
    const [receivingOrder, setReceivingOrder] = useState<Pedido | null>(null);
    const [isProcessingDispatch, setIsProcessingDispatch] = useState(false);

    // View Details Modal State
    const [viewingDetails, setViewingDetails] = useState<Pedido | null>(null);

    // Actions Menu State
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = () => setActiveMenuId(null);
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    // Check for replenishment params
    useEffect(() => {
        const replenishData = searchParams.get('replenish');
        if (replenishData && insumos.length > 0) {
            try {
                const itemsToReplenish = JSON.parse(decodeURIComponent(replenishData));
                if (Array.isArray(itemsToReplenish)) {
                    setSelectedItems(itemsToReplenish);
                    setIsCreateModalOpen(true);
                    setObservaciones("Reposición automática por stock bajo.");
                    // Clean URL
                    router.replace('/almacen/pedidos');
                }
            } catch (e) {
                console.error("Failed to parse replenishment data", e);
            }
        }
    }, [searchParams, insumos, router]);


    const fetchPedidos = async () => {
        try {
            const res = await fetch("/api/inventory/procurement", { cache: "no-store" });
            if (res.ok) setPedidos(await res.json());
        } catch (err) { console.error(err); }
    };

    const fetchInsumos = async () => {
        try {
            const res = await fetch("/api/inventory/supplies?showInactive=false");
            if (res.ok) {
                const data = await res.json();
                setInsumos(data);
                setFilteredInsumos(data);
            }
        } catch (err) { console.error(err); }
    };

    const fetchAlmacenes = async () => {
        try {
            const res = await fetch("/api/inventory/warehouses");
            if (res.ok) setAlmacenes(await res.json());
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        Promise.all([fetchPedidos(), fetchInsumos(), fetchAlmacenes()]).finally(() => setIsLoading(false));
    }, []);

    useEffect(() => {
        setFilteredInsumos(
            insumos.filter(i => i.nombre.toLowerCase().includes(itemSearch.toLowerCase()) || i.codigo.includes(itemSearch))
        );
    }, [itemSearch, insumos]);

    // --- Create Logic ---
    const handleAddItem = (insumo: Insumo) => {
        if (selectedItems.some(i => i.insumoId === insumo.insumoId)) return;
        setSelectedItems([...selectedItems, { insumoId: insumo.insumoId, cantidad: 1 }]);
    };

    const handleQuantityChange = (id: string, qty: string) => {
        if (qty === "") {
            setSelectedItems(selectedItems.map(i => i.insumoId === id ? { ...i, cantidad: 0 } : i));
            return;
        }
        const val = parseFloat(qty);
        if (isNaN(val) || val < 0) return;
        setSelectedItems(selectedItems.map(i => i.insumoId === id ? { ...i, cantidad: val } : i));
    };

    const handleRemoveItem = (id: string) => {
        setSelectedItems(selectedItems.filter(i => i.insumoId !== id));
    };

    const handleSubmit = async () => {
        if (selectedItems.length === 0) return;
        if (selectedItems.some(i => i.cantidad <= 0)) {
            alert("Por favor, ingresa cantidades válidas.");
            return;
        }
        try {
            if (!user?.id) {
                alert("Error de sesión.");
                return;
            }
            const res = await fetch("/api/inventory/procurement", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    usuarioSolicita: user?.id,
                    items: selectedItems,
                    observaciones
                })
            });

            if (res.ok) {
                setIsCreateModalOpen(false);
                setSelectedItems([]);
                setObservaciones("");
                fetchPedidos();

            } else {
                alert("Error al enviar solicitud.");
            }
        } catch (err) { console.error(err); alert("Error de conexión."); }
    };

    // --- Dispatch Logic ---
    const openDispatchModal = (pedido: Pedido) => {
        setReceivingOrder(pedido);
        setIsReceivingModalOpen(true);
    };

    const handleConfirmDispatch = async (pedidoId: string, receivedItems: any[]) => {
        if (!user?.id) return;
        setIsProcessingDispatch(true);

        try {
            // First validation: ensure warehouse is selected (though ReceivingModal should handle this)
            // But ReceivingModal payload structure is flat items, we need to map them to backend structure
            // Backend expects: { tipo: "ENTRADA", pedidoId, usuarioId, items: [{insumoId, cantidad, almacenId, loteCodigo, fechaVencimiento...}] }

            // We need to inject the default warehouse ID if not present, or better yet, make sure ReceivingModal handles it?
            // ReceivingModal collects loteCodigo, fechaVencimiento, quantidade. It does NOT currently have a Warehouse selector per item.
            // Assumption: Store in default warehouse (Main) or we need to add warehouse selection to ReceivingModal.
            // For now, let's use the first available warehouse for all items.

            // ReceivingModal now handles warehouse selection per item (globally for the order)
            // So we just pass the itemsPayload directly as they should already have almacenId

            const res = await fetch("/api/inventory/movements", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    tipo: "ENTRADA", // Mapped to COMPRA/ENTRADA logic
                    pedidoId: pedidoId,
                    usuarioId: user.id, // Who is receiving
                    items: receivedItems
                })
            });

            if (res.ok) {
                setIsReceivingModalOpen(false);
                setReceivingOrder(null);

                fetchPedidos(); // Refresh status
            } else {
                const err = await res.json();
                alert("Error al despachar: " + err.error);
            }
        } catch (error) {
            console.error(error);
            alert("Error de conexión.");
        } finally {
            setIsProcessingDispatch(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "PENDIENTE": return <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-semibold leading-5"><Clock size={12} /> Pendiente</span>;
            case "APROBADO": return <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold leading-5"><CheckCircle size={12} /> Aprobado</span>;
            case "RECHAZADO": return <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-semibold leading-5"><XCircle size={12} /> Rechazado</span>;
            case "DESPACHADO": return <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold leading-5"><Truck size={12} /> Despachado</span>;
            default: return null;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <ClipboardList className="text-lime-600" />
                        Pedidos de Compra
                    </h1>
                    <p className="text-gray-500 text-sm">Solicita reaprovisionamiento de insumos.</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-lime-600 hover:bg-lime-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
                >
                    <Plus size={18} />
                    Nueva Solicitud
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por ID..."
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 focus:ring-2 focus:ring-lime-500 outline-none transition-all"
                    />
                </div>
            </div>

            {/* List */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900 min-h-[400px]">
                {isLoading ? (
                    <div className="p-12 flex justify-center items-center h-[400px]">
                        <Loader2 className="animate-spin text-lime-600" size={32} />
                    </div>
                ) : (
                    <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                        <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-zinc-800 dark:text-gray-300">
                            <tr>
                                <th className="px-6 py-3 font-semibold"># Pedido</th>
                                <th className="px-6 py-3 font-semibold">Fecha</th>
                                <th className="px-6 py-3 font-semibold">Estado</th>
                                <th className="px-6 py-3 font-semibold">Insumos</th>
                                <th className="px-6 py-3 font-semibold">Cant. Items</th>
                                <th className="px-6 py-3 font-semibold text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-zinc-800 border-t border-gray-200 dark:border-zinc-800">
                            {pedidos.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                                        No has realizado pedidos recientes.
                                    </td>
                                </tr>
                            ) : pedidos.map(pedido => (
                                <tr key={pedido.pedidoId} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                                    <td className="px-6 py-4 font-mono text-xs text-gray-900 dark:text-white">#{pedido.pedidoId}</td>
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                        {new Date(pedido.fechaSolicitud).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        {getStatusBadge(pedido.estado)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setViewingDetails(pedido); }}
                                            className="p-2 text-gray-500 hover:text-lime-600 hover:bg-lime-50 rounded-full transition-colors"
                                            title="Ver lista de insumos"
                                        >
                                            <FileText size={18} />
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">
                                        {pedido.detalles.length}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openDispatchModal(pedido);
                                            }}
                                            disabled={pedido.estado !== "APROBADO"}
                                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shadow-sm ${pedido.estado === "APROBADO"
                                                ? "bg-lime-600 text-white hover:bg-lime-700 dark:bg-lime-600 dark:hover:bg-lime-700"
                                                : "bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-zinc-800 dark:text-zinc-600"
                                                }`}
                                        >
                                            {pedido.estado === "DESPACHADO" ? <CheckCircle size={14} /> : <Truck size={14} />}
                                            {pedido.estado === "DESPACHADO" ? "Despachado" : "Despachar"}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Create Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-2xl border border-gray-200 dark:border-zinc-800 flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-gray-200 dark:border-zinc-800 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Nueva Solicitud de Pedido</h3>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* ... Search Logic (same as before) ... */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Buscar Insumo</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Escribe para buscar..."
                                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 focus:ring-2 focus:ring-lime-500 outline-none"
                                        value={itemSearch}
                                        onChange={e => setItemSearch(e.target.value)}
                                    />
                                </div>
                                {itemSearch && (
                                    <div className="mt-2 border rounded-lg max-h-40 overflow-y-auto bg-white dark:bg-zinc-800 shadow-sm border-gray-200 dark:border-zinc-700">
                                        {filteredInsumos.map(insumo => (
                                            <button
                                                key={insumo.insumoId}
                                                onClick={() => { handleAddItem(insumo); setItemSearch(""); }}
                                                className="w-full text-left px-4 py-2 hover:bg-lime-50 dark:hover:bg-lime-900/20 text-sm flex justify-between"
                                            >
                                                <span>{insumo.nombre}</span>
                                                <span className="text-gray-400 text-xs">{insumo.unidadMedida}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {/* Selected Items */}
                            <div>
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Items Seleccionados</h4>
                                {selectedItems.length === 0 ? (
                                    <p className="text-sm text-gray-400 italic text-center py-4 border rounded-lg border-dashed">No hay items seleccionados.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {selectedItems.map((item, idx) => {
                                            const insumo = insumos.find(i => i.insumoId === item.insumoId);
                                            return (
                                                <div key={idx} className="flex items-center gap-4 bg-gray-50 dark:bg-zinc-800/50 p-2 rounded-lg border border-gray-100 dark:border-zinc-800">
                                                    <div className="flex-1">
                                                        <p className="font-medium text-sm text-gray-900 dark:text-white">{insumo?.nombre}</p>
                                                        <p className="text-xs text-gray-500">{insumo?.codigo}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            value={item.cantidad || ""}
                                                            onChange={(e) => handleQuantityChange(item.insumoId, e.target.value)}
                                                            className="w-20 px-2 py-1 rounded border border-gray-300 dark:border-zinc-700 text-center text-sm bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-lime-500 outline-none"
                                                        />
                                                        <span className="text-xs text-gray-500 w-12">{insumo?.unidadMedida}</span>
                                                    </div>
                                                    <button onClick={() => handleRemoveItem(item.insumoId)} className="text-red-400 hover:text-red-600 p-1"><XCircle size={18} /></button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Observaciones</label>
                                <textarea className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-lime-500 outline-none" rows={2} placeholder="Detalles..." value={observaciones} onChange={e => setObservaciones(e.target.value)} />
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-200 dark:border-zinc-800 flex justify-end gap-3">
                            <button onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                            <button onClick={handleSubmit} disabled={selectedItems.length === 0} className="px-4 py-2 bg-lime-600 text-white rounded-lg hover:bg-lime-700 disabled:opacity-50 transition-colors">Enviar Solicitud</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Receiving (Dispatch) Modal */}
            {receivingOrder && (
                <ReceivingModal
                    pedido={receivingOrder}
                    isOpen={isReceivingModalOpen}
                    onClose={() => setIsReceivingModalOpen(false)}
                    onConfirm={handleConfirmDispatch}
                    isProcessing={isProcessingDispatch}
                    almacenes={almacenes}
                />
            )}

            {/* View Details Modal */}
            {viewingDetails && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-lg border border-gray-200 dark:border-zinc-800 flex flex-col max-h-[80vh]">
                        <div className="p-5 border-b border-gray-200 dark:border-zinc-800 flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <FileText className="text-lime-600" size={20} />
                                    Detalle de Insumos
                                </h3>
                                <p className="text-sm text-gray-500">Pedido #{viewingDetails.pedidoId}</p>
                            </div>
                            <button onClick={() => setViewingDetails(null)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>
                        <div className="p-5 overflow-y-auto">
                            <div className="space-y-3">
                                {viewingDetails.detalles.map(d => (
                                    <div key={d.detalleId} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-lg border border-gray-100 dark:border-zinc-700">
                                        <div>
                                            <p className="font-semibold text-gray-900 dark:text-white">{d.insumo.nombre}</p>
                                            <p className="text-xs text-gray-500">{d.insumo.codigo}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="block font-bold text-lime-600">{d.cantidad}</span>
                                            <span className="text-xs text-gray-400">{d.insumo.unidadMedida}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {viewingDetails.observaciones && (
                                <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/30 rounded-lg">
                                    <p className="text-xs font-bold text-yellow-700 dark:text-yellow-500 mb-1">Observaciones:</p>
                                    <p className="text-sm text-yellow-800 dark:text-yellow-400 italic">"{viewingDetails.observaciones}"</p>
                                </div>
                            )}
                        </div>
                        <div className="p-5 border-t border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/20 text-right">
                            <button onClick={() => setViewingDetails(null)} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-gray-800 dark:text-white rounded-lg text-sm font-medium transition-colors">
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
