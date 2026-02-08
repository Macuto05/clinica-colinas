"use client";

import { useEffect, useState } from "react";
import { ClipboardList, Search, ArrowRight, ArrowLeft, ArrowUpRight, ArrowDownLeft, RefreshCw, Calendar, Filter, Loader2, FileText, XCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

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

            const res = await fetch(`/api/inventory/movements?${params.toString()}`);
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

    // Client-side filtering for search term (Insumo name/code)
    const filteredMovimientos = movimientos.filter(m => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return m.detalles.some(d =>
            d.insumo.nombre.toLowerCase().includes(term) ||
            d.insumo.codigo.toLowerCase().includes(term)
        ) || (m.referencia && m.referencia.toLowerCase().includes(term));
    });

    const getBadgeStyle = (tipo: string) => {
        switch (tipo) {
            case "ENTRADA": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
            case "SALIDA": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
            case "AJUSTE": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
            case "TRASLADO": return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
            default: return "bg-gray-100 text-gray-800";
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
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <ClipboardList className="text-lime-600" />
                        Historial de Movimientos
                    </h1>
                    <p className="text-gray-500 text-sm">Registro detallado de entradas, salidas y ajustes de inventario.</p>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar insumo o referencia..."
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 focus:ring-2 focus:ring-lime-500 outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <select
                    className="px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 focus:ring-2 focus:ring-lime-500 outline-none"
                    value={selectedAlmacen}
                    onChange={(e) => setSelectedAlmacen(e.target.value)}
                >
                    <option value="">Todos los Almacenes</option>
                    {almacenes.map(a => (
                        <option key={a.almacenId} value={a.almacenId}>{a.nombre}</option>
                    ))}
                </select>

                <select
                    className="px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 focus:ring-2 focus:ring-lime-500 outline-none"
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
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 focus:ring-2 focus:ring-lime-500 outline-none text-sm"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                    />
                </div>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900 min-h-[400px]">
                {isLoading ? (
                    <div className="p-12 flex justify-center items-center h-[400px]">
                        <Loader2 className="animate-spin text-lime-600" size={32} />
                    </div>
                ) : filteredMovimientos.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        No se encontraron movimientos registrados.
                    </div>
                ) : (
                    <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                        <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-zinc-800 dark:text-gray-300">
                            <tr>
                                <th className="px-6 py-3 font-semibold">Fecha</th>
                                <th className="px-6 py-3 font-semibold">Referencia</th>
                                <th className="px-6 py-3 font-semibold">Tipo</th>
                                <th className="px-6 py-3 font-semibold">Almacén</th>
                                <th className="px-6 py-3 font-semibold">Detalles</th>
                                <th className="px-6 py-3 font-semibold">Empleado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-zinc-800 border-t border-gray-200 dark:border-zinc-800">
                            {filteredMovimientos.map((mov) => {
                                // Format Name: First Name + First Last Name
                                let displayName = mov.usuario.email;
                                let empId = "";

                                if (mov.usuario.empleado) {
                                    const first = mov.usuario.empleado.nombres.split(' ')[0];
                                    const last = mov.usuario.empleado.apellidos.split(' ')[0];
                                    displayName = `${first} ${last}`;
                                    empId = `(#${mov.usuario.empleado.empleadoId})`;
                                }

                                return (
                                    <tr key={mov.movimientoId} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900 dark:text-white">
                                                {new Date(mov.fechaMovimiento).toLocaleDateString()}
                                            </div>
                                            <div className="text-xs text-gray-400">
                                                {new Date(mov.fechaMovimiento).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs text-gray-600 dark:text-gray-400">
                                            {mov.referencia || "-"}
                                            {mov.observaciones && <div className="text-[10px] text-gray-400 mt-1 max-w-[150px] truncate" title={mov.observaciones}>{mov.observaciones}</div>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold leading-5 ${getBadgeStyle(mov.tipoMovimiento)}`}>
                                                {getIcon(mov.tipoMovimiento)}
                                                {mov.tipoMovimiento}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {mov.almacen.nombre}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => setViewingDetails(mov)}
                                                className="p-2 text-gray-500 hover:text-lime-600 hover:bg-lime-50 rounded-full transition-colors"
                                                title="Ver detalles"
                                            >
                                                <FileText size={18} />
                                            </button>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                {displayName} <span className="text-xs opacity-70">{empId}</span>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                )}
            </div>
            {/* View Details Modal */}
            {viewingDetails && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-lg border border-gray-200 dark:border-zinc-800 flex flex-col max-h-[80vh]">
                        <div className="p-5 border-b border-gray-200 dark:border-zinc-800 flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <FileText className="text-lime-600" size={20} />
                                    Detalle del Movimiento
                                </h3>
                                <p className="text-sm text-gray-500">
                                    {new Date(viewingDetails.fechaMovimiento).toLocaleDateString()} - {viewingDetails.tipoMovimiento}
                                </p>
                            </div>
                            <button onClick={() => setViewingDetails(null)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>
                        <div className="p-5 overflow-y-auto">
                            <div className="space-y-3">
                                {viewingDetails.detalles.map((d, idx) => (
                                    <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-lg border border-gray-100 dark:border-zinc-700">
                                        <div>
                                            <p className="font-semibold text-gray-900 dark:text-white">{d.insumo.nombre}</p>
                                            <p className="text-xs text-gray-500">{d.insumo.codigo}</p>
                                            {d.lote && (
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[10px] font-mono bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300 px-1.5 py-0.5 rounded border border-blue-100 dark:border-blue-800">
                                                        Lote: {d.lote.codigo}
                                                    </span>
                                                    {d.lote.fechaVencimiento && (
                                                        <span className="text-[10px] text-gray-400">
                                                            Vence: {new Date(d.lote.fechaVencimiento).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <span className={`block font-bold ${(viewingDetails.tipoMovimiento === 'SALIDA' || viewingDetails.tipoMovimiento === 'TRASLADO' || viewingDetails.tipoMovimiento === 'AJUSTE') ? 'text-red-600' : 'text-green-600'}`}>
                                                {(viewingDetails.tipoMovimiento === 'SALIDA' || viewingDetails.tipoMovimiento === 'TRASLADO' || viewingDetails.tipoMovimiento === 'AJUSTE') ? '-' : '+'}{d.cantidad}
                                            </span>
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
                            {viewingDetails.referencia && (
                                <div className="mt-2 text-xs text-gray-400 text-right">
                                    Ref: {viewingDetails.referencia}
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
