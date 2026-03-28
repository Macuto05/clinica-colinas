"use client";

import { useEffect, useState } from "react";
import { ShoppingCart, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { ApprovalModal } from "@/components/inventory/ApprovalModal";

interface Pedido {
    pedidoId: string;
    fechaSolicitud: string;
    estado: "PENDIENTE" | "APROBADO" | "RECHAZADO" | "DESPACHADO";
    observaciones: string;
    detalles: {
        detalleId: string;
        insumo: { nombre: string; codigo: string; unidadMedida: string };
        cantidad: number;
    }[];
    solicitante: { email: string };
}

export default function CajaComprasPage() {
    const { user } = useAuth();
    const [pedidos, setPedidos] = useState<Pedido[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedPedido, setExpandedPedido] = useState<string | null>(null);
    const [processingId, setProcessingId] = useState<string | null>(null);

    // Modal State
    const [approvalModalOpen, setApprovalModalOpen] = useState(false);
    const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null);

    const fetchPedidos = async () => {
        try {
            const res = await fetch("/api/inventory/procurement", { cache: "no-store" });
            if (res.ok) setPedidos(await res.json());
        } catch (err) { console.error(err); } finally { setIsLoading(false); }
    };

    useEffect(() => {
        fetchPedidos();
    }, []);

    const handleActionClick = (pedidoId: string, action: "APROBADO" | "RECHAZADO") => {
        const pedido = pedidos.find(p => p.pedidoId === pedidoId);
        if (!pedido) return;

        if (action === "APROBADO") {
            setSelectedPedido(pedido);
            setApprovalModalOpen(true);
        } else {
            // Reject immediately (could add confirmation later)
            updatePedidoStatus(pedidoId, "RECHAZADO");
        }
    };

    const handleConfirmApproval = async (pedidoId: string, assignments: { detalleId: string, proveedorId: string }[]) => {
        if (!user || !user.id) return;
        setProcessingId(pedidoId);

        try {
            const res = await fetch(`/api/inventory/procurement/${pedidoId}/approve`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    usuarioId: user.id,
                    detalles: assignments
                })
            });

            if (res.ok) {
                setApprovalModalOpen(false);
                setSelectedPedido(null);
                setExpandedPedido(null);
                fetchPedidos();
            } else {
                const err = await res.json();
                alert(`Error: ${err.error}`);
            }
        } catch (error) {
            console.error(error);
            alert("Error al procesar la aprobación");
        } finally {
            setProcessingId(null);
        }
    };

    const updatePedidoStatus = async (pedidoId: string, newStatus: "RECHAZADO") => {
        if (!user || !user.id) return;
        setProcessingId(pedidoId);
        try {
            const res = await fetch(`/api/inventory/procurement/${pedidoId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    estado: newStatus,
                    usuarioAprueba: user.id
                })
            });
            if (res.ok) {
                fetchPedidos();
                setExpandedPedido(null);
            }
        } catch (err) { console.error(err); } finally { setProcessingId(null); }
    };

    const toggleExpand = (id: string) => {
        setExpandedPedido(expandedPedido === id ? null : id);
    };

    const pendingPedidos = pedidos.filter(p => p.estado === "PENDIENTE");
    const historyPedidos = pedidos.filter(p => p.estado !== "PENDIENTE");

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <ShoppingCart className="text-lime-600" />
                    Aprobación de Compras
                </h1>
                <p className="text-gray-500 text-sm">Gestiona rápidamente los pedidos de insumos pendientes.</p>
            </div>

            {/* Pending Section */}
            <div>
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 tracking-tight">
                    <Clock size={20} className="text-yellow-500 drop-shadow-sm" />
                    Solicitudes Pendientes ({pendingPedidos.length})
                </h2>

                <div className="space-y-4">
                    {isLoading ? (
                        <div className="p-8 text-center text-gray-500 font-medium bg-white/40 backdrop-blur-md rounded-3xl border border-white/50">Cargando pedidos...</div>
                    ) : pendingPedidos.length === 0 ? (
                        <p className="p-8 text-center text-gray-400 font-medium italic bg-white/40 backdrop-blur-md rounded-3xl border border-white/50 shadow-[0_4px_16px_0_rgba(0,0,0,0.02)]">No hay solicitudes pendientes.</p>
                    ) : (
                        pendingPedidos.map(pedido => (
                            <PedidoCard
                                key={pedido.pedidoId}
                                pedido={pedido}
                                isExpanded={expandedPedido === pedido.pedidoId}
                                isProcessing={processingId === pedido.pedidoId}
                                onToggle={() => toggleExpand(pedido.pedidoId)}
                                onAction={handleActionClick}
                            />
                        ))
                    )}
                </div>
            </div>

            <div className="border-t border-white/40" />

            {/* History Section */}
            <div>
                <h2 className="text-lg font-bold text-gray-800 mb-4 tracking-tight">Historial Reciente</h2>
                <div className="space-y-4 opacity-75 grayscale-[0.2]">
                    {historyPedidos.length === 0 ? (
                        <p className="p-8 text-center text-gray-400 font-medium italic bg-white/40 backdrop-blur-md rounded-3xl border border-white/50 shadow-[0_4px_16px_0_rgba(0,0,0,0.02)]">No hay historial.</p>
                    ) : (
                        historyPedidos.slice(0, 5).map(pedido => (
                            <PedidoCard
                                key={pedido.pedidoId}
                                pedido={pedido}
                                isExpanded={expandedPedido === pedido.pedidoId}
                                onToggle={() => toggleExpand(pedido.pedidoId)}
                                onAction={() => { }}
                                readOnly
                            />
                        ))
                    )}
                </div>
            </div>

            <ApprovalModal
                isOpen={approvalModalOpen}
                onClose={() => setApprovalModalOpen(false)}
                pedido={selectedPedido}
                onConfirm={handleConfirmApproval}
                isProcessing={!!processingId}
            />
        </div>
    );
}

function PedidoCard({ pedido, isExpanded, isProcessing, onToggle, onAction, readOnly = false }: any) {
    return (
        <div className={`bg-white/40 backdrop-blur-md rounded-3xl border transition-all shadow-[0_4px_16px_0_rgba(0,0,0,0.02)] hover:shadow-[0_8px_32px_0_rgba(0,0,0,0.06)] overflow-hidden ${isExpanded ? 'border-lime-400 shadow-[0_8px_32px_0_rgba(132,204,22,0.1)] bg-white/60' : 'border-white/50'}`}>
            <div className="p-5 flex items-center justify-between cursor-pointer" onClick={onToggle}>
                <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-2xl shadow-inner border border-white/60 ${pedido.estado === 'PENDIENTE' ? 'bg-yellow-50/80 text-yellow-600' : (pedido.estado === 'APROBADO' || pedido.estado === 'DESPACHADO') ? 'bg-green-50/80 text-green-600' : 'bg-red-50/80 text-red-600'}`}>
                        {pedido.estado === 'PENDIENTE' ? <Clock size={20} /> : (pedido.estado === 'APROBADO' || pedido.estado === 'DESPACHADO') ? <CheckCircle size={20} /> : <XCircle size={20} />}
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 text-base">Pedido #{pedido.pedidoId}</h3>
                        <p className="text-xs font-bold text-gray-500/80 uppercase tracking-wider mt-0.5">Solicitado por: {pedido.solicitante.email} • {new Date(pedido.fechaSolicitud).toLocaleDateString()}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <span className="inline-flex items-center gap-1 text-xs font-bold bg-white/50 text-gray-700 border border-white/60 rounded-full px-3 py-1.5 shadow-sm backdrop-blur-sm">
                        {pedido.detalles.length} Items
                    </span>
                    <div className="p-1.5 bg-white/50 rounded-full border border-white/60 text-gray-500">
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                </div>
            </div>

            {isExpanded && (
                <div className="p-6 border-t border-white/40 bg-white/30 backdrop-blur-md">
                    <div className="mb-4">
                        <h4 className="text-xs font-bold text-gray-500/80 uppercase tracking-wider mb-3">Detalle de Insumos</h4>
                        <div className="grid grid-cols-1 gap-2.5">
                            {pedido.detalles.map((d: any) => (
                                <div key={d.detalleId} className="flex justify-between items-center text-sm bg-white/50 border border-white/60 p-3.5 rounded-2xl shadow-inner transition-colors hover:bg-white/70">
                                    <span className="font-bold text-gray-800">{d.insumo.nombre}</span>
                                    <span className="font-black text-lime-700 bg-lime-50/80 px-2.5 py-1.5 rounded-xl border border-lime-200/50 shadow-sm">
                                        {d.cantidad} {d.insumo.unidadMedida}
                                    </span>
                                </div>
                            ))}
                        </div>
                        {pedido.observaciones && (
                            <div className="mt-4 p-4 rounded-2xl bg-white/40 border border-white/50 text-sm font-medium text-gray-600 italic shadow-inner">
                                "{pedido.observaciones}"
                            </div>
                        )}
                    </div>

                    {!readOnly && (
                        <div className="flex gap-3 justify-end mt-6">
                            <button
                                type="button"
                                disabled={isProcessing}
                                onClick={(e: any) => { e.stopPropagation(); onAction(pedido.pedidoId, "RECHAZADO"); }}
                                className="px-6 py-2.5 rounded-2xl bg-white/50 border border-red-200 text-red-600 font-bold hover:bg-red-50 transition-colors text-sm shadow-sm backdrop-blur-sm outline-none focus:ring-2 focus:ring-red-300 disabled:opacity-50"
                            >
                                Rechazar
                            </button>
                            <button
                                type="button"
                                disabled={isProcessing}
                                onClick={(e: any) => { e.stopPropagation(); onAction(pedido.pedidoId, "APROBADO"); }}
                                className="px-6 py-2.5 rounded-2xl bg-lime-500/95 hover:bg-lime-500 text-white font-bold shadow-[0_8px_20px_rgba(132,204,22,0.3)] backdrop-blur-md border border-lime-400/50 outline-none focus:ring-2 focus:ring-lime-300 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed text-sm"
                            >
                                <CheckCircle size={18} />
                                {isProcessing ? "Procesando..." : "Aprobar Pedido"}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
