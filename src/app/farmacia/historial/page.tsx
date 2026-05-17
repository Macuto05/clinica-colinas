"use client";

import { useState } from "react";
import {
    History,
    Search,
    Filter,
    ChevronDown,
    RefreshCw,
    CheckCircle,
    Clock,
    XCircle,
    Eye,
    Download,
    Package,
    User,
    Calendar,
    FileText,
} from "lucide-react";

interface Despacho {
    id: string;
    folio: string;
    fecha: string;
    hora: string;
    solicitante: string;
    quirofano: string;
    cirugia: string;
    itemsCount: number;
    procesadoPor: string;
    estado: "completado" | "pendiente" | "anulado";
    items: { nombre: string; cantidad: number; unidad: string }[];
}

const DESPACHOS_MOCK: Despacho[] = [
    {
        id: "1", folio: "DQ-2026-0047", fecha: "2026-05-13", hora: "09:15", solicitante: "Enf. García",
        quirofano: "Q-01", cirugia: "Colecistectomía laparoscópica", itemsCount: 8,
        procesadoPor: "Farm. López", estado: "completado",
        items: [{ nombre: "Bisturí N°22", cantidad: 3, unidad: "unid" }, { nombre: "Gasas estériles", cantidad: 10, unidad: "paquetes" }, { nombre: "Guantes 7.5", cantidad: 2, unidad: "pares" }],
    },
    {
        id: "2", folio: "DQ-2026-0046", fecha: "2026-05-13", hora: "07:30", solicitante: "Enf. Martínez",
        quirofano: "Q-02", cirugia: "Apendicectomía", itemsCount: 12,
        procesadoPor: "Farm. López", estado: "completado",
        items: [{ nombre: "Sutura absorbible 2-0", cantidad: 4, unidad: "cajas" }, { nombre: "Catéter IV 18G", cantidad: 2, unidad: "unid" }],
    },
    {
        id: "3", folio: "DQ-2026-0045", fecha: "2026-05-12", hora: "14:00", solicitante: "Enf. Rodríguez",
        quirofano: "Q-03", cirugia: "Hernioplastia inguinal", itemsCount: 6,
        procesadoPor: "Farm. Pérez", estado: "completado",
        items: [{ nombre: "Gasas estériles", cantidad: 5, unidad: "paquetes" }, { nombre: "Equipo de venoclisis", cantidad: 1, unidad: "unid" }],
    },
    {
        id: "4", folio: "DQ-2026-0044", fecha: "2026-05-12", hora: "11:20", solicitante: "Enf. Torres",
        quirofano: "Q-01", cirugia: "Tiroidectomía", itemsCount: 15,
        procesadoPor: "Farm. López", estado: "anulado",
        items: [{ nombre: "Bisturí N°15", cantidad: 2, unidad: "unid" }],
    },
    {
        id: "5", folio: "DQ-2026-0043", fecha: "2026-05-11", hora: "08:45", solicitante: "Enf. Vargas",
        quirofano: "Q-04", cirugia: "Cesárea electiva", itemsCount: 20,
        procesadoPor: "Farm. Pérez", estado: "completado",
        items: [{ nombre: "Guantes 7.0", cantidad: 4, unidad: "pares" }, { nombre: "Catéter IV 20G", cantidad: 3, unidad: "unid" }],
    },
    {
        id: "6", folio: "DQ-2026-0042", fecha: "2026-05-11", hora: "16:10", solicitante: "Enf. Sánchez",
        quirofano: "Q-02", cirugia: "Artroscopía de rodilla", itemsCount: 9,
        procesadoPor: "Farm. López", estado: "completado",
        items: [{ nombre: "Sutura no absorbible 3-0", cantidad: 2, unidad: "cajas" }],
    },
];

