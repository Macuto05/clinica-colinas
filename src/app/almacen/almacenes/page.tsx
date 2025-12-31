"use client";

import { useEffect, useState } from "react";
import { Factory, Search, Plus, Loader2, Edit, Trash2, Power, Package, X, MoreVertical } from "lucide-react";
import { BatchDetailsModal } from "@/components/inventory/BatchDetailsModal";

interface Almacen {
    almacenId: string;
    nombre: string;
    descripcion?: string;
    activo: boolean;
    totalItems?: number;
}

export default function AlmacenesPage() {
    const [almacenes, setAlmacenes] = useState<Almacen[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAlmacen, setEditingAlmacen] = useState<Almacen | null>(null);
    const [formData, setFormData] = useState({ nombre: "", descripcion: "", activo: true });
    const [submitLoading, setSubmitLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Stock/Details Modal State
    const [viewingWarehouse, setViewingWarehouse] = useState<Almacen | null>(null);
    const [warehouseStock, setWarehouseStock] = useState<any[]>([]);
    const [isLoadingStock, setIsLoadingStock] = useState(false);
    const [stockSearchTerm, setStockSearchTerm] = useState("");
    const [selectedInsumoForBatches, setSelectedInsumoForBatches] = useState<any | null>(null);

    const fetchAlmacenes = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/inventory/warehouses?search=${searchTerm}&showInactive=true`);
            if (res.ok) {
                const data = await res.json();
                setAlmacenes(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchAlmacenes();
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const handleOpenCreate = () => {
        setEditingAlmacen(null);
        setFormData({ nombre: "", descripcion: "", activo: true });
        setError(null);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (almacen: Almacen) => {
        setEditingAlmacen(almacen);
        setFormData({
            nombre: almacen.nombre,
            descripcion: almacen.descripcion || "",
            activo: almacen.activo,
        });
        setError(null);
        setIsModalOpen(true);
    };

    const handleViewDetails = async (almacen: Almacen) => {
        setViewingWarehouse(almacen);
        setIsLoadingStock(true);
        setWarehouseStock([]);
        setStockSearchTerm(""); // Reset search when opening modal
        try {
            const res = await fetch(`/api/inventory/warehouses/${almacen.almacenId}/stock`);
            if (res.ok) {
                setWarehouseStock(await res.json());
            }
        } catch (e) {
            console.error("Error loading stock", e);
        } finally {
            setIsLoadingStock(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitLoading(true);
        setError(null);

        try {
            const url = "/api/inventory/warehouses";
            const method = editingAlmacen ? "PUT" : "POST";
            const body = editingAlmacen
                ? { ...formData, almacenId: editingAlmacen.almacenId }
                : formData;

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                setFormData({ nombre: "", descripcion: "", activo: true });
                setIsModalOpen(false);
                setEditingAlmacen(null);
                fetchAlmacenes();
            } else {
                const data = await res.json();
                setError(data.error || "Error al guardar almacén");
            }
        } catch (error) {
            setError("Error de conexión");
        } finally {
            setSubmitLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Factory className="text-lime-600" />
                        Gestión de Almacenes
                    </h1>
                    <p className="text-gray-500 text-sm">Administra los puntos de almacenamiento de inventario.</p>
                </div>
                <button
                    onClick={handleOpenCreate}
                    suppressHydrationWarning
                    className="bg-lime-600 hover:bg-lime-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
                >
                    <Plus size={18} />
                    Nuevo Almacén
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar almacén..."
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 focus:ring-2 focus:ring-lime-500 outline-none transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Content Grid */}
            {isLoading ? (
                <div className="p-12 flex justify-center">
                    <Loader2 className="animate-spin text-lime-600" size={32} />
                </div>
            ) : almacenes.length === 0 ? (
                <div className="p-12 text-center text-gray-500 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800">
                    No se encontraron almacenes.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {almacenes.map((almacen) => (
                        <div
                            key={almacen.almacenId}
                            className={`group relative flex flex-col bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800 transition-all duration-300 hover:shadow-md cursor-pointer
                            ${almacen.activo ? "border-l-4 border-l-lime-500 hover:border-lime-200" : "border-l-4 border-l-red-500 opacity-75 hover:opacity-100 hover:border-red-200"}`}
                            onClick={() => handleViewDetails(almacen)}
                        >
                            {/* Header & Body */}
                            <div className="p-5 flex-1">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-2 rounded-lg ${almacen.activo ? 'bg-lime-50 text-lime-600 dark:bg-lime-900/20 dark:text-lime-400' : 'bg-red-100 text-red-500 dark:bg-red-900/30 dark:text-red-400'}`}>
                                        <Factory size={20} />
                                    </div>

                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleOpenEdit(almacen); }}
                                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                                        title="Configuración"
                                    >
                                        <Edit size={18} />
                                    </button>
                                </div>

                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 group-hover:text-lime-600 transition-colors">
                                        {almacen.nombre}
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 h-10">
                                        {almacen.descripcion || "Sin descripción"}
                                    </p>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-5 py-3 border-t border-gray-100 dark:border-zinc-800 flex justify-between items-center bg-gray-50/50 dark:bg-zinc-800/20">
                                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Inventario
                                </span>
                                <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                                    <Package size={14} className="text-gray-400" />
                                    <span>{almacen.totalItems || 0} Items</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-md border border-gray-200 dark:border-zinc-800 flex flex-col animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-gray-200 dark:border-zinc-800 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                {editingAlmacen ? "Editar Almacén" : "Nuevo Almacén"}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">✕</button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {error && (
                                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
                                    <AlertCircle size={16} />
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
                                <input
                                    required
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-lime-500 outline-none transition-all"
                                    value={formData.nombre}
                                    onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                                    placeholder="Ej: Almacén Principal"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción</label>
                                <textarea
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-lime-500 outline-none transition-all"
                                    rows={3}
                                    value={formData.descripcion}
                                    onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
                                    placeholder="Ubicación, propósito, etc."
                                />
                            </div>

                            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-lg border border-gray-100 dark:border-zinc-800">
                                <div
                                    className={`w-10 h-6 rounded-full p-1 cursor-pointer transition-colors ${formData.activo ? 'bg-lime-600' : 'bg-gray-300 dark:bg-zinc-600'}`}
                                    onClick={() => setFormData(prev => ({ ...prev, activo: !prev.activo }))}
                                >
                                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform ${formData.activo ? 'translate-x-4' : 'translate-x-0'}`} />
                                </div>
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {formData.activo ? "Almacén Activo" : "Almacén Inactivo (Solo lectura)"}
                                </span>
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
                isOpen={!!selectedInsumoForBatches}
                onClose={() => setSelectedInsumoForBatches(null)}
                insumo={selectedInsumoForBatches}
                filterAlmacenId={viewingWarehouse?.almacenId}
            />

            {/* View Stock Details Modal */}
            {viewingWarehouse && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-4xl border border-gray-200 dark:border-zinc-800 flex flex-col h-[70vh] animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-gray-200 dark:border-zinc-800 flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Package className="text-lime-600" />
                                    Inventario: {viewingWarehouse.nombre}
                                </h3>
                                <p className="text-sm text-gray-500">{viewingWarehouse.descripcion || "Sin descripción"}</p>
                            </div>
                            <button onClick={() => setViewingWarehouse(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-0 overflow-hidden flex-1 flex flex-col">
                            {isLoadingStock ? (
                                <div className="flex-1 flex justify-center items-center p-12">
                                    <Loader2 className="animate-spin text-lime-600" size={40} />
                                </div>
                            ) : warehouseStock.length === 0 ? (
                                <div className="flex-1 flex flex-col justify-center items-center p-12 text-gray-500">
                                    <Factory className="mb-3 opacity-20" size={48} />
                                    <p>No hay insumos registrados en este almacén.</p>
                                </div>
                            ) : (() => {
                                const filteredStock = warehouseStock.filter(item =>
                                    item.codigo.toLowerCase().includes(stockSearchTerm.toLowerCase()) ||
                                    item.nombre.toLowerCase().includes(stockSearchTerm.toLowerCase())
                                );
                                return (
                                    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
                                        {/* Search Bar */}
                                        <div className="p-4 border-b border-gray-100 dark:border-zinc-800">
                                            <div className="relative max-w-sm">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                                <input
                                                    type="text"
                                                    placeholder="Buscar por código o nombre..."
                                                    className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 focus:ring-2 focus:ring-lime-500 outline-none transition-all"
                                                    value={stockSearchTerm}
                                                    onChange={(e) => setStockSearchTerm(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div className="overflow-y-auto flex-1">
                                            {filteredStock.length === 0 ? (
                                                <div className="p-8 text-center text-gray-400">
                                                    No se encontraron resultados para "{stockSearchTerm}"
                                                </div>
                                            ) : (
                                                <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                                                    <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-zinc-800/50 dark:text-gray-300 sticky top-0 backdrop-blur-sm z-10">
                                                        <tr>
                                                            <th className="px-6 py-3 font-semibold">Código</th>
                                                            <th className="px-6 py-3 font-semibold">Nombre</th>
                                                            <th className="px-6 py-3 font-semibold">Marca</th>
                                                            <th className="px-6 py-3 font-semibold">Categoría</th>
                                                            <th className="px-6 py-3 font-semibold text-center">Cantidad</th>
                                                            <th className="px-6 py-3 font-semibold">Unidad</th>
                                                            <th className="px-6 py-3 font-semibold text-center">Detalles</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-200 dark:divide-zinc-800">
                                                        {filteredStock.map((item) => (
                                                            <tr key={item.stockId} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                                                                <td className="px-6 py-4 font-mono text-xs">{item.codigo}</td>
                                                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{item.nombre}</td>
                                                                <td className="px-6 py-4">{item.marca}</td>
                                                                <td className="px-6 py-4">
                                                                    <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-900/30 dark:text-blue-400">
                                                                        {item.categoria}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-4 text-center font-bold text-gray-900 dark:text-white text-base">
                                                                    {item.cantidad}
                                                                </td>
                                                                <td className="px-6 py-4">{item.unidadMedida}</td>
                                                                <td className="px-6 py-4 text-center">
                                                                    <button
                                                                        onClick={() => setSelectedInsumoForBatches(item)}
                                                                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
                                                                        title="Ver Detalle de Lotes"
                                                                    >
                                                                        <MoreVertical size={16} />
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            )}
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>

                        <div className="p-4 border-t border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/20 text-right">
                            <button
                                onClick={() => setViewingWarehouse(null)}
                                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm dark:bg-zinc-800 dark:border-zinc-700 dark:text-gray-300 dark:hover:bg-zinc-700 shadow-sm"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function AlertCircle({ size }: { size: number }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
    );
}
