"use client";

import { useState, useEffect } from "react";
import {
    PackageSearch,
    Plus,
    Search,
    Filter,
    AlertTriangle,
    CheckCircle,
    Package,
    Edit2,
    Trash2,
    TrendingDown,
    BarChart3,
    RefreshCw,
    ChevronDown,
    X,
} from "lucide-react";

interface Insumo {
    id: string;
    nombre: string;
    codigo: string;
    categoria: string;
    stockActual: number;
    stockMinimo: number;
    unidad: string;
    ubicacion: string;
    estado: "ok" | "bajo" | "critico";
    ultimaActualizacion: string;
}

const INSUMOS_MOCK: Insumo[] = [
    { id: "1", nombre: "Bisturí desechable N°22", codigo: "BST-022", categoria: "Instrumental", stockActual: 45, stockMinimo: 20, unidad: "unid", ubicacion: "Estante A-1", estado: "ok", ultimaActualizacion: "2026-05-13" },
    { id: "2", nombre: "Guantes quirúrgicos 7.5", codigo: "GQ-075", categoria: "Protección", stockActual: 8, stockMinimo: 30, unidad: "pares", ubicacion: "Estante B-2", estado: "critico", ultimaActualizacion: "2026-05-12" },
    { id: "3", nombre: "Sutura absorbible 2-0", codigo: "SUT-020", categoria: "Sutura", stockActual: 22, stockMinimo: 15, unidad: "cajas", ubicacion: "Estante C-1", estado: "ok", ultimaActualizacion: "2026-05-13" },
    { id: "4", nombre: "Gasas estériles 10x10", codigo: "GAS-001", categoria: "Apósitos", stockActual: 12, stockMinimo: 25, unidad: "paquetes", ubicacion: "Estante A-3", estado: "bajo", ultimaActualizacion: "2026-05-11" },
    { id: "5", nombre: "Equipo de venoclisis", codigo: "VEN-001", categoria: "IV/Líquidos", stockActual: 60, stockMinimo: 20, unidad: "unid", ubicacion: "Estante D-1", estado: "ok", ultimaActualizacion: "2026-05-13" },
    { id: "6", nombre: "Catéter IV 18G", codigo: "CAT-18G", categoria: "IV/Líquidos", stockActual: 5, stockMinimo: 20, unidad: "unid", ubicacion: "Estante D-2", estado: "critico", ultimaActualizacion: "2026-05-10" },
    { id: "7", nombre: "Electrodos ECG desechables", codigo: "ECG-001", categoria: "Monitoreo", stockActual: 34, stockMinimo: 15, unidad: "unid", ubicacion: "Estante E-1", estado: "ok", ultimaActualizacion: "2026-05-12" },
    { id: "8", nombre: "Mascarilla laríngea #4", codigo: "MSK-004", categoria: "Anestesia", stockActual: 18, stockMinimo: 10, unidad: "unid", ubicacion: "Estante F-1", estado: "ok", ultimaActualizacion: "2026-05-13" },
];

const estadoBadge: Record<string, { label: string; classes: string; dot: string }> = {
    ok: { label: "Normal", classes: "bg-green-50/60 border-green-400/30 text-green-800", dot: "bg-green-500" },
    bajo: { label: "Stock Bajo", classes: "bg-yellow-50/60 border-yellow-400/30 text-yellow-800", dot: "bg-yellow-500" },
    critico: { label: "Crítico", classes: "bg-red-50/60 border-red-400/30 text-red-800", dot: "bg-red-500" },
};

const CATEGORIAS = ["Todas", "Instrumental", "Protección", "Sutura", "Apósitos", "IV/Líquidos", "Monitoreo", "Anestesia"];

