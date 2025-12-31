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
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Clock size={20} className="text-yellow-500" />
                    Solicitudes Pendientes ({pendingPedidos.length})
                </h2>

                <div className="space-y-4">
                    {isLoading ? (
                        <div className="p-4 text-center text-gray-500">Cargando pedidos...</div>
                    ) : pendingPedidos.length === 0 ? (
                        <p className="text-gray-400 italic">No hay solicitudes pendientes.</p>
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
        <div className={`bg-white dark:bg-zinc-900 rounded-xl border transition-all ${isExpanded ? 'border-lime-500 shadow-md' : 'border-gray-200 dark:border-zinc-800'}`}>
            <div className="p-4 flex items-center justify-between cursor-pointer" onClick={onToggle}>
                <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${pedido.estado === 'PENDIENTE' ? 'bg-yellow-100 text-yellow-600' : (pedido.estado === 'APROBADO' || pedido.estado === 'DESPACHADO') ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {pedido.estado === 'PENDIENTE' ? <Clock size={20} /> : (pedido.estado === 'APROBADO' || pedido.estado === 'DESPACHADO') ? <CheckCircle size={20} /> : <XCircle size={20} />}
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
                            <Button
                                variant="danger"
                                size="sm"
                                onClick={(e: any) => { e.stopPropagation(); onAction(pedido.pedidoId, "RECHAZADO"); }}
                                isLoading={isProcessing}
                            >
                                Rechazar
                            </Button>
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={(e: any) => { e.stopPropagation(); onAction(pedido.pedidoId, "APROBADO"); }}
                                isLoading={isProcessing}
                                leftIcon={<CheckCircle size={16} />}
                            >
                                Aprobar Pedido
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
