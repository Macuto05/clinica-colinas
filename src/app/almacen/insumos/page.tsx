"use client";

import { useEffect, useState } from "react";
import { Package, Search, Plus, Loader2, AlertCircle, RefreshCw, MoreVertical, Edit, ClipboardList } from "lucide-react";
import { BatchDetailsModal } from "@/components/inventory/BatchDetailsModal";

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
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

    // Filters
    const [filters, setFilters] = useState({
        codigo: "",
        nombre: "",
        marca: "",
        categoria: "",
        estado: "" as "" | "ACTIVO" | "INACTIVO",
    });

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = () => setActiveMenuId(null);
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

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

    const handleOpenCreate = () => {
        setEditingInsumo(null);
        setFormData({ codigo: "", nombre: "", descripcion: "", unidadMedida: "", categoria: "", marca: "", activo: true });
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
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitLoading(true);
        setMessage(null);

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
                // setMessage({ type: 'success', text: editingInsumo ? "Insumo actualizado" : "Insumo creado correctamente" });
                setFormData({ codigo: "", nombre: "", descripcion: "", unidadMedida: "", categoria: "", marca: "", activo: true });
                setIsModalOpen(false);
                setEditingInsumo(null);
                fetchInsumos();
            } else {
                setMessage({ type: 'error', text: "Error al crear insumo" });
            }
        } catch (error) {
            setMessage({ type: 'error', text: "Error de conexión" });
        } finally {
            setSubmitLoading(false);
            // Clear message after 3s
            setTimeout(() => setMessage(null), 3000);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Package className="text-lime-600" />
                        Inventario de Insumos
                    </h1>
                    <p className="text-gray-500 text-sm">Gestiona el catálogo de productos y medicamentos.</p>
                </div>
                <button
                    onClick={handleOpenCreate}
                    className="bg-lime-600 hover:bg-lime-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
                >
                    <Plus size={18} />
                    Nuevo Insumo
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Código</label>
                        <input
                            type="text"
                            placeholder="Filtrar..."
                            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 focus:ring-2 focus:ring-lime-500 outline-none"
                            value={filters.codigo}
                            onChange={(e) => setFilters(prev => ({ ...prev, codigo: e.target.value }))}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Nombre</label>
                        <input
                            type="text"
                            placeholder="Filtrar..."
                            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 focus:ring-2 focus:ring-lime-500 outline-none"
                            value={filters.nombre}
                            onChange={(e) => setFilters(prev => ({ ...prev, nombre: e.target.value }))}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Marca</label>
                        <input
                            type="text"
                            placeholder="Filtrar..."
                            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 focus:ring-2 focus:ring-lime-500 outline-none"
                            value={filters.marca}
                            onChange={(e) => setFilters(prev => ({ ...prev, marca: e.target.value }))}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Categoría</label>
                        <select
                            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 focus:ring-2 focus:ring-lime-500 outline-none"
                            value={filters.categoria}
                            onChange={(e) => setFilters(prev => ({ ...prev, categoria: e.target.value }))}
                        >
                            <option value="">Todas</option>
                            <option value="MEDICAMENTO">Medicamento</option>
                            <option value="MATERIAL_MEDICO">Material Médico</option>
                            <option value="EQUIPO">Equipo</option>
                            <option value="PAPELERIA">Papelería</option>
                            <option value="LIMPIEZA">Limpieza</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Estado</label>
                        <select
                            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 focus:ring-2 focus:ring-lime-500 outline-none"
                            value={filters.estado}
                            onChange={(e) => setFilters(prev => ({ ...prev, estado: e.target.value as "" | "ACTIVO" | "INACTIVO" }))}
                        >
                            <option value="">Todos</option>
                            <option value="ACTIVO">Activo</option>
                            <option value="INACTIVO">Inactivo</option>
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
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900 min-h-[400px]">
                {isLoading ? (
                    <div className="p-12 flex justify-center">
                        <Loader2 className="animate-spin text-lime-600" size={32} />
                    </div>
                ) : filteredInsumos.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        No se encontraron insumos con los filtros aplicados.
                    </div>
                ) : (
                    <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                        <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-zinc-800 dark:text-gray-300">
                            <tr>
                                <th className="px-6 py-3 font-semibold">Código</th>
                                <th className="px-6 py-3 font-semibold">Nombre</th>
                                <th className="px-6 py-3 font-semibold">Marca</th>
                                <th className="px-6 py-3 font-semibold">Categoría</th>
                                <th className="px-6 py-3 font-semibold">Unidad</th>
                                <th className="px-6 py-3 font-semibold text-center">Stock Global</th>
                                <th className="px-6 py-3 font-semibold">Estado</th>
                                <th className="px-6 py-3 font-semibold text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-zinc-800 border-t border-gray-200 dark:border-zinc-800">
                            {filteredInsumos.map((insumo, index) => {
                                const isLastItems = index >= filteredInsumos.length - 2;
                                return (
                                    <tr key={insumo.insumoId} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                                        <td className="px-6 py-4 font-mono text-xs">{insumo.codigo}</td>
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                            {insumo.nombre}
                                            {insumo.descripcion && <div className="text-xs text-gray-400 font-normal">{insumo.descripcion}</div>}
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">
                                            {insumo.marca || "Genérico"}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-900/30 dark:text-blue-400">
                                                {insumo.categoria}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">{insumo.unidadMedida}</td>
                                        <td className="px-6 py-4 text-center font-bold text-gray-900 dark:text-white">
                                            {insumo.totalStock || 0}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${insumo.activo ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800'}`}>
                                                {insumo.activo ? "ACTIVO" : "INACTIVO"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="relative inline-block text-left">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveMenuId(activeMenuId === insumo.insumoId ? null : insumo.insumoId);
                                                    }}
                                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                                                >
                                                    <MoreVertical size={20} />
                                                </button>

                                                {activeMenuId === insumo.insumoId && (
                                                    <>
                                                        <div
                                                            className="fixed inset-0 z-10"
                                                            onClick={() => setActiveMenuId(null)}
                                                        />
                                                        <div className={`absolute right-0 z-20 w-56 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-zinc-800 dark:ring-zinc-700 animate-in fade-in zoom-in-95 duration-100 ${isLastItems
                                                            ? "bottom-full mb-2 origin-bottom-right"
                                                            : "mt-0 origin-top-right"
                                                            }`}>
                                                            <div className="py-1">
                                                                <button
                                                                    onClick={() => handleOpenEdit(insumo)}
                                                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-700 flex items-center gap-2"
                                                                >
                                                                    <Edit size={16} />
                                                                    Editar Insumo
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        setViewingStocksFor(insumo);
                                                                        setActiveMenuId(null);
                                                                    }}
                                                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-700 flex items-center gap-2"
                                                                >
                                                                    <ClipboardList size={16} />
                                                                    Ver Stock Detallado
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-2xl border border-gray-200 dark:border-zinc-800 max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b border-gray-200 dark:border-zinc-800 flex justify-between items-center shrink-0">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                {editingInsumo ? "Editar Insumo" : "Nuevo Insumo"}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">✕</button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Código</label>
                                    <input
                                        required
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-lime-500 outline-none transition-all"
                                        value={formData.codigo}
                                        onChange={e => setFormData({ ...formData, codigo: e.target.value })}
                                        placeholder="Ej: MED-001"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoría</label>
                                    <select
                                        required
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-lime-500 outline-none transition-all"
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

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
                                <input
                                    required
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-lime-500 outline-none transition-all"
                                    value={formData.nombre}
                                    onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                                    placeholder="Ej: Paracetamol 500mg"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Marca</label>
                                    <input
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-lime-500 outline-none transition-all"
                                        value={formData.marca}
                                        onChange={e => setFormData({ ...formData, marca: e.target.value })}
                                        placeholder="Ej: Bayer"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Dejar en blanco si es Genérico.</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Unidad</label>
                                    <select
                                        required
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-lime-500 outline-none transition-all"
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
                            </div>

                            {editingInsumo && (
                                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-lg border border-gray-100 dark:border-zinc-800">
                                    <div className={`w-10 h-6 rounded-full p-1 cursor-pointer transition-colors ${formData.activo ? 'bg-lime-600' : 'bg-gray-300 dark:bg-zinc-600'}`} onClick={() => setFormData(prev => ({ ...prev, activo: !prev.activo }))}>
                                        <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform ${formData.activo ? 'translate-x-4' : 'translate-x-0'}`} />
                                    </div>
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {formData.activo ? "Insumo Activo" : "Insumo Inactivo"}
                                    </span>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción</label>
                                <textarea
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-lime-500 outline-none transition-all"
                                    rows={2}
                                    value={formData.descripcion}
                                    onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitLoading}
                                    className="flex-1 px-4 py-2 bg-lime-600 text-white rounded-lg hover:bg-lime-700 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                                >
                                    {submitLoading && <Loader2 className="animate-spin" size={16} />}
                                    Guardar
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