export default function GestionInsumosPage() {
    const [search, setSearch] = useState("");
    const [categoriaFiltro, setCategoriaFiltro] = useState("Todas");
    const [estadoFiltro, setEstadoFiltro] = useState("todos");
    const [insumos, setInsumos] = useState<Insumo[]>(INSUMOS_MOCK);
    const [showFiltros, setShowFiltros] = useState(false);

    const filtrados = insumos.filter((i) => {
        const matchSearch =
            i.nombre.toLowerCase().includes(search.toLowerCase()) ||
            i.codigo.toLowerCase().includes(search.toLowerCase());
        const matchCat = categoriaFiltro === "Todas" || i.categoria === categoriaFiltro;
        const matchEst = estadoFiltro === "todos" || i.estado === estadoFiltro;
        return matchSearch && matchCat && matchEst;
    });

    const stats = {
        total: insumos.length,
        ok: insumos.filter((i) => i.estado === "ok").length,
        bajo: insumos.filter((i) => i.estado === "bajo").length,
        critico: insumos.filter((i) => i.estado === "critico").length,
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-lime-500/10 rounded-xl">
                            <PackageSearch className="text-lime-600" size={24} />
                        </div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase italic">
                            Gestión de <span className="text-lime-500">Insumos</span>
                        </h1>
                    </div>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                        Inventario Quirófano — Control de Stock
                    </p>
                </div>

                <button className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-lime-500/90 hover:bg-lime-500 text-white font-bold text-sm shadow-[0_8px_20px_rgba(132,204,22,0.3)] border border-lime-400/50 transition-all backdrop-blur-md outline-none focus:ring-2 focus:ring-lime-300 self-start md:self-auto">
                    <Plus size={18} />
                    Agregar Insumo
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Total Ítems", value: stats.total, icon: Package, color: "text-blue-600", bg: "bg-blue-500/10" },
                    { label: "En Stock Normal", value: stats.ok, icon: CheckCircle, color: "text-green-600", bg: "bg-green-500/10" },
                    { label: "Stock Bajo", value: stats.bajo, icon: TrendingDown, color: "text-yellow-600", bg: "bg-yellow-500/10" },
                    { label: "Stock Crítico", value: stats.critico, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-500/10" },
                ].map((stat) => (
                    <div
                        key={stat.label}
                        className="bg-white/60 backdrop-blur-md border border-white/80 rounded-3xl p-5 shadow-[0_4px_16px_0_rgba(0,0,0,0.02)] flex items-center gap-4"
                    >
                        <div className={`${stat.bg} p-3 rounded-2xl`}>
                            <stat.icon className={stat.color} size={22} />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-gray-900">{stat.value}</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{stat.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Search & Filters */}
            <div className="bg-white/60 backdrop-blur-md border border-white/80 rounded-3xl p-5 shadow-[0_4px_16px_0_rgba(0,0,0,0.02)]">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o código..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/50 border border-white/60 focus:bg-white/80 focus:ring-2 focus:ring-lime-400/50 outline-none text-sm font-medium shadow-inner transition-all placeholder:text-gray-400"
                        />
                    </div>
                    <button
                        onClick={() => setShowFiltros(!showFiltros)}
                        className={`flex items-center gap-2 px-4 py-3 rounded-2xl border text-sm font-bold transition-all ${showFiltros ? "border-lime-500/80 bg-lime-50/80 text-lime-700 shadow-[0_4px_12px_rgba(132,204,22,0.2)] ring-2 ring-lime-400/20" : "border-white/60 bg-white/40 text-gray-600 hover:bg-white/60"}`}
                    >
                        <Filter size={16} />
                        Filtros
                        <ChevronDown size={14} className={`transition-transform ${showFiltros ? "rotate-180" : ""}`} />
                    </button>
                    <button
                        onClick={() => { setSearch(""); setCategoriaFiltro("Todas"); setEstadoFiltro("todos"); }}
                        className="flex items-center gap-2 px-4 py-3 rounded-2xl border border-white/60 bg-white/40 text-gray-500 text-sm font-bold hover:bg-white/60 transition-all"
                    >
                        <RefreshCw size={16} />
                    </button>
                </div>

                {showFiltros && (
                    <div className="mt-4 pt-4 border-t border-white/40 flex flex-wrap gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Categoría</label>
                            <div className="flex flex-wrap gap-2">
                                {CATEGORIAS.map((cat) => (
                                    <button
                                        key={cat}
                                        onClick={() => setCategoriaFiltro(cat)}
                                        className={`px-3 py-1.5 rounded-2xl border text-xs font-bold transition-all ${categoriaFiltro === cat ? "border-lime-500/80 bg-lime-50/80 text-lime-700 shadow-[0_4px_12px_rgba(132,204,22,0.2)] ring-2 ring-lime-400/20 scale-[1.02]" : "border-white/60 bg-white/40 text-gray-500 hover:bg-white/60"}`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Estado</label>
                            <div className="flex flex-wrap gap-2">
                                {[{ val: "todos", label: "Todos" }, { val: "ok", label: "Normal" }, { val: "bajo", label: "Bajo" }, { val: "critico", label: "Crítico" }].map((e) => (
                                    <button
                                        key={e.val}
                                        onClick={() => setEstadoFiltro(e.val)}
                                        className={`px-3 py-1.5 rounded-2xl border text-xs font-bold transition-all ${estadoFiltro === e.val ? "border-lime-500/80 bg-lime-50/80 text-lime-700 shadow-[0_4px_12px_rgba(132,204,22,0.2)] ring-2 ring-lime-400/20 scale-[1.02]" : "border-white/60 bg-white/40 text-gray-500 hover:bg-white/60"}`}
                                    >
                                        {e.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="bg-white/40 backdrop-blur-md border border-white/50 rounded-3xl overflow-hidden shadow-[0_4px_16px_0_rgba(0,0,0,0.02)]">
                {/* Header */}
                <div className="grid grid-cols-12 gap-2 px-5 py-3.5 bg-white/30 border-b border-white/40">
                    <div className="col-span-1 text-[10px] font-black text-gray-400 uppercase tracking-wider">#</div>
                    <div className="col-span-3 text-[10px] font-black text-gray-400 uppercase tracking-wider">Insumo</div>
                    <div className="col-span-2 text-[10px] font-black text-gray-400 uppercase tracking-wider">Categoría</div>
                    <div className="col-span-2 text-[10px] font-black text-gray-400 uppercase tracking-wider text-center">Stock</div>
                    <div className="col-span-2 text-[10px] font-black text-gray-400 uppercase tracking-wider">Ubicación</div>
                    <div className="col-span-1 text-[10px] font-black text-gray-400 uppercase tracking-wider">Estado</div>
                    <div className="col-span-1 text-[10px] font-black text-gray-400 uppercase tracking-wider text-right">Acciones</div>
                </div>

                {filtrados.length === 0 ? (
                    <div className="py-16 flex flex-col items-center gap-3 text-center">
                        <div className="p-4 bg-gray-100/60 rounded-full">
                            <PackageSearch size={28} className="text-gray-400" />
                        </div>
                        <p className="font-bold text-gray-500 text-sm">No se encontraron insumos</p>
                        <p className="text-xs text-gray-400">Intenta ajustar los filtros o la búsqueda</p>
                    </div>
                ) : (
                    filtrados.map((insumo, idx) => {
                        const badge = estadoBadge[insumo.estado];
                        const stockPct = Math.min(100, (insumo.stockActual / Math.max(insumo.stockMinimo * 2, 1)) * 100);
                        return (
                            <div
                                key={insumo.id}
                                className="grid grid-cols-12 gap-2 px-5 py-4 hover:bg-white/60 transition-colors border-b border-white/30 last:border-b-0 items-center"
                            >
                                <div className="col-span-1 text-xs font-black text-gray-300">{String(idx + 1).padStart(2, "0")}</div>
                                <div className="col-span-3">
                                    <p className="text-sm font-bold text-gray-800 truncate">{insumo.nombre}</p>
                                    <p className="text-[10px] text-gray-400 font-mono">{insumo.codigo}</p>
                                </div>
                                <div className="col-span-2">
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-blue-100/70 border border-blue-200/60 text-blue-800 rounded-full px-2.5 py-1">
                                        {insumo.categoria}
                                    </span>
                                </div>
                                <div className="col-span-2 text-center">
                                    <p className="text-sm font-black text-gray-800">
                                        {insumo.stockActual} <span className="text-[10px] text-gray-400 font-medium">{insumo.unidad}</span>
                                    </p>
                                    <div className="mt-1 h-1 bg-white/60 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all ${insumo.estado === "critico" ? "bg-red-400" : insumo.estado === "bajo" ? "bg-yellow-400" : "bg-lime-400"}`}
                                            style={{ width: `${stockPct}%` }}
                                        />
                                    </div>
                                    <p className="text-[9px] text-gray-400 mt-0.5">Mín: {insumo.stockMinimo}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-xs font-bold text-gray-600">{insumo.ubicacion}</p>
                                </div>
                                <div className="col-span-1">
                                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold border rounded-full px-2 py-1 ${badge.classes}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                                        {badge.label}
                                    </span>
                                </div>
                                <div className="col-span-1 flex items-center justify-end gap-1.5">
                                    <button className="p-1.5 rounded-xl bg-white/50 border border-white/60 text-gray-500 hover:text-lime-600 hover:bg-lime-50/60 transition-all">
                                        <Edit2 size={13} />
                                    </button>
                                    <button className="p-1.5 rounded-xl bg-white/50 border border-white/60 text-gray-500 hover:text-red-600 hover:bg-red-50/60 transition-all">
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Footer info */}
            <p className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Mostrando {filtrados.length} de {insumos.length} insumos — Inventario Quirófano
            </p>
        </div>
    );
}
