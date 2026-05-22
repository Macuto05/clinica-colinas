"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ClipboardList, User, Calendar, CheckCircle2, AlertCircle, PackageCheck, Loader2, ArrowRight, X, RefreshCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Solicitud {
    solicitudInsumoId: string;
    estadoSolicitud: string;
    fechaSolicitud: string;
    fechaRespuesta?: string;
    paciente: string;
    cedula: string;
    emergenciaId: string | null;
    triage: string;
    solicitante: string;
    respondedor?: string;
    observaciones?: string;
    insumos: {
        solicitudDetalleId: string;
        insumoId: string;
        nombre: string;
        codigo: string;
        unidad: string;
        cantidad: number;
        aprobada?: number;
    }[];
}

interface PatientGroup {
    pacienteId: string;
    pacienteNombre: string;
    cedula: string;
    emergenciaId: string | null;
    triage: string;
    solicitudes: Solicitud[];
}

export default function InboxSolicitudes() {
    const [groups, setGroups] = useState<PatientGroup[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<"nuevas" | "en-piso" | "historial">("nuevas");
    const [almacenes, setAlmacenes] = useState<{ almacenId: string, nombre: string }[]>([]);
    const [selectedAlmacenId, setSelectedAlmacenId] = useState<string>("");
    const [orderAlmacenMap, setOrderAlmacenMap] = useState<Record<string, string>>({});
    const [warehouseStockMap, setWarehouseStockMap] = useState<Record<string, Record<string, number>>>({});
    const [actionStatusMap, setActionStatusMap] = useState<Record<string, { type: 'success' | 'error', message: string } | null>>({});
    const [isRejectingId, setIsRejectingId] = useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = useState<string>("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [reconcileQuantities, setReconcileQuantities] = useState<Record<string, number>>({});
    const [expandedRequests, setExpandedRequests] = useState<Set<string>>(new Set());

    const toggleRequest = (id: string) => {
        setExpandedRequests(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    // Obtener solicitudes de insumos de farmacia
    const fetchSolicitudes = async (mode: "nuevas" | "en-piso" | "historial") => {
        setIsLoading(true);
        try {
            let url = "/api/farmacia/solicitudes?group=patient";
            if (mode === "historial") url += "&history=true";
            else if (mode === "en-piso") url += "&status=APROBADA";
            else url += "&status=PENDIENTE";

            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setGroups(data);
            }
        } catch (error) {
            console.error("Error al obtener solicitudes:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Obtener lista de almacenes disponibles
    const fetchAlmacenes = async () => {
        try {
            const res = await fetch("/api/almacen/list");
            if (res.ok) {
                const data = await res.json();
                setAlmacenes(data);
                if (data.length > 0 && !selectedAlmacenId) {
                    setSelectedAlmacenId(data[0].almacenId);
                }
            }
        } catch (error) {
            console.error("Error al obtener almacenes:", error);
        }
    };

    // Obtener stock disponible de un almacén específico
    const fetchStock = async (warehouseId: string) => {
        if (!warehouseId || warehouseStockMap[warehouseId]) return;
        try {
            const res = await fetch(`/api/inventory/warehouses/${warehouseId}/stock`);
            if (res.ok) {
                const data = await res.json();
                const map: Record<string, number> = {};
                data.forEach((item: any) => {
                    map[item.insumoId] = item.cantidad;
                });
                setWarehouseStockMap(prev => ({ ...prev, [warehouseId]: map }));
            }
        } catch (error) {
            console.error("Error al obtener stock del almacén:", error);
        }
    };

    useEffect(() => {
        fetchSolicitudes(viewMode);

    }, [viewMode]);

    useEffect(() => {
        fetchAlmacenes();
    }, []);

    useEffect(() => {
        if (selectedAlmacenId && viewMode === "nuevas") {
            fetchStock(selectedAlmacenId);
        }
    }, [selectedAlmacenId, viewMode]);

    // Effect 1: Sync quantities and warehouse map when data or patient change
    useEffect(() => {
        const patient = groups.find(g => g.pacienteId === selectedPatientId);
        if (patient) {
            const map: Record<string, number> = {};
            const warehouseOrderMap: Record<string, string> = {};
            patient.solicitudes.forEach(s => {
                warehouseOrderMap[s.solicitudInsumoId] = selectedAlmacenId;
                s.insumos.forEach(i => {
                    map[i.solicitudDetalleId] = (viewMode === "en-piso") ? (i.aprobada ?? i.cantidad) : i.cantidad;
                });
            });
            setReconcileQuantities(map);
            setOrderAlmacenMap(prev => ({ ...warehouseOrderMap, ...prev })); 
        } else {
            setReconcileQuantities({});
        }
    }, [selectedPatientId, groups, viewMode, selectedAlmacenId]);

    // Effect 2: ONLY reset UI state (expansions/feedback) when context changes (Patient or Mode)
    useEffect(() => {
        setExpandedRequests(new Set());
        setActionStatusMap({}); 
        setIsRejectingId(null);
    }, [selectedPatientId, viewMode]);

    const handleDespacharPedido = async (solicitudId: string) => {
        const warehouseId = orderAlmacenMap[solicitudId] || selectedAlmacenId;
        if (!warehouseId) {
            setActionStatusMap(prev => ({ ...prev, [solicitudId]: { type: 'error', message: "No warehouse selected" } }));
            return;
        }
        
        setIsProcessing(true);
        const patient = groups.find(g => g.pacienteId === selectedPatientId);
        const sol = patient?.solicitudes.find(s => s.solicitudInsumoId === solicitudId);
        if (!sol) return;

        try {
            const res = await fetch(`/api/farmacia/solicitudes/${solicitudId}/despachar`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    almacenId: warehouseId,
                    lines: sol.insumos.map(i => ({ 
                        insumoId: i.insumoId, 
                        cantidad: reconcileQuantities[i.solicitudDetalleId] ?? i.cantidad 
                    }))
                })
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || `Error en solicitud #${solicitudId}`);
            }
            
            setActionStatusMap(prev => ({ ...prev, [solicitudId]: { type: 'success', message: "Pedido enviado a piso" } }));
            
            // Auto close after success? Or wait? 
            setTimeout(() => {
                toggleRequest(solicitudId);
                fetchSolicitudes(viewMode);
                if (warehouseId) fetchStock(warehouseId);
                setActionStatusMap(prev => ({ ...prev, [solicitudId]: null }));
            }, 2000);
        } catch (error: any) {
            console.error("Dispatch error:", error);
            setActionStatusMap(prev => ({ ...prev, [solicitudId]: { type: 'error', message: error.message } }));
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReconciliarPedido = async (solicitudId: string) => {
        setIsProcessing(true);
        const patient = groups.find(g => g.pacienteId === selectedPatientId);
        const sol = patient?.solicitudes.find(s => s.solicitudInsumoId === solicitudId);
        if (!sol) return;

        try {
            const res = await fetch(`/api/farmacia/solicitudes/${solicitudId}/reconciliar`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    lines: sol.insumos.map(i => ({ 
                        solicitudDetalleId: i.solicitudDetalleId, 
                        consumedQty: reconcileQuantities[i.solicitudDetalleId] ?? i.cantidad 
                    }))
                })
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || `Error reconciliando solicitud #${solicitudId}`);
            }
            
            setActionStatusMap(prev => ({ ...prev, [solicitudId]: { type: 'success', message: "Pedido reconciliado" } }));
            
            setTimeout(() => {
                toggleRequest(solicitudId);
                fetchSolicitudes(viewMode);
                setActionStatusMap(prev => ({ ...prev, [solicitudId]: null }));
            }, 2000);
        } catch (error: any) {
            console.error("Reconciliation error:", error);
            setActionStatusMap(prev => ({ ...prev, [solicitudId]: { type: 'error', message: error.message } }));
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRechazarPedido = async (solicitudId: string) => {
        if (!rejectionReason.trim()) {
            setActionStatusMap(prev => ({ ...prev, [solicitudId]: { type: 'error', message: "Motivo requerido" } }));
            return;
        }

        setIsProcessing(true);
        try {
            const res = await fetch(`/api/farmacia/solicitudes/${solicitudId}/rechazar`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ motivo: rejectionReason })
            });
            
            if (!res.ok) throw new Error("No se pudo rechazar");

            setActionStatusMap(prev => ({ ...prev, [solicitudId]: { type: 'success', message: "Pedido rechazado" } }));
            
            setTimeout(() => {
                toggleRequest(solicitudId);
                fetchSolicitudes(viewMode);
                setIsRejectingId(null);
                setRejectionReason("");
                setActionStatusMap(prev => ({ ...prev, [solicitudId]: null }));
            }, 2000);
        } catch (error: any) {
            console.error("Reject error:", error);
            setActionStatusMap(prev => ({ ...prev, [solicitudId]: { type: 'error', message: error.message } }));
        } finally {
            setIsProcessing(false);
        }
    };

    const selectedGroup = groups.find(g => g.pacienteId === selectedPatientId);

    const getTriageColor = (triage: string) => {
        switch (triage.toUpperCase()) {
            case "ROJO": return "bg-red-500 shadow-red-500/30";
            case "NARANJA": return "bg-orange-500 shadow-orange-500/30";
            case "AMARILLO": return "bg-amber-400 shadow-amber-400/30";
            case "VERDE": return "bg-emerald-500 shadow-emerald-500/30";
            default: return "bg-blue-500 shadow-blue-500/30";
        }
    };

    if (isLoading && groups.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Loader2 className="animate-spin text-[#a1db4b]" size={40} />
                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest animate-pulse">Cargando Canastas...</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
            {/* Sidebar / List */}
            <div className="lg:col-span-4 flex flex-col gap-4 overflow-y-auto max-h-[80vh] custom-scrollbar pr-2">
                
                {/* View Switcher Tabs */}
                <div className="flex p-1 bg-gray-100 rounded-2xl mb-4 border border-gray-200">
                    <button 
                        onClick={() => { setViewMode("nuevas"); setSelectedPatientId(null); }}
                        className={`flex-1 py-2 text-[9px] uppercase font-black tracking-widest rounded-xl transition-all ${viewMode === "nuevas" ? "bg-white text-lime-600 shadow-sm border border-lime-100" : "text-gray-400 hover:text-gray-600"}`}
                    >
                        Nuevas
                    </button>
                    <button 
                        onClick={() => { setViewMode("en-piso"); setSelectedPatientId(null); }}
                        className={`flex-1 py-2 text-[9px] uppercase font-black tracking-widest rounded-xl transition-all ${viewMode === "en-piso" ? "bg-white text-lime-600 shadow-sm border border-lime-100" : "text-gray-400 hover:text-gray-600"}`}
                    >
                        En Piso
                    </button>
                    <button 
                        onClick={() => { setViewMode("historial"); setSelectedPatientId(null); }}
                        className={`flex-1 py-2 text-[9px] uppercase font-black tracking-widest rounded-xl transition-all ${viewMode === "historial" ? "bg-white text-lime-600 shadow-sm border border-lime-100" : "text-gray-400 hover:text-gray-600"}`}
                    >
                        Historial
                    </button>
                </div>

                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        {viewMode === "nuevas" ? <ClipboardList size={14} className="text-lime-500" /> : <PackageCheck size={14} className="text-[#a1db4b]" />}
                        {viewMode === "nuevas" ? "Pacientes con Pedidos" : viewMode === "en-piso" ? "Canastas en Piso" : "Historial"}
                    </h2>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => fetchSolicitudes(viewMode)}
                            disabled={isLoading}
                            className="p-1.5 hover:bg-white rounded-lg text-gray-400 hover:text-lime-500 transition-all active:rotate-180 duration-500"
                            title="Refrescar lista"
                        >
                            <RefreshCcw size={14} className={isLoading ? "animate-spin" : ""} />
                        </button>
                        <span className="px-2 py-0.5 bg-lime-500/10 text-lime-600 rounded-full text-[10px] font-black border border-lime-200/50">
                            {groups.length}
                        </span>
                    </div>
                </div>

                <AnimatePresence mode="popLayout">
                    {groups.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white/40 backdrop-blur-sm border border-dashed border-white/60 p-12 rounded-[2rem] flex flex-col items-center text-center"
                        >
                            <PackageCheck size={48} className="text-gray-300 mb-4" />
                            <p className="text-gray-400 font-bold text-sm">No hay {viewMode === "nuevas" ? "nuevos pedidos" : viewMode === "en-piso" ? "canastas por reconciliar" : "registros en el historial"}.</p>
                        </motion.div>
                    ) : (
                        groups.map((g) => (
                            <motion.button
                                layout
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                onClick={() => setSelectedPatientId(g.pacienteId)}
                                key={g.pacienteId}
                                className={`group p-5 rounded-[1.5rem] border transition-all text-left relative overflow-hidden ${
                                    selectedPatientId === g.pacienteId
                                        ? "bg-white border-[#a1db4b] shadow-xl shadow-lime-500/10 scale-[1.02] ring-2 ring-lime-500/20"
                                        : "bg-white/40 border-white/60 hover:bg-white/70 hover:border-lime-400 hover:shadow-lg hover:shadow-lime-500/5"
                                }`}
                            >
                                {/* Status Indicator */}
                                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${viewMode === "nuevas" ? getTriageColor(g.triage) : 'bg-lime-500'}`} />

                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-[10px] font-mono font-black text-gray-400 uppercase bg-gray-100 px-2 py-0.5 rounded-full">
                                        C.I: {g.cedula}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <div className="px-2 py-0.5 bg-lime-500 text-white rounded-lg text-[8px] font-black">
                                            {g.solicitudes.length} PEDIDOS
                                        </div>
                                    </div>
                                </div>
                                <h4 className="font-black text-gray-900 tracking-tight leading-none mb-1 transition-colors">
                                    {g.pacienteNombre}
                                </h4>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">HABITACIÓN: {g.emergenciaId ? `EMG-${g.emergenciaId}` : 'CONSULTA'}</p>
                            </motion.button>
                        ))
                    )}
                </AnimatePresence>
            </div>

            {/* Detail View */}
            <div className="lg:col-span-8 flex flex-col min-h-[600px]">
                <AnimatePresence mode="wait">
                    {selectedGroup ? (
                        <motion.div
                            key={selectedPatientId}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="bg-white/70 backdrop-blur-2xl border border-white/80 rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] flex flex-col h-full overflow-hidden"
                        >
                            {/* Detail Header */}
                            <div className="p-8 border-b border-white/50 bg-white/30">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-5">
                                        <div className={`p-4 rounded-[1.5rem] text-white shadow-lg ${viewMode === "nuevas" ? getTriageColor(selectedGroup.triage) : 'bg-lime-500 shadow-lime-200'}`}>
                                            <User size={32} strokeWidth={2.5} />
                                        </div>
                                        <div>
                                            <h3 className="text-3xl font-black text-gray-900 tracking-tighter uppercase leading-none">
                                                {selectedGroup.pacienteNombre}
                                            </h3>
                                            <div className="flex items-center gap-3 mt-2">
                                                <span className="text-[10px] font-mono font-black text-gray-400 bg-white/50 px-3 py-1 rounded-full border border-white uppercase">
                                                    C.I: {selectedGroup.cedula}
                                                </span>
                                                <span className="text-[10px] font-mono font-black text-lime-600 bg-lime-50 px-3 py-1 rounded-full border border-lime-100 uppercase">
                                                    ID EMG: {selectedGroup.emergenciaId ?? 'SIN ID'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-3">
                                        <button 
                                            onClick={() => setSelectedPatientId(null)}
                                            className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-400 hover:text-gray-600 rounded-full transition-all"
                                        >
                                            <X size={20} strokeWidth={3} />
                                        </button>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Estado de Canasta</p>
                                            <span className={`px-4 py-1.5 rounded-full text-xs font-black border uppercase tracking-widest ${
                                                viewMode === "nuevas" ? 'bg-amber-500/10 text-amber-600 border-amber-200/50' :
                                                viewMode === "en-piso" ? 'bg-blue-500/10 text-blue-600 border-blue-200/50' :
                                                'bg-lime-500/10 text-lime-600 border-lime-200/50'
                                            }`}>
                                                {viewMode === "nuevas" ? 'POR PREPARAR' : viewMode === "en-piso" ? 'EN PISO / PEND. RECONCILIAR' : 'LISTO'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Main Scroll Content Area */}
                            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                                <div className="space-y-6">
                                    {selectedGroup.solicitudes.map((sol) => {
                                        const isExpanded = expandedRequests.has(sol.solicitudInsumoId);
                                        const currentWarehouseId = orderAlmacenMap[sol.solicitudInsumoId] || selectedAlmacenId;
                                        const allItemsHaveStock = sol.insumos.every(i => (warehouseStockMap[currentWarehouseId]?.[i.insumoId] || 0) >= i.cantidad);

                                        return (
                                            <div key={sol.solicitudInsumoId} 
                                                 className={`relative rounded-3xl border transition-all overflow-hidden ${
                                                     isExpanded ? 'bg-white/80 shadow-lg border-white/60' : 'bg-white/40 border-white/40 hover:bg-white/60'
                                                 }`}>
                                                                                                {/* Stack Header */}
                                                <div className="relative">
                                                    <button 
                                                        onClick={() => toggleRequest(sol.solicitudInsumoId)}
                                                        className="w-full p-5 flex items-center justify-between text-left outline-none group relative z-10"
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transform transition-transform ${isExpanded ? 'rotate-90 bg-lime-500 text-white' : 'bg-white shadow-sm text-gray-400 group-hover:scale-110'}`}>
                                                                <ArrowRight size={18} strokeWidth={3} />
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-3">
                                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Pedido #{sol.solicitudInsumoId}</p>
                                                                    {viewMode === 'nuevas' && (
                                                                        <span className={`px-2 py-0.5 text-[8px] font-black rounded-full border border-emerald-200/50 uppercase tracking-widest ${
                                                                            allItemsHaveStock
                                                                            ? 'bg-emerald-500/10 text-emerald-600'
                                                                            : 'bg-amber-500/10 text-amber-600 border-amber-200/50'
                                                                        }`}>
                                                                            {allItemsHaveStock ? 'Stock Completo' : 'Stock Parcial'}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <h4 className="font-bold text-gray-800 text-sm mt-0.5">
                                                                    {format(new Date(sol.fechaSolicitud), "EEEE d 'de' MMMM, HH:mm", { locale: es })}
                                                                </h4>
                                                            </div>
                                                        </div>
                                                        <div className="text-right flex items-center gap-4">
                                                            <div className="hidden sm:block">
                                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">Insumos</p>
                                                                <p className="text-lg font-black text-gray-900 leading-none mt-1">{sol.insumos.length}</p>
                                                            </div>
                                                            <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${isExpanded ? 'bg-lime-500 border-lime-400 text-white' : 'bg-white/50 border-white/80 text-gray-400'}`}>
                                                                {isExpanded ? <CheckCircle2 size={12} strokeWidth={3} /> : <AlertCircle size={12} strokeWidth={3} />}
                                                            </div>
                                                        </div>
                                                    </button>

                                                    {/* Inline Success/Error Overlay */}
                                                    <AnimatePresence>
                                                        {actionStatusMap[sol.solicitudInsumoId] && (
                                                            <motion.div 
                                                                initial={{ opacity: 0, scale: 0.95 }}
                                                                animate={{ opacity: 1, scale: 1 }}
                                                                exit={{ opacity: 0, scale: 1.05 }}
                                                                className={`absolute inset-0 z-20 backdrop-blur-md flex items-center justify-center rounded-3xl p-4 text-center ${
                                                                    actionStatusMap[sol.solicitudInsumoId]?.type === 'success' ? 'bg-emerald-500/10' : 'bg-red-500/10'
                                                                }`}
                                                            >
                                                                <div className="flex flex-col items-center gap-2">
                                                                    {actionStatusMap[sol.solicitudInsumoId]?.type === 'success' ? (
                                                                        <CheckCircle2 size={32} className="text-emerald-500" />
                                                                    ) : (
                                                                        <AlertCircle size={32} className="text-red-500" />
                                                                    )}
                                                                    <p className={`text-sm font-black uppercase tracking-widest ${
                                                                        actionStatusMap[sol.solicitudInsumoId]?.type === 'success' ? 'text-emerald-600' : 'text-red-600'
                                                                    }`}>
                                                                        {actionStatusMap[sol.solicitudInsumoId]?.message}
                                                                    </p>
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>


                                                {/* Stack Content */}
                                                <AnimatePresence>
                                                    {isExpanded && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: "auto", opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            transition={{ duration: 0.3, ease: "easeInOut" }}
                                                        >
                                                            <div className="px-5 pb-5 pt-2 space-y-4 border-t border-white/40">
                                                                                                                                 {/* Per-Request Warehouse & Title */}
                                                                {viewMode === "nuevas" && (
                                                                    <div className="relative group/warehouse flex items-center gap-3 p-3 bg-white/50 border border-white/80 rounded-2xl hover:bg-white hover:border-lime-200/50 transition-all cursor-pointer mb-4">
                                                                        <div className="flex-1">
                                                                            <p className="text-[9px] font-black text-lime-600 uppercase tracking-widest mb-0.5 leading-none px-1">Origen del Despacho</p>
                                                                            <div className="relative flex items-center">
                                                                                <select 
                                                                                    value={orderAlmacenMap[sol.solicitudInsumoId] || selectedAlmacenId}
                                                                                    onChange={(e) => {
                                                                                        const newAlmacenId = e.target.value;
                                                                                        setOrderAlmacenMap(prev => ({ ...prev, [sol.solicitudInsumoId]: newAlmacenId }));
                                                                                        fetchStock(newAlmacenId);
                                                                                    }}
                                                                                    className="w-full bg-transparent outline-none font-black text-sm text-gray-900 transition-all appearance-none cursor-pointer pr-6"
                                                                                >
                                                                                    <option value="">Seleccionar Almacén...</option>
                                                                                    {almacenes.map(a => (
                                                                                        <option key={a.almacenId} value={a.almacenId}>{a.nombre}</option>
                                                                                    ))}
                                                                                </select>
                                                                                <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                                                                    <ArrowRight size={14} strokeWidth={3} className="rotate-90" />
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {sol.insumos.map((insumo) => {
                                                                    const warehouseId = orderAlmacenMap[sol.solicitudInsumoId] || selectedAlmacenId;
                                                                    const availableCount = warehouseStockMap[warehouseId]?.[insumo.insumoId] || 0;

                                                                    return (
                                                                        <div key={insumo.solicitudDetalleId} 
                                                                             className="flex flex-col p-4 bg-white/50 border border-white/60 rounded-2xl hover:bg-white transition-all group relative overflow-hidden">
                                                                            
                                                                            <div className="flex items-start justify-between w-full mb-3">
                                                                                <div className="flex items-center gap-4">
                                                                                    <div className={`w-2 h-10 rounded-full ${
                                                                                        viewMode === 'historial' ? 'bg-gray-200' :
                                                                                        availableCount === 0 ? 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.4)]' :
                                                                                        availableCount >= insumo.cantidad ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]' :
                                                                                        'bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                                                                                    }`} />
                                                                                    
                                                                                    <div>
                                                                                        <p className="font-bold text-gray-900 text-sm leading-tight">{insumo.nombre}</p>
                                                                                        <p className="text-[9px] font-mono font-bold text-gray-400 uppercase tracking-tight mt-0.5">
                                                                                            {insumo.codigo} • {insumo.unidad}
                                                                                        </p>
                                                                                        {viewMode === "nuevas" && (
                                                                                            <p className="mt-2 text-[9px] font-black text-lime-600 bg-lime-50 px-2 py-1 rounded-lg border border-lime-100 flex items-center gap-1.5 w-fit uppercase tracking-wider">
                                                                                                Stock en Almacén: {availableCount}
                                                                                            </p>
                                                                                        )}
                                                                                    </div>
                                                                                </div>

                                                                                <div className="text-right">
                                                                                    {viewMode === "historial" ? (
                                                                                        <p className="text-base font-black text-lime-600">{insumo.aprobada} <span className="text-[9px] text-gray-400">/ {insumo.cantidad}</span></p>
                                                                                    ) : viewMode === "nuevas" ? (
                                                                                        <div className="flex flex-col items-end">
                                                                                            <span className="text-lg font-black text-gray-900">{insumo.cantidad}</span>
                                                                                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-0.5">{insumo.unidad} A ENVIAR</span>
                                                                                        </div>
                                                                                    ) : (
                                                                                        <div className="flex items-center bg-white/80 border border-white/60 rounded-xl overflow-hidden shadow-inner focus-within:ring-2 focus-within:ring-lime-500/20 transition-all">
                                                                                            <input 
                                                                                                type="number"
                                                                                                max={insumo.cantidad}
                                                                                                value={reconcileQuantities[insumo.solicitudDetalleId] ?? insumo.cantidad}
                                                                                                onChange={(e) => {
                                                                                                    const v = parseFloat(e.target.value);
                                                                                                    setReconcileQuantities(prev => ({ ...prev, [insumo.solicitudDetalleId]: isNaN(v) ? 0 : Math.max(0, Math.min(insumo.cantidad, v)) }));
                                                                                                }}
                                                                                                className="w-12 px-2 py-1.5 bg-transparent outline-none text-center font-black text-gray-800 text-xs sm:text-sm"
                                                                                            />
                                                                                            <div className="px-2 py-1.5 bg-gray-50 text-[9px] font-black text-gray-400 border-l border-gray-100 min-w-[35px]">
                                                                                                / {insumo.cantidad}
                                                                                            </div>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </div>

                                                                        </div>
                                                                    );
                                                                })}

                                                                {/* Per-Request Actions & Inline Forms */}
                                                                {(viewMode === "nuevas" || viewMode === "en-piso") && (
                                                                    <div className="space-y-4 pt-4 border-t border-gray-100 mt-2">
                                                                        
                                                                        {/* Inline Rejection Reason Form */}
                                                                        <AnimatePresence>
                                                                            {isRejectingId === sol.solicitudInsumoId && (
                                                                                <motion.div 
                                                                                    initial={{ height: 0, opacity: 0 }}
                                                                                    animate={{ height: "auto", opacity: 1 }}
                                                                                    exit={{ height: 0, opacity: 0 }}
                                                                                    className="bg-red-50/50 border border-red-100 p-4 rounded-2xl space-y-3"
                                                                                >
                                                                                    <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">Motivo del Rechazo</p>
                                                                                    <textarea 
                                                                                        autoFocus
                                                                                        value={rejectionReason}
                                                                                        onChange={(e) => setRejectionReason(e.target.value)}
                                                                                        placeholder="Escribe por qué se rechaza este pedido..."
                                                                                        className="w-full bg-white border border-red-100/50 rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-red-500/20 transition-all min-h-[80px]"
                                                                                    />
                                                                                    <div className="flex justify-end gap-2">
                                                                                        <button 
                                                                                            onClick={() => setIsRejectingId(null)}
                                                                                            className="px-4 py-2 text-[9px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-600"
                                                                                        >
                                                                                            Cancelar
                                                                                        </button>
                                                                                        <button 
                                                                                            onClick={() => handleRechazarPedido(sol.solicitudInsumoId)}
                                                                                            className="px-4 py-2 bg-red-500 text-white text-[9px] font-black uppercase tracking-widest rounded-lg shadow-lg shadow-red-200"
                                                                                        >
                                                                                            Confirmar Rechazo
                                                                                        </button>
                                                                                    </div>
                                                                                </motion.div>
                                                                            )}
                                                                        </AnimatePresence>

                                                                        <div className="flex items-center justify-end gap-3">
                                                                            {viewMode === "nuevas" && (
                                                                                <>
                                                                                    <button
                                                                                        disabled={isProcessing}
                                                                                        onClick={() => setIsRejectingId(sol.solicitudInsumoId)}
                                                                                        className="px-4 py-2.5 rounded-xl font-black text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all uppercase tracking-widest text-[9px] border border-transparent hover:border-red-100"
                                                                                    >
                                                                                        Rechazar Pedido
                                                                                    </button>
                                                                                    <button
                                                                                        disabled={isProcessing || !(orderAlmacenMap[sol.solicitudInsumoId] || selectedAlmacenId)}
                                                                                        onClick={() => handleDespacharPedido(sol.solicitudInsumoId)}
                                                                                        className="px-6 py-2.5 bg-[#a1db4b] text-white rounded-xl hover:bg-[#8cc63f] font-black uppercase tracking-widest text-[9px] shadow-lg shadow-lime-500/20 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-2"
                                                                                    >
                                                                                        {isProcessing ? <Loader2 size={12} className="animate-spin" /> : <PackageCheck size={12} />}
                                                                                        Enviar a Piso
                                                                                    </button>
                                                                                </>
                                                                            )}
                                                                            {viewMode === "en-piso" && (
                                                                                <button
                                                                                    disabled={isProcessing}
                                                                                    onClick={() => handleReconciliarPedido(sol.solicitudInsumoId)}
                                                                                    className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-black uppercase tracking-widest text-[9px] shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-2"
                                                                                >
                                                                                    {isProcessing ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                                                                                    Reconciliar y Facturar
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-white/30 backdrop-blur-sm border border-dashed border-white/60 rounded-[2.5rem]">
                            <motion.div
                                animate={{ y: [0, -10, 0] }}
                                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                            >
                                <ClipboardList size={64} className="text-gray-300 mb-6" />
                            </motion.div>
                            <h3 className="text-xl font-black text-gray-400 uppercase tracking-tighter">Selecciona una Solicitud</h3>
                            <p className="text-gray-400 text-[10px] uppercase font-black mt-2 tracking-widest max-w-[200px]">
                                Para ver los detalles del pedido y procesar el despacho
                            </p>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
