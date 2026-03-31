"use client";

import { useEffect, useState, Suspense } from "react";
import { ClipboardList, Plus, Search, CheckCircle, XCircle, Clock, Truck, Loader2, FileText, X, Check, ArrowRight, AlertCircle, Package } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ReceivingModal } from "@/components/inventory/ReceivingModal";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";

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

export default function PedidosPage() {
    return (
        <Suspense fallback={
            <div className="p-12 flex flex-col justify-center items-center h-[400px] gap-4">
                <Loader2 className="animate-spin text-lime-600" size={40} />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cargando pedidos...</p>
            </div>
        }>
            <PedidosContent />
        </Suspense>
    );
}

function PedidosContent() {
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
                    router.replace('/almacen/pedidos');
                }
            } catch (e) {
                console.error("Failed to parse replenishment data", e);
            }
        }
    }, [searchParams, insumos, router]);

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
            const res = await fetch("/api/inventory/movements", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    tipo: "ENTRADA", 
                    pedidoId: pedidoId,
                    usuarioId: user.id, 
                    items: receivedItems
                })
            });

            if (res.ok) {
                setIsReceivingModalOpen(false);
                setReceivingOrder(null);
                fetchPedidos(); 
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

    const StatusBadge = ({ status }: { status: string }) => {
        const configs: Record<string, { label: string, color: string, icon: any }> = {
            "PENDIENTE": { label: "Pendiente", color: "bg-amber-500/10 text-amber-600 border-amber-200/50", icon: Clock },
            "APROBADO": { label: "Aprobado", color: "bg-emerald-500/10 text-emerald-600 border-emerald-200/50", icon: CheckCircle },
            "RECHAZADO": { label: "Rechazado", color: "bg-rose-500/10 text-rose-600 border-rose-200/50", icon: XCircle },
            "DESPACHADO": { label: "Despachado", color: "bg-blue-500/10 text-blue-600 border-blue-200/50", icon: Truck }
        };
        const config = configs[status] || configs["PENDIENTE"];
        const Icon = config.icon;
        
        return (
            <span className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                config.color
            )}>
                <Icon size={10} strokeWidth={3} />
                {config.label}
            </span>
        );
    };

    return (
        <div className="space-y-8 pb-20">
            <div className="bg-white/40 backdrop-blur-md border border-white/50 rounded-3xl p-8 shadow-[0_4px_16px_0_rgba(0,0,0,0.02)] flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-lime-500/10 rounded-xl">
                            <ClipboardList className="text-lime-600" size={24} />
                        </div>
                        Pedidos de Compra
                    </h1>
                    <p className="text-gray-500 text-sm font-medium mt-1">Solicita reaprovisionamiento de insumos estratégicos.</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-[#a1db4b] hover:bg-[#8cc63f] text-white px-8 py-3 rounded-2xl flex items-center gap-3 transition-all font-black uppercase tracking-widest text-xs shadow-lg shadow-lime-500/20 active:scale-95"
                >
                    <Plus size={18} strokeWidth={3} />
                    Nueva Solicitud
                </button>
            </div>

            {/* List */}
            <div className="bg-white/40 backdrop-blur-md rounded-[2.5rem] border border-white/50 overflow-hidden shadow-[0_8px_32px_0_rgba(0,0,0,0.03)] min-h-[400px]">
                {isLoading ? (
                    <div className="p-20 flex flex-col justify-center items-center h-[400px] gap-4">
                        <Loader2 className="animate-spin text-lime-600" size={40} />
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sincronizando órdenes...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/20 backdrop-blur-sm border-b border-white/40">
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]"># Pedido</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Fecha</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Estado</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Detalles</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Items</th>
                                    <th className="px-8 py-5 text-right"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/20">
                                {pedidos.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-8 py-20 text-center">
                                            <div className="w-16 h-16 bg-gray-500/5 rounded-full flex items-center justify-center text-gray-300 mx-auto mb-6 border border-white/50">
                                                <ClipboardList size={32} />
                                            </div>
                                            <p className="text-gray-400 font-bold text-sm uppercase tracking-widest">No hay pedidos registrados</p>
                                        </td>
                                    </tr>
                                ) : pedidos.map(pedido => (
                                    <tr key={pedido.pedidoId} className="hover:bg-white/60 transition-all group">
                                        <td className="px-8 py-6 font-mono text-[10px] font-black text-gray-400">
                                            <span className="bg-white/50 px-2 py-1 rounded-lg border border-white/80">#{pedido.pedidoId}</span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="text-sm font-black text-gray-900">
                                                {new Date(pedido.fechaSolicitud).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <StatusBadge status={pedido.estado} />
                                        </td>
                                        <td className="px-8 py-6">
                                            <button
                                                onClick={() => setViewingDetails(pedido)}
                                                className="p-3 text-gray-400 hover:text-lime-600 bg-white/50 hover:bg-white rounded-2xl border border-white/80 transition-all shadow-sm active:scale-90"
                                            >
                                                <FileText size={18} />
                                            </button>
                                        </td>
                                        <td className="px-8 py-6 font-black text-gray-900">
                                            {pedido.detalles.length}
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <button
                                                onClick={() => openDispatchModal(pedido)}
                                                disabled={pedido.estado !== "APROBADO"}
                                                className={cn(
                                                    "inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm active:scale-95",
                                                    pedido.estado === "APROBADO"
                                                        ? "bg-[#a1db4b] text-white hover:bg-[#8cc63f] shadow-lime-500/10"
                                                        : pedido.estado === "DESPACHADO"
                                                            ? "bg-blue-500/10 text-blue-600 border border-blue-200/50 cursor-default"
                                                            : "bg-gray-100 text-gray-400 cursor-not-allowed border border-white/50"
                                                )}
                                            >
                                                {pedido.estado === "DESPACHADO" ? <Truck size={14} /> : <Check size={14} strokeWidth={3} />}
                                                {pedido.estado === "DESPACHADO" ? "Despachado" : "Despachar"}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <AnimatePresence>
                {/* Create Modal */}
                {isCreateModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsCreateModalOpen(false)}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-2xl bg-white/70 backdrop-blur-2xl backdrop-saturate-[1.2] rounded-[2.5rem] border border-white/60 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.15)] flex flex-col max-h-[90vh] overflow-hidden"
                        >
                            <div className="p-8 border-b border-white/60 flex justify-between items-center bg-white/50">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-lime-500/10 rounded-2xl text-lime-600 shadow-sm border border-lime-200/50">
                                        <Plus size={24} strokeWidth={3} />
                                    </div>
                                    <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase tracking-widest">Nueva Solicitud</h3>
                                </div>
                                <button onClick={() => setIsCreateModalOpen(false)} className="p-2 hover:bg-gray-200/50 rounded-full transition-colors group">
                                    <X size={20} className="text-gray-400 group-hover:text-gray-900" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Buscar Insumo</label>
                                    <div className="relative group">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-lime-600 transition-colors" size={20} />
                                        <input
                                            type="text"
                                            placeholder="Escriba el nombre o código..."
                                            className="w-full pl-12 pr-6 py-4 rounded-2xl border border-white/60 bg-white/50 focus:bg-white/80 focus:ring-4 focus:ring-lime-500/10 outline-none font-bold text-gray-800 shadow-inner"
                                            value={itemSearch}
                                            onChange={e => setItemSearch(e.target.value)}
                                        />
                                    </div>
                                    {itemSearch && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="mt-2 border border-white/60 rounded-[1.5rem] max-h-56 overflow-y-auto bg-white/80 backdrop-blur-md shadow-xl custom-scrollbar"
                                        >
                                            {filteredInsumos.map(insumo => (
                                                <button
                                                    key={insumo.insumoId}
                                                    onClick={() => { handleAddItem(insumo); setItemSearch(""); }}
                                                    className="w-full text-left px-6 py-4 hover:bg-lime-50 dark:hover:bg-lime-950/20 text-sm flex justify-between items-center transition-all group"
                                                >
                                                    <span className="font-black text-gray-800 group-hover:text-lime-700 uppercase tracking-tight">{insumo.nombre}</span>
                                                    <span className="text-[10px] font-black text-gray-400 bg-white/50 px-2 py-1 rounded-lg border border-white shadow-sm uppercase">{insumo.unidadMedida}</span>
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center justify-between px-2">
                                        <span>Items Seleccionados</span>
                                        <span className="bg-lime-500/10 text-lime-700 px-2 py-0.5 rounded-full border border-lime-200/50">{selectedItems.length}</span>
                                    </h4>
                                    {selectedItems.length === 0 ? (
                                        <div className="p-12 text-center border-2 border-dashed border-gray-200 rounded-[2rem] bg-gray-500/5">
                                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest italic opacity-40">Añada insumos a la solicitud</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {selectedItems.map((item, idx) => {
                                                const insumo = insumos.find(i => i.insumoId === item.insumoId);
                                                return (
                                                    <motion.div 
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        key={idx} 
                                                        className="flex items-center gap-4 bg-white/50 backdrop-blur-sm p-4 rounded-3xl border border-white/80 shadow-sm"
                                                    >
                                                        <div className="flex-1">
                                                            <p className="font-black text-xs text-gray-900 uppercase tracking-tight">{insumo?.nombre}</p>
                                                            <p className="text-[10px] font-mono text-gray-400">{insumo?.codigo}</p>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <div className="relative">
                                                                <input
                                                                    type="number"
                                                                    min="1"
                                                                    value={item.cantidad || ""}
                                                                    onChange={(e) => handleQuantityChange(item.insumoId, e.target.value)}
                                                                    className="w-32 pl-4 pr-12 py-2 rounded-xl border border-white/60 bg-white/80 focus:ring-4 focus:ring-lime-500/10 outline-none font-black text-sm shadow-inner transition-all"
                                                                />
                                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-gray-400/60 uppercase">{insumo?.unidadMedida}</span>
                                                            </div>
                                                            <button onClick={() => handleRemoveItem(item.insumoId)} className="text-gray-400 hover:text-rose-600 p-2 transition-colors active:scale-90">
                                                                <XCircle size={20} />
                                                            </button>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Observaciones / Justificación</label>
                                    <textarea 
                                        className="w-full px-6 py-4 rounded-[1.5rem] border border-white/60 bg-white/50 focus:bg-white/80 focus:ring-4 focus:ring-lime-500/10 outline-none font-bold text-gray-800 shadow-inner transition-all" 
                                        rows={3} 
                                        placeholder="Indique el motivo del pedido..." 
                                        value={observaciones} 
                                        onChange={e => setObservaciones(e.target.value)} 
                                    />
                                </div>
                            </div>
                            <div className="p-8 border-t border-white/60 flex justify-end gap-4 bg-white/50 backdrop-blur-md">
                                <button onClick={() => setIsCreateModalOpen(false)} className="px-8 py-4 rounded-[1.5rem] font-bold text-gray-500 hover:bg-gray-200/50 transition-all uppercase tracking-widest text-[10px]">Cancelar</button>
                                <button 
                                    onClick={handleSubmit} 
                                    disabled={selectedItems.length === 0} 
                                    className="px-10 py-4 bg-[#a1db4b] text-white rounded-[1.5rem] hover:bg-[#8cc63f] font-black uppercase tracking-widest text-[10px] shadow-lg shadow-lime-500/20 active:scale-95 disabled:opacity-40 transition-all flex items-center gap-3"
                                >
                                    Enviar Pedido
                                    <ArrowRight size={16} strokeWidth={3} />
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* View Details Modal */}
                {viewingDetails && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setViewingDetails(null)}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative w-full max-w-lg bg-white/70 backdrop-blur-2xl backdrop-saturate-[1.2] rounded-[3rem] border border-white/60 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.15)] overflow-hidden"
                        >
                            <div className="p-10 border-b border-white/60 flex justify-between items-center bg-white/50">
                                <div>
                                    <h3 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-3 uppercase tracking-widest">
                                        Detalle del Pedido
                                    </h3>
                                    <p className="text-[10px] font-mono text-gray-500 font-black uppercase mt-1">ORDEN #{viewingDetails.pedidoId}</p>
                                </div>
                                <button onClick={() => setViewingDetails(null)} className="p-2 hover:bg-gray-200/50 rounded-full transition-colors group active:scale-90">
                                    <X size={20} className="text-gray-400 group-hover:text-gray-900" />
                                </button>
                            </div>
                            <div className="p-10 space-y-8 overflow-y-auto max-h-[60vh] custom-scrollbar">
                                <div className="space-y-4">
                                    {viewingDetails.detalles.map(d => (
                                        <div key={d.detalleId} className="flex justify-between items-center p-5 bg-white/50 rounded-[2rem] border border-white/80 transition-all hover:bg-white/80 group">
                                            <div>
                                                <p className="font-black text-gray-900 uppercase tracking-tight">{d.insumo.nombre}</p>
                                                <p className="text-[10px] font-mono text-gray-400 mt-1">{d.insumo.codigo}</p>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-2xl font-black text-lime-600 transition-transform group-hover:scale-110">{d.cantidad}</div>
                                                <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{d.insumo.unidadMedida}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {viewingDetails.observaciones && (
                                    <div className="p-6 bg-[#1e293b]/5 backdrop-blur-md border border-white shadow-inner rounded-[2rem] relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500/20" />
                                        <p className="text-[9px] font-black text-amber-700 uppercase tracking-widest mb-2 flex items-center gap-2">
                                            <AlertCircle size={12} />
                                            Observaciones
                                        </p>
                                        <p className="text-sm text-gray-600 font-bold italic leading-relaxed">"{viewingDetails.observaciones}"</p>
                                    </div>
                                )}
                            </div>
                            <div className="p-8 border-t border-white/60 bg-white/50 flex justify-end">
                                <button 
                                    onClick={() => setViewingDetails(null)} 
                                    className="px-10 py-4 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-gray-900/10 active:scale-95 transition-all"
                                >
                                    Cerrar Vista
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Receiving Modal */}
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
        </div>
    );
}
