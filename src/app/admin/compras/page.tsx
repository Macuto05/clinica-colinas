"use client";

import { useEffect, useState } from "react";
import { ShoppingCart, CheckCircle, XCircle, Search, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface Pedido {
    pedidoId: string;
    fechaSolicitud: string;
    estado: "PENDIENTE" | "APROBADO" | "RECHAZADO";
    observaciones: string;
    detalles: {
        detalleId: string;
        insumo: { nombre: string; codigo: string; unidadMedida: string };
        cantidad: number;
    }[];
    solicitante: { email: string };
}

export default function AdminComprasPage() {
    const { user } = useAuth(); // We'll use user.usuarioId as approver
    const [pedidos, setPedidos] = useState<Pedido[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedPedido, setExpandedPedido] = useState<string | null>(null);

    const fetchPedidos = async () => {
        try {
            // Fetch only PENDING initially, or all to show history? 
            // Let's fetch all but sort/filter in UI or fetch PENDING by default
            const res = await fetch("/api/inventory/procurement");
            if (res.ok) setPedidos(await res.json());
        } catch (err) { console.error(err); } finally { setIsLoading(false); }
    };

    useEffect(() => {
        fetchPedidos();
    }, []);

    const handleStatusUpdate = async (pedidoId: string, newStatus: "APROBADO" | "RECHAZADO") => {
        if (!confirm(`¿Estás seguro de ${newStatus === "APROBADO" ? "APROBAR" : "RECHAZAR"} este pedido?`)) return;

        try {
            const res = await fetch(`/api/inventory/procurement/${pedidoId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    estado: newStatus,
                    usuarioAprueba: user?.id
                })
            });

            if (res.ok) {
                fetchPedidos(); // Refresh
                setExpandedPedido(null);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const toggleExpand = (id: string) => {
        setExpandedPedido(expandedPedido === id ? null : id);
    };

    // Separate lists
    const pendingPedidos = pedidos.filter(p => p.estado === "PENDIENTE");
    const historyPedidos = pedidos.filter(p => p.estado !== "PENDIENTE");

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <ShoppingCart className="text-lime-600" />
                    Gestión de Compras
                </h1>
                <p className="text-gray-500 text-sm">Aprueba o rechaza solicitudes de reabastecimiento.</p>
            </div>

            {/* Pending Section */}
            <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Clock size={20} className="text-yellow-500" />
                    Solicitudes Pendientes ({pendingPedidos.length})
                </h2>

                <div className="space-y-4">
                    {pendingPedidos.length === 0 ? (
                        <p className="text-gray-400 italic">No hay solicitudes pendientes.</p>
                    ) : (
                        pendingPedidos.map(pedido => (
                            <PedidoCard
                                key={pedido.pedidoId}
                                pedido={pedido}
                                isExpanded={expandedPedido === pedido.pedidoId}
                                onToggle={() => toggleExpand(pedido.pedidoId)}
                                onAction={handleStatusUpdate}
                            />
                        ))
                    )}
                </div>
            </div>

            <div className="border-t border-gray-200 dark:border-zinc-800" />

            {/* History Section */}
            <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Historial Reciente</h2>
                <div className="space-y-4 opacity-75">
                    {historyPedidos.length === 0 ? (
                        <p className="text-gray-400 italic">No hay historial.</p>
                    ) : (
                        historyPedidos.slice(0, 5).map(pedido => (
                            <PedidoCard
                                key={pedido.pedidoId}
                                pedido={pedido}
                                isExpanded={expandedPedido === pedido.pedidoId}
                                onToggle={() => toggleExpand(pedido.pedidoId)}
                                onAction={() => { }} // No actions on history
                                readOnly
                            />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

function PedidoCard({ pedido, isExpanded, onToggle, onAction, readOnly = false }: any) {
    return (
        <div className={`bg-white dark:bg-zinc-900 rounded-xl border transition-all ${isExpanded ? 'border-lime-500 shadow-md' : 'border-gray-200 dark:border-zinc-800'}`}>
            <div className="p-4 flex items-center justify-between cursor-pointer" onClick={onToggle}>
                <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${pedido.estado === 'PENDIENTE' ? 'bg-yellow-100 text-yellow-600' : pedido.estado === 'APROBADO' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {pedido.estado === 'PENDIENTE' ? <Clock size={20} /> : pedido.estado === 'APROBADO' ? <CheckCircle size={20} /> : <XCircle size={20} />}
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white">Pedido #{pedido.pedidoId}</h3>
                        <p className="text-xs text-gray-500">Solicitado por: {pedido.solicitante.email} • {new Date(pedido.fechaSolicitud).toLocaleDateString()}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                        {pedido.detalles.length} Items
                    </span>
                    {isExpanded ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                </div>
            </div>

            {isExpanded && (
                <div className="p-4 border-t border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/30">
                    <div className="mb-4">
                        <h4 className="text-xs font-semibold uppercase text-gray-500 mb-2">Detalle de Insumos</h4>
                        <div className="grid grid-cols-1 gap-2">
                            {pedido.detalles.map((d: any) => (
                                <div key={d.detalleId} className="flex justify-between text-sm bg-white dark:bg-zinc-900 p-2 rounded border border-gray-100 dark:border-zinc-700">
                                    <span className="text-gray-800 dark:text-gray-200">{d.insumo.nombre}</span>
                                    <span className="font-mono font-medium text-gray-600 dark:text-gray-400">
                                        {d.cantidad} {d.insumo.unidadMedida}
                                    </span>
                                </div>
                            ))}
                        </div>
                        {pedido.observaciones && (
                            <div className="mt-3 text-sm text-gray-600 italic">
                                " {pedido.observaciones} "
                            </div>
                        )}
                    </div>

                    {!readOnly && (
                        <div className="flex gap-3 justify-end mt-4">
                            <button
                                onClick={(e) => { e.stopPropagation(); onAction(pedido.pedidoId, "RECHAZADO"); }}
                                className="px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors"
                            >
                                Rechazar
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); onAction(pedido.pedidoId, "APROBADO"); }}
                                className="px-4 py-2 text-white bg-lime-600 hover:bg-lime-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                            >
                                <CheckCircle size={16} /> Aprobar Pedido
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