const estadoBadge: Record<string, { label: string; classes: string; dot: string; icon: React.ElementType }> = {
    completado: { label: "Completado", classes: "bg-green-50/60 border-green-400/30 text-green-800", dot: "bg-green-500", icon: CheckCircle },
    pendiente: { label: "Pendiente", classes: "bg-yellow-50/60 border-yellow-400/30 text-yellow-800", dot: "bg-yellow-500", icon: Clock },
    anulado: { label: "Anulado", classes: "bg-red-50/60 border-red-400/30 text-red-800", dot: "bg-red-500", icon: XCircle },
};

export default function HistorialDespachosPage() {
    const [search, setSearch] = useState("");
    const [estadoFiltro, setEstadoFiltro] = useState("todos");
    const [despachoSeleccionado, setDespachoSeleccionado] = useState<Despacho | null>(null);

    const filtrados = DESPACHOS_MOCK.filter((d) => {
        const matchSearch =
            d.folio.toLowerCase().includes(search.toLowerCase()) ||
            d.solicitante.toLowerCase().includes(search.toLowerCase()) ||
            d.cirugia.toLowerCase().includes(search.toLowerCase());
        const matchEst = estadoFiltro === "todos" || d.estado === estadoFiltro;
        return matchSearch && matchEst;
    });

    const stats = {
        total: DESPACHOS_MOCK.length,
        completados: DESPACHOS_MOCK.filter((d) => d.estado === "completado").length,
        anulados: DESPACHOS_MOCK.filter((d) => d.estado === "anulado").length,
        totalItems: DESPACHOS_MOCK.reduce((acc, d) => acc + d.itemsCount, 0),
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-lime-500/10 rounded-xl">
                            <History className="text-lime-600" size={24} />
                        </div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase italic">
                            Historial de <span className="text-lime-500">Despachos</span>
                        </h1>
                    </div>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                        Inventario Quirófano — Registro de Entregas
                    </p>
                </div>

                <button className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/60 backdrop-blur-md hover:bg-white/80 text-gray-700 font-bold text-sm shadow-[0_4px_12px_rgba(0,0,0,0.06)] border border-white/80 transition-all self-start md:self-auto">
                    <Download size={18} />
                    Exportar
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Total Despachos", value: stats.total, icon: FileText, color: "text-blue-600", bg: "bg-blue-500/10" },
                    { label: "Completados", value: stats.completados, icon: CheckCircle, color: "text-green-600", bg: "bg-green-500/10" },
                    { label: "Anulados", value: stats.anulados, icon: XCircle, color: "text-red-600", bg: "bg-red-500/10" },
                    { label: "Ítems Entregados", value: stats.totalItems, icon: Package, color: "text-lime-600", bg: "bg-lime-500/10" },
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
                            placeholder="Buscar por folio, solicitante o cirugía..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/50 border border-white/60 focus:bg-white/80 focus:ring-2 focus:ring-lime-400/50 outline-none text-sm font-medium shadow-inner transition-all placeholder:text-gray-400"
                        />
                    </div>
                    <div className="flex gap-2">
                        {[{ val: "todos", label: "Todos" }, { val: "completado", label: "Completados" }, { val: "anulado", label: "Anulados" }].map((e) => (
                            <button
                                key={e.val}
                                onClick={() => setEstadoFiltro(e.val)}
                                className={`px-4 py-3 rounded-2xl border text-sm font-bold transition-all whitespace-nowrap ${estadoFiltro === e.val ? "border-lime-500/80 bg-lime-50/80 text-lime-700 shadow-[0_4px_12px_rgba(132,204,22,0.2)] ring-2 ring-lime-400/20 scale-[1.02]" : "border-white/60 bg-white/40 text-gray-600 hover:bg-white/60"}`}
                            >
                                {e.label}
                            </button>
                        ))}
                        <button
                            onClick={() => { setSearch(""); setEstadoFiltro("todos"); }}
                            className="px-4 py-3 rounded-2xl border border-white/60 bg-white/40 text-gray-500 text-sm font-bold hover:bg-white/60 transition-all"
                        >
                            <RefreshCw size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white/40 backdrop-blur-md border border-white/50 rounded-3xl overflow-hidden shadow-[0_4px_16px_0_rgba(0,0,0,0.02)]">
                {/* Header */}
                <div className="grid grid-cols-12 gap-2 px-5 py-3.5 bg-white/30 border-b border-white/40">
                    <div className="col-span-2 text-[10px] font-black text-gray-400 uppercase tracking-wider">Folio</div>
                    <div className="col-span-2 text-[10px] font-black text-gray-400 uppercase tracking-wider">Fecha / Hora</div>
                    <div className="col-span-2 text-[10px] font-black text-gray-400 uppercase tracking-wider">Solicitante</div>
                    <div className="col-span-2 text-[10px] font-black text-gray-400 uppercase tracking-wider">Cirugía / Q.</div>
                    <div className="col-span-1 text-[10px] font-black text-gray-400 uppercase tracking-wider text-center">Ítems</div>
                    <div className="col-span-2 text-[10px] font-black text-gray-400 uppercase tracking-wider">Estado</div>
                    <div className="col-span-1 text-[10px] font-black text-gray-400 uppercase tracking-wider text-right">Ver</div>
                </div>

                {filtrados.length === 0 ? (
                    <div className="py-16 flex flex-col items-center gap-3 text-center">
                        <div className="p-4 bg-gray-100/60 rounded-full">
                            <History size={28} className="text-gray-400" />
                        </div>
                        <p className="font-bold text-gray-500 text-sm">No se encontraron despachos</p>
                        <p className="text-xs text-gray-400">Intenta ajustar los filtros o la búsqueda</p>
                    </div>
                ) : (
                    filtrados.map((despacho) => {
                        const badge = estadoBadge[despacho.estado];
                        return (
                            <div
                                key={despacho.id}
                                className="grid grid-cols-12 gap-2 px-5 py-4 hover:bg-white/60 transition-colors border-b border-white/30 last:border-b-0 items-center"
                            >
                                <div className="col-span-2">
                                    <p className="text-xs font-black text-gray-700 font-mono">{despacho.folio}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-xs font-bold text-gray-700">{despacho.fecha}</p>
                                    <p className="text-[10px] text-gray-400">{despacho.hora} hrs</p>
                                </div>
                                <div className="col-span-2">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-5 h-5 rounded-full bg-lime-500/10 flex items-center justify-center">
                                            <User size={10} className="text-lime-700" />
                                        </div>
                                        <p className="text-xs font-bold text-gray-700 truncate">{despacho.solicitante}</p>
                                    </div>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-xs font-bold text-gray-700 truncate">{despacho.cirugia}</p>
                                    <p className="text-[10px] text-gray-400">{despacho.quirofano}</p>
                                </div>
                                <div className="col-span-1 text-center">
                                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-lime-50/80 border border-lime-400/30 text-lime-800 text-xs font-black">
                                        {despacho.itemsCount}
                                    </span>
                                </div>
                                <div className="col-span-2">
                                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold border rounded-full px-2.5 py-1 ${badge.classes}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                                        {badge.label}
                                    </span>
                                    <p className="text-[9px] text-gray-400 mt-0.5 pl-0.5">{despacho.procesadoPor}</p>
                                </div>
                                <div className="col-span-1 flex justify-end">
                                    <button
                                        onClick={() => setDespachoSeleccionado(despacho)}
                                        className="p-1.5 rounded-xl bg-white/50 border border-white/60 text-gray-500 hover:text-lime-600 hover:bg-lime-50/60 transition-all"
                                    >
                                        <Eye size={14} />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <p className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Mostrando {filtrados.length} de {DESPACHOS_MOCK.length} despachos — Inventario Quirófano
            </p>

            {/* Detail Modal */}
            {despachoSeleccionado && (
                <div
                    className="fixed inset-0 bg-slate-900/30 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-md transition-all"
                    onClick={() => setDespachoSeleccionado(null)}
                >
                    <div
                        className="bg-white/70 backdrop-blur-2xl backdrop-saturate-[1.2] w-full sm:max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-[0_8px_32px_0_rgba(0,0,0,0.12)] border border-white/60 max-h-[90vh] flex flex-col overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-white/40 flex justify-between items-center shrink-0 bg-white/30">
                            <div>
                                <h2 className="font-bold text-gray-900 text-lg tracking-tight">{despachoSeleccionado.folio}</h2>
                                <p className="text-xs text-gray-500 font-medium">{despachoSeleccionado.cirugia} — {despachoSeleccionado.quirofano}</p>
                            </div>
                            <button
                                onClick={() => setDespachoSeleccionado(null)}
                                className="p-2 rounded-2xl bg-white/50 border border-white/60 text-gray-500 hover:bg-white/80 transition-all"
                            >
                                <XCircle size={18} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="overflow-y-auto flex-1 p-6 space-y-5">
                            {/* Meta */}
                            <section className="bg-white/60 backdrop-blur-md border border-white/80 rounded-3xl p-5 shadow-[0_4px_16px_0_rgba(0,0,0,0.02)]">
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="w-7 h-7 rounded-full bg-gray-900/90 text-white shadow-md text-xs font-black flex items-center justify-center shrink-0">1</span>
                                    <h4 className="font-bold text-gray-800 text-base">Información del Despacho</h4>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        { label: "Fecha", value: despachoSeleccionado.fecha, icon: Calendar },
                                        { label: "Hora", value: `${despachoSeleccionado.hora} hrs`, icon: Clock },
                                        { label: "Solicitante", value: despachoSeleccionado.solicitante, icon: User },
                                        { label: "Procesado por", value: despachoSeleccionado.procesadoPor, icon: User },
                                    ].map((item) => (
                                        <div key={item.label} className="flex items-start gap-2">
                                            <item.icon size={14} className="text-lime-600 mt-0.5 shrink-0" />
                                            <div>
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{item.label}</p>
                                                <p className="text-xs font-bold text-gray-700">{item.value}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Items */}
                            <section className="bg-white/60 backdrop-blur-md border border-white/80 rounded-3xl p-5 shadow-[0_4px_16px_0_rgba(0,0,0,0.02)]">
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="w-7 h-7 rounded-full bg-gray-900/90 text-white shadow-md text-xs font-black flex items-center justify-center shrink-0">2</span>
                                    <h4 className="font-bold text-gray-800 text-base">Ítems Despachados</h4>
                                </div>
                                <div className="space-y-2">
                                    {despachoSeleccionado.items.map((item, i) => (
                                        <div key={i} className="flex items-center justify-between py-2.5 px-3 rounded-2xl bg-white/50 border border-white/60">
                                            <div className="flex items-center gap-2">
                                                <Package size={14} className="text-lime-600" />
                                                <span className="text-xs font-bold text-gray-700">{item.nombre}</span>
                                            </div>
                                            <span className="text-xs font-black text-gray-800">
                                                {item.cantidad} <span className="text-gray-400 font-medium">{item.unidad}</span>
                                            </span>
                                        </div>
                                    ))}
                                    {despachoSeleccionado.itemsCount > despachoSeleccionado.items.length && (
                                        <p className="text-center text-[10px] font-bold text-gray-400 pt-1">
                                            + {despachoSeleccionado.itemsCount - despachoSeleccionado.items.length} ítems más en el registro completo
                                        </p>
                                    )}
                                </div>
                            </section>
                        </div>

                        {/* Footer */}
                        <div className="p-5 border-t border-white/40 shrink-0 bg-white/30 backdrop-blur-md">
                            <button
                                onClick={() => setDespachoSeleccionado(null)}
                                className="w-full py-3 rounded-2xl bg-white/50 border border-white/60 text-gray-700 font-bold hover:bg-white/80 transition-colors text-sm shadow-sm backdrop-blur-sm outline-none focus:ring-2 focus:ring-gray-300"
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
