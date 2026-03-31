"use client";

import { useEffect, useState } from "react";
import { Factory, Search, Plus, Loader2, Edit, Trash2, Power, Package, X, MoreVertical, Info, Check, ArrowRight } from "lucide-react";
import { BatchDetailsModal } from "@/components/inventory/BatchDetailsModal";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

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
        <div className="space-y-8 pb-20">
            <div className="bg-white/40 backdrop-blur-md border border-white/50 rounded-3xl p-8 shadow-[0_4px_16px_0_rgba(0,0,0,0.02)] flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-lime-500/10 rounded-xl">
                            <Factory className="text-lime-600" size={24} />
                        </div>
                        Gestión de Almacenes
                    </h1>
                    <p className="text-gray-500 text-sm font-medium mt-1">Administra los puntos de almacenamiento y puntos de venta.</p>
                </div>
                <button
                    onClick={handleOpenCreate}
                    className="bg-[#a1db4b] hover:bg-[#8cc63f] text-white px-8 py-3 rounded-2xl flex items-center gap-3 transition-all font-black uppercase tracking-widest text-xs shadow-lg shadow-lime-500/20 active:scale-95"
                >
                    <Plus size={18} strokeWidth={3} />
                    Nuevo Almacén
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white/40 backdrop-blur-md p-6 rounded-[2rem] border border-white/50 shadow-sm">
                <div className="relative group max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-lime-600 transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar almacén por nombre..."
                        className="w-full pl-12 pr-6 py-3 rounded-2xl border border-white/60 bg-white/50 focus:bg-white/80 focus:ring-4 focus:ring-lime-500/10 outline-none font-bold text-gray-800 shadow-inner transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Content Grid */}
            {isLoading ? (
                <div className="p-20 flex flex-col justify-center items-center h-[400px] gap-4">
                    <Loader2 className="animate-spin text-lime-600" size={40} />
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sincronizando almacenes...</p>
                </div>
            ) : almacenes.length === 0 ? (
                <div className="p-12 text-center bg-white/40 backdrop-blur-md rounded-[2.5rem] border border-white/50 border-dashed">
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">No se encontraron almacenes registrados.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {almacenes.map((almacen) => (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            key={almacen.almacenId}
                            onClick={() => handleViewDetails(almacen)}
                            className={cn(
                                "group relative flex flex-col bg-white/40 backdrop-blur-md rounded-[2.5rem] border border-white/60 shadow-[0_8px_32px_0_rgba(0,0,0,0.03)] transition-all duration-500 hover:shadow-xl hover:scale-[1.02] cursor-pointer overflow-hidden",
                                !almacen.activo && "opacity-60 grayscale-[0.4]"
                            )}
                        >
                            {/* Accent Line */}
                            <div className={cn(
                                "absolute top-0 left-0 w-full h-1.5 transition-all group-hover:h-2",
                                almacen.activo ? "bg-lime-400" : "bg-rose-400"
                            )} />

                            <div className="p-8 flex-1 flex flex-col">
                                <div className="flex justify-between items-start mb-6">
                                    <div className={cn(
                                        "p-4 rounded-[1.5rem] shadow-sm border",
                                        almacen.activo ? "bg-lime-500/10 text-lime-600 border-lime-200/50" : "bg-rose-500/10 text-rose-600 border-rose-200/50"
                                    )}>
                                        <Factory size={24} />
                                    </div>

                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleOpenEdit(almacen); }}
                                        className="p-3 text-gray-400 hover:text-gray-900 bg-white/50 hover:bg-white rounded-2xl border border-white transition-all shadow-sm active:scale-90"
                                    >
                                        <Edit size={18} />
                                    </button>
                                </div>

                                <div className="space-y-3 flex-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase group-hover:text-lime-600 transition-colors">
                                            {almacen.nombre}
                                        </h3>
                                        {!almacen.activo && (
                                            <span className="text-[8px] font-black bg-rose-500/10 text-rose-600 px-2 py-0.5 rounded-full border border-rose-200/50 uppercase tracking-widest">Inactivo</span>
                                        )}
                                    </div>
                                    <p className="text-sm font-medium text-gray-500 leading-relaxed line-clamp-2 italic">
                                        {almacen.descripcion || "Sin descripción de ubicación"}
                                    </p>
                                </div>

                                <div className="mt-8 pt-6 border-t border-white/40 flex justify-between items-center">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                                        Ocupación Actual
                                    </span>
                                    <div className="flex items-center gap-2 px-4 py-1.5 bg-white/50 rounded-full border border-white shadow-inner">
                                        <Package size={14} className="text-gray-400" />
                                        <span className="text-sm font-black text-gray-900">{almacen.totalItems || 0}</span>
                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Variedades</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            <AnimatePresence>
                {/* Create/Edit Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-md bg-white/70 backdrop-blur-2xl backdrop-saturate-[1.2] rounded-[2.5rem] border border-white/60 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.15)] overflow-hidden"
                        >
                            <div className="p-8 border-b border-white/60 flex justify-between items-center bg-white/50">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-lime-500/10 rounded-2xl text-lime-600 shadow-sm border border-lime-200/50">
                                        <Factory size={24} strokeWidth={3} />
                                    </div>
                                    <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase tracking-widest">
                                        {editingAlmacen ? "Editar" : "Nuevo"} Almacén
                                    </h3>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-200/50 rounded-full transition-colors group">
                                    <X size={20} className="text-gray-400 group-hover:text-gray-900" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-8 space-y-6">
                                {error && (
                                    <div className="p-4 bg-rose-500/10 border border-rose-200 text-rose-600 text-xs font-bold rounded-2xl flex items-center gap-3 animate-pulse">
                                        <AlertCircle size={18} />
                                        {error}
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Nombre del Almacén</label>
                                    <input
                                        required
                                        className="w-full px-6 py-4 rounded-2xl border border-white/60 bg-white/50 focus:bg-white/80 focus:ring-4 focus:ring-lime-500/10 outline-none font-bold text-gray-800 shadow-inner transition-all"
                                        value={formData.nombre}
                                        onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                                        placeholder="Ej: Farmacia Central o Almacén A"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Descripción / Ubicación</label>
                                    <textarea
                                        className="w-full px-6 py-4 rounded-[1.5rem] border border-white/60 bg-white/50 focus:bg-white/80 focus:ring-4 focus:ring-lime-500/10 outline-none font-bold text-gray-800 shadow-inner transition-all"
                                        rows={3}
                                        value={formData.descripcion}
                                        onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
                                        placeholder="Detalles sobre su propósito o localización física..."
                                    />
                                </div>

                                <div className="bg-white/40 p-5 rounded-[1.5rem] border border-white shadow-sm flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-10 h-6 rounded-full p-1 cursor-pointer transition-all duration-300",
                                            formData.activo ? 'bg-[#a1db4b]' : 'bg-gray-300'
                                        )}
                                        onClick={() => setFormData(prev => ({ ...prev, activo: !prev.activo }))}
                                        >
                                            <div className={cn(
                                                "w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-300",
                                                formData.activo ? 'translate-x-4' : 'translate-x-0'
                                            )} />
                                        </div>
                                        <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest">
                                            {formData.activo ? "Estado Activo" : "Estado Inactivo"}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 py-4 rounded-2xl font-bold text-gray-500 hover:bg-gray-200/50 transition-all uppercase tracking-widest text-[10px]"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitLoading}
                                        className="flex-1 py-4 bg-[#a1db4b] text-white rounded-2xl hover:bg-[#8cc63f] font-black uppercase tracking-widest text-[10px] shadow-lg shadow-lime-500/20 active:scale-95 disabled:opacity-40 transition-all flex justify-center items-center gap-3"
                                    >
                                        {submitLoading ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} strokeWidth={3} />}
                                        {editingAlmacen ? "Actualizar" : "Crear Almacén"}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}

                {/* View Stock Details Modal */}
                {viewingWarehouse && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setViewingWarehouse(null)}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative w-full max-w-5xl bg-white/70 backdrop-blur-2xl backdrop-saturate-[1.2] rounded-[3rem] border border-white/60 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.15)] flex flex-col h-[85vh] overflow-hidden"
                        >
                            <div className="p-10 border-b border-white/60 flex justify-between items-center bg-white/50">
                                <div className="flex items-center gap-5">
                                    <div className="p-4 bg-lime-500/10 rounded-[1.5rem] text-lime-600 border border-lime-200/50 shadow-sm">
                                        <Package size={28} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-gray-900 tracking-tight uppercase tracking-widest">
                                            Inventario de {viewingWarehouse.nombre}
                                        </h3>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1 italic leading-relaxed line-clamp-1">{viewingWarehouse.descripcion || "Sin descripción de ubicación"}</p>
                                    </div>
                                </div>
                                <button onClick={() => setViewingWarehouse(null)} className="p-3 hover:bg-gray-200/50 rounded-full transition-colors group active:scale-90">
                                    <X size={24} className="text-gray-400 group-hover:text-gray-900" />
                                </button>
                            </div>

                            <div className="flex-1 flex flex-col overflow-hidden">
                                {isLoadingStock ? (
                                    <div className="flex-1 flex flex-col justify-center items-center gap-4">
                                        <Loader2 className="animate-spin text-lime-600" size={50} />
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Escaneando existencias...</p>
                                    </div>
                                ) : warehouseStock.length === 0 ? (
                                    <div className="flex-1 flex flex-col justify-center items-center p-20 text-center">
                                        <div className="w-24 h-24 bg-gray-500/5 rounded-full flex items-center justify-center text-gray-300 mb-8 border border-white/50">
                                            <Package size={48} />
                                        </div>
                                        <p className="text-gray-400 font-black text-sm uppercase tracking-widest">Este almacén se encuentra vacío</p>
                                    </div>
                                ) : (() => {
                                    const filteredStock = warehouseStock.filter(item =>
                                        item.codigo.toLowerCase().includes(stockSearchTerm.toLowerCase()) ||
                                        item.nombre.toLowerCase().includes(stockSearchTerm.toLowerCase())
                                    );
                                    return (
                                        <div className="flex flex-col flex-1 min-h-0">
                                            {/* Search Bar */}
                                            <div className="p-8 bg-white/20 border-b border-white/40">
                                                <div className="relative group max-w-md">
                                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-lime-600 transition-colors" size={20} />
                                                    <input
                                                        type="text"
                                                        placeholder="Filtrar por código o nombre..."
                                                        className="w-full pl-12 pr-6 py-3 rounded-2xl border border-white/60 bg-white/40 focus:bg-white/80 focus:ring-4 focus:ring-lime-500/10 outline-none font-bold text-gray-800 shadow-inner transition-all sm:text-sm"
                                                        value={stockSearchTerm}
                                                        onChange={(e) => setStockSearchTerm(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                            
                                            <div className="flex-1 overflow-auto custom-scrollbar">
                                                <table className="w-full text-left border-collapse">
                                                    <thead>
                                                        <tr className="bg-white/10 border-b border-white/40 sticky top-0 backdrop-blur-xl z-20">
                                                            <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Código</th>
                                                            <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Nombre / Marca</th>
                                                            <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Categoría</th>
                                                            <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">Disponible</th>
                                                            <th className="px-8 py-6 text-right"></th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-white/20">
                                                        {filteredStock.map((item) => (
                                                            <tr key={item.stockId} className="hover:bg-white/40 transition-all group">
                                                                <td className="px-8 py-6 font-mono text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                                                                    <span className="bg-white/50 px-2 py-1 rounded-lg border border-white/80">{item.codigo}</span>
                                                                </td>
                                                                <td className="px-8 py-6">
                                                                    <div className="text-sm font-black text-gray-900 uppercase tracking-tight">{item.nombre}</div>
                                                                    <div className="text-[10px] font-bold text-gray-400 mt-0.5 italic">{item.marca || "Marca Genérica"}</div>
                                                                </td>
                                                                <td className="px-8 py-6">
                                                                    <span className="inline-flex items-center rounded-xl bg-blue-500/10 px-3 py-1 text-[9px] font-black text-blue-600 border border-blue-200 uppercase tracking-widest">
                                                                        {item.categoria}
                                                                    </span>
                                                                </td>
                                                                <td className="px-8 py-6 text-center">
                                                                    <div className="inline-flex flex-col items-center p-2 px-4 rounded-2xl bg-white shadow-sm border border-white/80">
                                                                        <span className="text-xl font-black text-gray-900 tracking-tighter">{item.cantidad}</span>
                                                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">{item.unidadMedida}</span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-8 py-6 text-right">
                                                                    <button
                                                                        onClick={() => setSelectedInsumoForBatches(item)}
                                                                        className="p-3 text-gray-400 hover:text-lime-600 bg-white/50 hover:bg-white rounded-2xl border border-white transition-all shadow-sm active:scale-90"
                                                                        title="Gestionar Lotes"
                                                                    >
                                                                        <ArrowRight size={18} />
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>

                            <div className="p-8 border-t border-white/60 bg-white/50 flex justify-end">
                                <button
                                    onClick={() => setViewingWarehouse(null)}
                                    className="px-12 py-4 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-gray-900/10 active:scale-95 transition-all"
                                >
                                    Cerrar Vista
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Batch Details Modal */}
            <BatchDetailsModal
                isOpen={!!selectedInsumoForBatches}
                onClose={() => setSelectedInsumoForBatches(null)}
                insumo={selectedInsumoForBatches}
                filterAlmacenId={viewingWarehouse?.almacenId}
            />
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
