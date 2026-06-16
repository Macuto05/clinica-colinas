"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Package, Search, Plus, Loader2, AlertCircle, ChevronLeft, ChevronRight, MoreVertical, Edit, ClipboardList } from "lucide-react";
import { BatchDetailsModal } from "@/components/inventory/BatchDetailsModal";
import { cn } from "@/lib/utils";

interface Insumo {
    insumoId: string;
    codigo: string;
    nombre: string;
    descripcion?: string;
    unidadMedida: string;
    categoria: string;
    marca: string;
    totalStock?: number;
    activo: boolean;
}

export default function InsumosPage() {
    const [insumos, setInsumos] = useState<Insumo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingInsumo, setEditingInsumo] = useState<Insumo | null>(null);
    const [viewingStocksFor, setViewingStocksFor] = useState<Insumo | null>(null);
    const [formData, setFormData] = useState({
        codigo: "",
        nombre: "",
        descripcion: "",
        unidadMedida: "",
        categoria: "",
        marca: "",
        activo: true,
    });
    const [submitLoading, setSubmitLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [codigoError, setCodigoError] = useState<string | null>(null);
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
    const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);

    // Pagination
    const ITEMS_PER_PAGE = 5;
    const [currentPage, setCurrentPage] = useState(1);

    // Filters
    const [filters, setFilters] = useState({
        codigo: "",
        nombre: "",
        marca: "",
        categoria: "",
        estado: "" as "" | "ACTIVO" | "INACTIVO",
    });

    const fetchInsumos = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/inventory/supplies?showInactive=true`);
            if (res.ok) {
                const data = await res.json();
                setInsumos(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchInsumos();
    }, []);

    // Client-side filtering
    const filteredInsumos = insumos.filter(insumo => {
        const matchCodigo = insumo.codigo.toLowerCase().includes(filters.codigo.toLowerCase());
        const matchNombre = insumo.nombre.toLowerCase().includes(filters.nombre.toLowerCase());
        const matchMarca = insumo.marca.toLowerCase().includes(filters.marca.toLowerCase());
        const matchCategoria = filters.categoria === "" || insumo.categoria === filters.categoria;
        const matchEstado = filters.estado === "" ||
            (filters.estado === "ACTIVO" && insumo.activo) ||
            (filters.estado === "INACTIVO" && !insumo.activo);
        return matchCodigo && matchNombre && matchMarca && matchCategoria && matchEstado;
    });

    const totalPages = Math.ceil(filteredInsumos.length / ITEMS_PER_PAGE);
    const paginatedInsumos = filteredInsumos.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setCurrentPage(1);
    };

    const handleOpenCreate = () => {
        setEditingInsumo(null);
        setFormData({ codigo: "", nombre: "", descripcion: "", unidadMedida: "", categoria: "", marca: "", activo: true });
        setCodigoError(null);
        setMessage(null);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (insumo: Insumo) => {
        setEditingInsumo(insumo);
        setFormData({
            codigo: insumo.codigo,
            nombre: insumo.nombre,
            descripcion: insumo.descripcion || "",
            unidadMedida: insumo.unidadMedida,
            categoria: insumo.categoria,
            marca: insumo.marca,
            activo: insumo.activo,
        });
        setCodigoError(null);
        setMessage(null);
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitLoading(true);
        setMessage(null);
        setCodigoError(null);

        try {
            const url = "/api/inventory/supplies";
            const method = editingInsumo ? "PUT" : "POST";
            const body = editingInsumo
                ? { ...formData, insumoId: editingInsumo.insumoId }
                : formData;

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                setFormData({ codigo: "", nombre: "", descripcion: "", unidadMedida: "", categoria: "", marca: "", activo: true });
                setIsModalOpen(false);
                setEditingInsumo(null);
                fetchInsumos();
            } else {
                const data = await res.json().catch(() => ({}));
                const errorMsg = data.error || "Error al guardar insumo";
                if (res.status === 409) {
                    setCodigoError(errorMsg);
                } else {
                    setMessage({ type: 'error', text: errorMsg });
                }
            }
        } catch (error) {
            setMessage({ type: 'error', text: "Error de conexión" });
        } finally {
            setSubmitLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white/40 backdrop-blur-md border border-white/50 rounded-3xl p-6 shadow-[0_4px_16px_0_rgba(0,0,0,0.02)] flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-lime-500/10 rounded-xl">
                            <Package className="text-lime-600" size={24} />
                        </div>
                        Inventario de Insumos
                    </h1>
                    <p className="text-gray-500 text-sm font-medium mt-1">Gestiona el catálogo de productos y medicamentos.</p>
                </div>
                <button
                    onClick={handleOpenCreate}
                    className="bg-lime-500/90 hover:bg-lime-500 text-white px-6 py-2.5 rounded-2xl flex items-center gap-2 transition-all shadow-lg shadow-lime-500/20 hover:scale-105 active:scale-95 font-bold text-sm"
                >
                    <Plus size={18} />
                    Nuevo Insumo
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white/40 backdrop-blur-md border border-white/50 rounded-3xl p-6 shadow-[0_4px_16px_0_rgba(0,0,0,0.02)]">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Código</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                            <input
                                type="text"
                                placeholder="Filtrar por código..."
                                className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-white/60 bg-white/50 focus:bg-white/80 focus:ring-2 focus:ring-lime-500/50 outline-none shadow-inner transition-all placeholder:text-gray-400 font-medium"
                                value={filters.codigo}
                                onChange={(e) => handleFilterChange("codigo", e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Nombre</label>
                        <input
                            type="text"
                            placeholder="Buscar por nombre..."
                            className="w-full px-4 py-2.5 text-sm rounded-xl border border-white/60 bg-white/50 focus:bg-white/80 focus:ring-2 focus:ring-lime-500/50 outline-none shadow-inner transition-all placeholder:text-gray-400 font-medium"
                            value={filters.nombre}
                            onChange={(e) => handleFilterChange("nombre", e.target.value)}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Marca</label>
                        <input
                            type="text"
                            placeholder="Buscar por marca..."
                            className="w-full px-4 py-2.5 text-sm rounded-xl border border-white/60 bg-white/50 focus:bg-white/80 focus:ring-2 focus:ring-lime-500/50 outline-none shadow-inner transition-all placeholder:text-gray-400 font-medium"
                            value={filters.marca}
                            onChange={(e) => handleFilterChange("marca", e.target.value)}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Categoría</label>
                        <select
                            className="w-full px-4 py-2.5 text-sm rounded-xl border border-white/60 bg-white/50 focus:bg-white/80 focus:ring-2 focus:ring-lime-500/50 outline-none shadow-inner transition-all font-medium appearance-none cursor-pointer"
                            value={filters.categoria}
                            onChange={(e) => handleFilterChange("categoria", e.target.value)}
                        >
                            <option value="">Todas las categorías</option>
                            <option value="MEDICAMENTO">Medicamento</option>
                            <option value="MATERIAL_MEDICO">Material Médico</option>
                            <option value="EQUIPO">Equipo</option>
                            <option value="PAPELERIA">Papelería</option>
                            <option value="LIMPIEZA">Limpieza</option>
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Estado</label>
                        <select
                            className="w-full px-4 py-2.5 text-sm rounded-xl border border-white/60 bg-white/50 focus:bg-white/80 focus:ring-2 focus:ring-lime-500/50 outline-none shadow-inner transition-all font-medium appearance-none cursor-pointer"
                            value={filters.estado}
                            onChange={(e) => handleFilterChange("estado", e.target.value)}
                        >
                            <option value="">Ver todos</option>
                            <option value="ACTIVO">Activos</option>
                            <option value="INACTIVO">Inactivos</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Success/Error Message */}
            {message && (
                <div className={`p-4 rounded-lg flex items-center gap-2 ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    <AlertCircle size={18} />
                    {message.text}
                </div>
            )}

            {/* Table */}
            <div className="bg-white/40 backdrop-blur-md border border-white/50 rounded-3xl overflow-hidden shadow-[0_4px_16px_0_rgba(0,0,0,0.02)] min-h-[560px] flex flex-col">
                {isLoading ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-4">
                        <Loader2 className="animate-spin text-lime-600" size={40} />
                        <p className="text-sm font-bold text-gray-500 uppercase tracking-widest animate-pulse">Cargando catálogo...</p>
                    </div>
                ) : filteredInsumos.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
                        <Package className="mx-auto text-gray-300 mb-4" size={48} />
                        <p className="text-gray-500 font-medium">No se encontraron insumos con los filtros aplicados.</p>
                    </div>
                ) : (
                    <>
                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead>
                                <tr className="bg-white/30 border-b border-white/40">
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-500/80 uppercase tracking-widest">Código</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-500/80 uppercase tracking-widest">Insumo / Descripción</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-500/80 uppercase tracking-widest">Marca / Categoría</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-500/80 uppercase tracking-widest">Presentación</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-500/80 uppercase tracking-widest text-center">Stock Global</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-500/80 uppercase tracking-widest">Estado</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-500/80 uppercase tracking-widest text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/30">
                                {paginatedInsumos.map((insumo) => {
                                    return (
                                        <tr key={insumo.insumoId} className="hover:bg-white/60 transition-all duration-200 group">
                                            <td className="px-6 py-4">
                                                <span className="font-mono text-[10px] bg-white/50 px-2 py-1 rounded-md border border-white/60 text-gray-600 font-bold">
                                                    {insumo.codigo}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-900 group-hover:text-lime-700 transition-colors">
                                                    {insumo.nombre}
                                                </div>
                                                {insumo.descripcion && <div className="text-[10px] text-gray-400 font-medium mt-0.5 max-w-xs truncate">{insumo.descripcion}</div>}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-xs font-bold text-gray-700">{insumo.marca || "Genérico"}</div>
                                                <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-black text-blue-700 border border-blue-200/50 mt-1 uppercase tracking-tighter">
                                                    {insumo.categoria}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-xs font-medium text-gray-600">{insumo.unidadMedida}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={cn(
                                                    "text-sm font-black px-3 py-1 rounded-full",
                                                    (insumo.totalStock || 0) <= 0 ? "text-red-600 bg-red-100/50" : "text-gray-900 bg-white/50 border border-white/60"
                                                )}>
                                                    {insumo.totalStock || 0}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={cn(
                                                    "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border",
                                                    insumo.activo 
                                                        ? "bg-emerald-500/10 text-emerald-700 border-emerald-200/50 shadow-sm shadow-emerald-100" 
                                                        : "bg-rose-500/10 text-rose-700 border-rose-200/50 shadow-sm shadow-rose-100"
                                                )}>
                                                    <div className={cn("w-1.5 h-1.5 rounded-full", insumo.activo ? "bg-emerald-500" : "bg-rose-500")} />
                                                    {insumo.activo ? "Activo" : "Inactivo"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="relative inline-block text-left">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (activeMenuId === insumo.insumoId) {
                                                                setActiveMenuId(null);
                                                                setMenuPos(null);
                                                            } else {
                                                                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                                                const openAbove = rect.bottom + 110 > window.innerHeight;
                                                                setMenuPos({
                                                                    top: openAbove ? rect.top - 110 : rect.bottom + 6,
                                                                    right: window.innerWidth - rect.right,
                                                                });
                                                                setActiveMenuId(insumo.insumoId);
                                                            }
                                                        }}
                                                        className="text-gray-400 hover:text-lime-600 p-2 rounded-xl hover:bg-white/80 transition-all active:scale-95 border border-transparent hover:border-white/60 shadow-none hover:shadow-sm"
                                                    >
                                                        <MoreVertical size={18} />
                                                    </button>

                                                    {activeMenuId === insumo.insumoId && menuPos && createPortal(
                                                        <>
                                                            <div
                                                                className="fixed inset-0 z-[9998]"
                                                                onClick={() => { setActiveMenuId(null); setMenuPos(null); }}
                                                            />
                                                            <div
                                                                className="fixed z-[9999] w-56 rounded-2xl bg-white shadow-2xl ring-1 ring-black/10 p-1 animate-in fade-in zoom-in-95 duration-150"
                                                                style={{ top: menuPos.top, right: menuPos.right }}
                                                            >
                                                                <div className="py-1">
                                                                    <button
                                                                        onClick={() => { handleOpenEdit(insumo); setActiveMenuId(null); setMenuPos(null); }}
                                                                        className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-lime-500 hover:text-white rounded-xl flex items-center gap-3 transition-colors font-bold"
                                                                    >
                                                                        <Edit size={16} />
                                                                        Editar Insumo
                                                                    </button>
                                                                    <button
                                                                        onClick={() => {
                                                                            setViewingStocksFor(insumo);
                                                                            setActiveMenuId(null);
                                                                            setMenuPos(null);
                                                                        }}
                                                                        className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-lime-500 hover:text-white rounded-xl flex items-center gap-3 transition-colors font-bold"
                                                                    >
                                                                        <ClipboardList size={16} />
                                                                        Ver Stock Detallado
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </>,
                                                        document.body
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                        {/* Pagination footer */}
                        <div className="flex items-center justify-between px-6 py-4 border-t border-white/30 bg-white/20 mt-auto">
                            <p className="text-xs font-medium text-gray-500">
                                Mostrando <span className="font-black text-gray-700">{(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredInsumos.length)}</span> de <span className="font-black text-gray-700">{filteredInsumos.length}</span> insumos
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

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/30 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-md transition-all animate-in fade-in duration-300">
                    <div className="bg-white/70 backdrop-blur-2xl backdrop-saturate-[1.2] w-full sm:max-w-5xl rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-[0_8px_32px_0_rgba(0,0,0,0.12)] border border-white/60 max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom sm:zoom-in duration-300">
                        <div className="p-8 border-b border-white/40 flex justify-between items-center shrink-0 bg-white/30 backdrop-blur-md">
                            <div>
                                <h3 className="text-xl font-black text-gray-900 tracking-tight">
                                    {editingInsumo ? "Editar Insumo" : "Nuevo Insumo"}
                                </h3>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Completa los datos del catálogo</p>
                            </div>
                            <button onClick={() => { setIsModalOpen(false); setCodigoError(null); setMessage(null); }} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-white/50 transition-colors">✕</button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto custom-scrollbar bg-white/20">
                            <section className="bg-white/40 backdrop-blur-md border border-white/50 rounded-3xl p-6 shadow-[0_4px_16px_0_rgba(0,0,0,0.02)] space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-gray-500/80 uppercase tracking-widest px-1">Código del Insumo</label>
                                        <input
                                            required
                                            className={`w-full px-5 py-3.5 rounded-2xl focus:bg-white/80 focus:ring-2 outline-none text-sm font-medium shadow-inner transition-all placeholder:text-gray-400 ${codigoError ? "border border-red-400 bg-red-50/30 focus:ring-red-400/50" : "border border-white/60 bg-white/50 focus:ring-lime-500/50"}`}
                                            value={formData.codigo}
                                            onChange={e => { setFormData({ ...formData, codigo: e.target.value }); setCodigoError(null); }}
                                            placeholder="Ej: MED-001"
                                        />
                                        {codigoError && <p className="text-xs text-red-500 font-medium px-1 mt-1">{codigoError}</p>}
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-gray-500/80 uppercase tracking-widest px-1">Nombre Comercial / Genérico</label>
                                        <input
                                            required
                                            className="w-full px-5 py-3.5 rounded-2xl bg-white/50 border border-white/60 focus:bg-white/80 focus:ring-2 focus:ring-lime-500/50 outline-none text-sm font-medium shadow-inner transition-all placeholder:text-gray-400"
                                            value={formData.nombre}
                                            onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                                            placeholder="Ej: Paracetamol 500mg"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-gray-500/80 uppercase tracking-widest px-1">Categoría</label>
                                        <select
                                            required
                                            className="w-full px-5 py-3.5 rounded-2xl bg-white/50 border border-white/60 focus:bg-white/80 focus:ring-2 focus:ring-lime-500/50 outline-none text-sm font-medium shadow-inner transition-all appearance-none cursor-pointer"
                                            value={formData.categoria}
                                            onChange={e => setFormData({ ...formData, categoria: e.target.value })}
                                        >
                                            <option value="">Seleccionar...</option>
                                            <option value="MEDICAMENTO">Medicamento</option>
                                            <option value="MATERIAL_MEDICO">Material Médico</option>
                                            <option value="EQUIPO">Equipo</option>
                                            <option value="PAPELERIA">Papelería</option>
                                            <option value="LIMPIEZA">Limpieza</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-gray-500/80 uppercase tracking-widest px-1">Marca / Fabricante</label>
                                        <input
                                            className="w-full px-5 py-3.5 rounded-2xl bg-white/50 border border-white/60 focus:bg-white/80 focus:ring-2 focus:ring-lime-500/50 outline-none text-sm font-medium shadow-inner transition-all placeholder:text-gray-400"
                                            value={formData.marca}
                                            onChange={e => setFormData({ ...formData, marca: e.target.value })}
                                            placeholder="Ej: Bayer (opcional)"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-gray-500/80 uppercase tracking-widest px-1">Presentación</label>
                                        <select
                                            required
                                            className="w-full px-5 py-3.5 rounded-2xl bg-white/50 border border-white/60 focus:bg-white/80 focus:ring-2 focus:ring-lime-500/50 outline-none text-sm font-medium shadow-inner transition-all appearance-none cursor-pointer"
                                            value={formData.unidadMedida}
                                            onChange={e => setFormData({ ...formData, unidadMedida: e.target.value })}
                                        >
                                            <option value="">Seleccionar...</option>
                                            <option value="UNIDAD">Unidad</option>
                                            <option value="CAJA">Caja</option>
                                            <option value="FRASCO">Frasco</option>
                                            <option value="PAQUETE">Paquete</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-gray-500/80 uppercase tracking-widest px-1">Descripción corta</label>
                                        <textarea
                                            className="w-full px-5 py-3.5 rounded-2xl bg-white/50 border border-white/60 focus:bg-white/80 focus:ring-2 focus:ring-lime-500/50 outline-none text-sm font-medium shadow-inner transition-all placeholder:text-gray-400"
                                            rows={1}
                                            value={formData.descripcion}
                                            onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
                                            placeholder="Detalles adicionales..."
                                        />
                                    </div>
                                </div>

                                {editingInsumo && (
                                    <button 
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, activo: !prev.activo }))}
                                        className={cn(
                                            "w-full flex items-center justify-between p-4 rounded-2xl border transition-all",
                                            formData.activo 
                                                ? "border-emerald-500/40 bg-emerald-50/50 text-emerald-700 shadow-[0_4px_12px_rgba(16,185,129,0.1)]" 
                                                : "border-rose-500/40 bg-rose-50/50 text-rose-700 shadow-[0_4px_12px_rgba(244,63,94,0.1)]"
                                        )}
                                    >
                                        <span className="text-xs font-black uppercase tracking-widest">Estado del Insumo</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold uppercase">{formData.activo ? "Activo" : "Inactivo"}</span>
                                            <div className={cn(
                                                "w-10 h-5 rounded-full p-1 transition-colors relative",
                                                formData.activo ? "bg-emerald-500" : "bg-rose-500"
                                            )}>
                                                <div className={cn(
                                                    "w-3 h-3 rounded-full bg-white transition-transform",
                                                    formData.activo ? "translate-x-5" : "translate-x-0"
                                                )} />
                                            </div>
                                        </div>
                                    </button>
                                )}
                            </section>

                            <div className="flex gap-4 pt-2">
                                <button
                                    type="button"
                                    onClick={() => { setIsModalOpen(false); setCodigoError(null); setMessage(null); }}
                                    className="flex-1 py-4 rounded-2xl bg-white/50 border border-white/60 text-gray-700 font-bold hover:bg-white/80 transition-all text-sm shadow-sm active:scale-95"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitLoading}
                                    className="flex-1 py-4 rounded-2xl bg-[#a1db4b] hover:bg-[#8cc63f] text-white font-black uppercase tracking-widest shadow-[0_8px_20px_rgba(161,219,75,0.3)] border border-white/20 outline-none focus:ring-2 focus:ring-lime-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 active:scale-95"
                                >
                                    {submitLoading && <Loader2 className="animate-spin text-white" size={18} />}
                                    Guardar Insumo
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Batch Details Modal */}
            <BatchDetailsModal
                isOpen={!!viewingStocksFor}
                onClose={() => setViewingStocksFor(null)}
                insumo={viewingStocksFor}
            />
        </div>
    );
}
