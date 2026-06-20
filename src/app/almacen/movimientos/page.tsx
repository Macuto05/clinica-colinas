"use client";

import { useEffect, useState } from "react";
import { ClipboardList, Search, ArrowRight, ArrowLeft, ArrowUpRight, ArrowDownLeft, RefreshCw, Calendar, Filter, Loader2, FileText, XCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface Movimiento {
    movimientoId: string;
    tipoMovimiento: "ENTRADA" | "SALIDA" | "AJUSTE" | "TRASLADO";
    fechaMovimiento: string;
    referencia: string | null;
    observaciones: string | null;
    almacen: { nombre: string };
    usuario: {
        email: string;
        empleado?: {
            nombres: string;
            apellidos: string;
            empleadoId: string;
        } | null;
    };
    detalles: {
        insumo: { nombre: string; codigo: string; unidadMedida: string };
        cantidad: number;
        lote?: { codigo: string; fechaVencimiento: string | null };
    }[];
    pedidoCompra?: { pedidoId: string };
}

interface Almacen {
    almacenId: string;
    nombre: string;
}

export default function MovimientosPage() {
    const { user } = useAuth();
    const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
    const [almacenes, setAlmacenes] = useState<Almacen[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewingDetails, setViewingDetails] = useState<Movimiento | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    // Filters
    const [selectedAlmacen, setSelectedAlmacen] = useState("");
    const [selectedTipo, setSelectedTipo] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const fetchMovimientos = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (selectedAlmacen) params.append("almacenId", selectedAlmacen);
            if (selectedTipo) params.append("tipo", selectedTipo);
            // Search term not directly supported by API yet for simplified insumo search, 
            // but we can filter client side or implement robust search later. 
            // For now, let's rely on client side filtering for text search if API doesn't support generic search.
            if (startDate) params.append("startDate", startDate);
            if (endDate) params.append("endDate", endDate);

            setCurrentPage(1);
            const res = await fetch(`/api/inventory/movements?${params.toString()}&limit=500`);
            if (res.ok) {
                const data = await res.json();
                setMovimientos(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchAlmacenes = async () => {
        try {
            const res = await fetch("/api/inventory/warehouses");
            if (res.ok) setAlmacenes(await res.json());
        } catch (error) { console.error(error); }
    };

    useEffect(() => {
        fetchAlmacenes();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchMovimientos();
        }, 500);
        return () => clearTimeout(timer);
    }, [selectedAlmacen, selectedTipo, startDate, endDate]);

    // Reset page on text search change
    useEffect(() => { setCurrentPage(1); }, [searchTerm]);

    // Client-side filtering for search term (Insumo name/code)
    const filteredMovimientos = movimientos.filter(m => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return m.detalles.some(d =>
            d.insumo.nombre.toLowerCase().includes(term) ||
            d.insumo.codigo.toLowerCase().includes(term)
        ) || (m.referencia && m.referencia.toLowerCase().includes(term));
    });

    const totalPages = Math.ceil(filteredMovimientos.length / ITEMS_PER_PAGE);
    const paginatedMovimientos = filteredMovimientos.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const getBadgeStyle = (tipo: string) => {
        switch (tipo) {
            case "ENTRADA": return "bg-emerald-500/10 text-emerald-700 border-emerald-200/50 shadow-sm shadow-emerald-100";
            case "SALIDA": return "bg-rose-500/10 text-rose-700 border-rose-200/50 shadow-sm shadow-rose-100";
            case "AJUSTE": return "bg-blue-500/10 text-blue-700 border-blue-200/50 shadow-sm shadow-blue-100";
            case "TRASLADO": return "bg-orange-500/10 text-orange-700 border-orange-200/50 shadow-sm shadow-orange-100";
            default: return "bg-gray-500/10 text-gray-700 border-gray-200/50 shadow-sm";
        }
    };

    const getIcon = (tipo: string) => {
        switch (tipo) {
            case "ENTRADA": return <ArrowDownLeft size={16} className="text-green-600" />;
            case "SALIDA": return <ArrowUpRight size={16} className="text-red-600" />;
            default: return <RefreshCw size={16} className="text-blue-600" />;
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white/40 backdrop-blur-md border border-white/50 rounded-3xl p-6 shadow-[0_4px_16px_0_rgba(0,0,0,0.02)] flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-lime-500/10 rounded-xl">
                            <ClipboardList className="text-lime-600" size={24} />
                        </div>
                        Historial de Movimientos
                    </h1>
                    <p className="text-gray-500 text-sm font-medium mt-1">Registro detallado de entradas, salidas y ajustes de inventario.</p>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-white/40 backdrop-blur-md border border-white/50 rounded-3xl p-6 shadow-[0_4px_16px_0_rgba(0,0,0,0.02)] grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar insumo o referencia..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-white/60 bg-white/50 focus:bg-white/80 focus:ring-2 focus:ring-lime-500/50 outline-none text-sm font-medium transition-all shadow-inner"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <select
                    className="px-4 py-2.5 rounded-2xl border border-white/60 bg-white/50 focus:bg-white/80 focus:ring-2 focus:ring-lime-500/50 outline-none text-sm font-medium appearance-none cursor-pointer shadow-inner"
                    value={selectedAlmacen}
                    onChange={(e) => setSelectedAlmacen(e.target.value)}
                >
                    <option value="">Todos los Almacenes</option>
                    {almacenes.map(a => (
                        <option key={a.almacenId} value={a.almacenId}>{a.nombre}</option>
                    ))}
                </select>

                <select
                    className="px-4 py-2.5 rounded-2xl border border-white/60 bg-white/50 focus:bg-white/80 focus:ring-2 focus:ring-lime-500/50 outline-none text-sm font-medium appearance-none cursor-pointer shadow-inner"
                    value={selectedTipo}
                    onChange={(e) => setSelectedTipo(e.target.value)}
                >
                    <option value="">Todos los Tipos</option>
                    <option value="ENTRADA">Entrada</option>
                    <option value="SALIDA">Salida</option>
                    <option value="AJUSTE">Ajuste</option>
                    <option value="TRASLADO">Traslado</option>
                </select>

                <div className="flex gap-2">
                    <input
                        type="date"
                        className="w-full px-4 py-2.5 rounded-2xl border border-white/60 bg-white/50 focus:bg-white/80 focus:ring-2 focus:ring-lime-500/50 outline-none text-sm font-medium shadow-inner"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white/40 backdrop-blur-md border border-white/50 rounded-3xl overflow-hidden shadow-[0_4px_16px_0_rgba(0,0,0,0.02)] min-h-[400px] flex flex-col">
                {isLoading ? (
                    <div className="p-20 flex flex-col items-center justify-center gap-4">
                        <Loader2 className="animate-spin text-lime-600" size={40} />
                        <p className="text-sm font-bold text-gray-500 uppercase tracking-widest animate-pulse">Cargando movimientos...</p>
                    </div>
                ) : filteredMovimientos.length === 0 ? (
                    <div className="p-20 text-center">
                        <ClipboardList className="mx-auto text-gray-300 mb-4" size={48} />
                        <p className="text-gray-500 font-medium">No se encontraron movimientos registrados.</p>
                    </div>
                ) : (
                    <>
                    <div className="overflow-x-auto custom-scrollbar flex-1">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead>
                                <tr className="bg-white/30 border-b border-white/40">
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-500/80 uppercase tracking-widest">Fecha / Hora</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-500/80 uppercase tracking-widest">Referencia</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-500/80 uppercase tracking-widest">Tipo de Movimiento</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-500/80 uppercase tracking-widest">Almacén</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-500/80 uppercase tracking-widest text-center">Detalles</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-500/80 uppercase tracking-widest">Responsable</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/30">
                                {paginatedMovimientos.map((mov) => {
                                    let displayName = mov.usuario.email;
                                    let empId = "";

                                    if (mov.usuario.empleado) {
                                        const first = mov.usuario.empleado.nombres.split(' ')[0];
                                        const last = mov.usuario.empleado.apellidos.split(' ')[0];
                                        displayName = `${first} ${last}`;
                                        empId = `(#${mov.usuario.empleado.empleadoId})`;
                                    }

                                    return (
                                        <tr key={mov.movimientoId} className="hover:bg-white/60 transition-all duration-200 group">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-900 group-hover:text-lime-700 transition-colors">
                                                    {new Date(mov.fechaMovimiento).toLocaleDateString()}
                                                </div>
                                                <div className="text-[10px] text-gray-400 font-medium mt-0.5">
                                                    {new Date(mov.fechaMovimiento).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-mono text-xs text-gray-600">
                                                <span className="bg-white/50 px-2 py-0.5 rounded border border-white/60">
                                                    {mov.referencia || "-"}
                                                </span>
                                                {mov.observaciones && <div className="text-[10px] text-gray-400 mt-1 max-w-[150px] truncate italic" title={mov.observaciones}>{mov.observaciones}</div>}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={cn(
                                                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border transition-all",
                                                    getBadgeStyle(mov.tipoMovimiento)
                                                )}>
                                                    {getIcon(mov.tipoMovimiento)}
                                                    {mov.tipoMovimiento}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-gray-700">
                                                {mov.almacen.nombre}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => setViewingDetails(mov)}
                                                    className="p-2 text-gray-400 hover:text-lime-600 hover:bg-white/80 rounded-xl transition-all border border-transparent hover:border-white/60 shadow-none hover:shadow-sm active:scale-95"
                                                    title="Ver detalles"
                                                >
                                                    <FileText size={18} />
                                                </button>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-xs font-bold text-gray-900">
                                                    {displayName}
                                                </div>
                                                <div className="text-[10px] text-gray-400 font-medium">{empId}</div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>

                        {/* Pagination footer */}
                        <div className="flex items-center justify-between px-6 py-4 border-t border-white/30 bg-white/20 mt-auto">
                            <p className="text-xs font-medium text-gray-500">
                                Mostrando{" "}
                                <span className="font-black text-gray-700">
                                    {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredMovimientos.length)}
                                </span>{" "}
                                de <span className="font-black text-gray-700">{filteredMovimientos.length}</span> movimientos
                            </p>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-xl text-gray-500 hover:text-lime-700 hover:bg-white/60 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={cn(
                                            "w-8 h-8 rounded-xl text-xs font-black transition-all",
                                            page === currentPage
                                                ? "bg-lime-500 text-white shadow-md shadow-lime-500/30"
                                                : "text-gray-500 hover:text-lime-700 hover:bg-white/60"
                                        )}
                                    >
                                        {page}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-2 rounded-xl text-gray-500 hover:text-lime-700 hover:bg-white/60 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
            {/* View Details Modal */}
            {viewingDetails && (
                <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-[0_8px_32px_0_rgba(0,0,0,0.18)] border border-gray-200 flex flex-col max-h-[85vh] animate-in zoom-in duration-300 overflow-hidden">
                        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
                            <div>
                                <h3 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                                    <div className="p-2 bg-lime-500/10 rounded-xl">
                                        <FileText className="text-lime-600" size={20} />
                                    </div>
                                    Detalle del Movimiento
                                </h3>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">
                                    {new Date(viewingDetails.fechaMovimiento).toLocaleDateString()} — {viewingDetails.tipoMovimiento}
                                </p>
                            </div>
                            <button onClick={() => setViewingDetails(null)} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors">✕</button>
                        </div>
                        <div className="p-8 overflow-y-auto bg-gray-50" style={{ overscrollBehavior: 'contain' }}>
                            <div className="space-y-4">
                                {viewingDetails.detalles.map((d, idx) => (
                                    <div key={idx} className="flex justify-between items-center p-5 bg-white border border-gray-100 rounded-2xl shadow-sm group hover:border-lime-200 transition-colors">
                                        <div>
                                            <p className="font-black text-gray-900 group-hover:text-lime-700 transition-colors">{d.insumo.nombre}</p>
                                            <p className="text-[10px] font-mono text-gray-400 mt-0.5">{d.insumo.codigo}</p>
                                            {d.lote && (
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className="text-[9px] font-black uppercase tracking-tighter bg-blue-500/10 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200/50">
                                                        LOTE: {d.lote.codigo}
                                                    </span>
                                                    {d.lote.fechaVencimiento && (
                                                        <span className="text-[10px] text-gray-400 font-medium">
                                                            Vence: {new Date(d.lote.fechaVencimiento).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <div className={cn(
                                                "text-lg font-black",
                                                (viewingDetails.tipoMovimiento === 'SALIDA' || viewingDetails.tipoMovimiento === 'TRASLADO' || viewingDetails.tipoMovimiento === 'AJUSTE') ? 'text-rose-600' : 'text-emerald-600'
                                            )}>
                                                {(viewingDetails.tipoMovimiento === 'SALIDA' || viewingDetails.tipoMovimiento === 'TRASLADO' || viewingDetails.tipoMovimiento === 'AJUSTE') ? '-' : '+'}{d.cantidad}
                                            </div>
                                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{d.insumo.unidadMedida}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {viewingDetails.observaciones && (
                                <div className="mt-6 p-5 bg-amber-50 border border-amber-200/50 rounded-2xl">
                                    <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-1">Observaciones:</p>
                                    <p className="text-sm text-gray-700 font-medium italic">"{viewingDetails.observaciones}"</p>
                                </div>
                            )}
                            {viewingDetails.referencia && (
                                <div className="mt-4 text-[10px] font-black text-gray-400 text-right uppercase tracking-widest px-1">
                                    REF: {viewingDetails.referencia}
                                </div>
                            )}
                        </div>
                        <div className="p-8 border-t border-gray-100 bg-white shrink-0 text-right">
                            <button
                                onClick={() => setViewingDetails(null)}
                                className="px-8 py-3 bg-gray-100 border border-gray-200 text-gray-700 rounded-2xl text-sm font-bold transition-colors hover:bg-gray-200 active:scale-95 shadow-sm"
                            >
                                Cerrar Detalle
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
