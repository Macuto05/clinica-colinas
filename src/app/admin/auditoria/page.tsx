"use client";

import { useEffect, useState, useCallback, Fragment } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
    ShieldCheck, Search, Filter, ChevronLeft, ChevronRight,
    Loader2, ChevronDown, ChevronUp, AlertTriangle, AlertCircle, Info,
    RefreshCw,
} from "lucide-react";

type Severidad = "INFO" | "WARNING" | "CRITICAL";

interface RegistroAuditoria {
    id: string;
    fechaHora: string;
    nombreUsuario: string;
    rolUsuario: string;
    modulo: string;
    accion: string;
    descripcion: string;
    severidad: Severidad;
    entidadTipo: string | null;
    entidadId: string | null;
    metadatos: Record<string, unknown> | null;
    ipOrigen: string | null;
}

interface ApiResponse {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    registros: RegistroAuditoria[];
}

const MODULOS = [
    "AUTH", "RECEPCION", "CITAS", "EMERGENCIAS", "LABORATORIO",
    "IMAGENOLOGIA", "ENFERMERIA", "FARMACIA", "ALMACEN", "CAJA", "ADMIN",
];

const SEVERIDAD_CONFIG: Record<Severidad, { label: string; cls: string; icon: React.ReactNode }> = {
    INFO:     { label: "Info",     cls: "bg-blue-50 text-blue-700 border border-blue-200",       icon: <Info size={12} /> },
    WARNING:  { label: "Aviso",    cls: "bg-amber-50 text-amber-700 border border-amber-200",    icon: <AlertTriangle size={12} /> },
    CRITICAL: { label: "Crítico",  cls: "bg-red-50 text-red-700 border border-red-200",          icon: <AlertCircle size={12} /> },
};

const MODULO_COLORS: Record<string, string> = {
    AUTH:         "bg-violet-100 text-violet-700",
    RECEPCION:    "bg-sky-100 text-sky-700",
    CITAS:        "bg-sky-100 text-sky-700",
    EMERGENCIAS:  "bg-red-100 text-red-700",
    LABORATORIO:  "bg-teal-100 text-teal-700",
    IMAGENOLOGIA: "bg-teal-100 text-teal-700",
    ENFERMERIA:   "bg-pink-100 text-pink-700",
    FARMACIA:     "bg-emerald-100 text-emerald-700",
    ALMACEN:      "bg-orange-100 text-orange-700",
    CAJA:         "bg-yellow-100 text-yellow-800",
    ADMIN:        "bg-gray-100 text-gray-700",
};

function SeveridadBadge({ s }: { s: Severidad }) {
    const cfg = SEVERIDAD_CONFIG[s] ?? SEVERIDAD_CONFIG.INFO;
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.cls}`}>
            {cfg.icon} {cfg.label}
        </span>
    );
}

function ModuloBadge({ m }: { m: string }) {
    const cls = MODULO_COLORS[m] ?? "bg-gray-100 text-gray-600";
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${cls}`}>
            {m}
        </span>
    );
}

export default function AdminAuditoriaPage() {
    const [data, setData] = useState<ApiResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    // Filters
    const [modulo, setModulo] = useState("");
    const [severidad, setSeveridad] = useState("");
    const [desde, setDesde] = useState("");
    const [hasta, setHasta] = useState("");
    const [busqueda, setBusqueda] = useState("");
    const [page, setPage] = useState(1);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (modulo)    params.set("modulo", modulo);
            if (severidad) params.set("severidad", severidad);
            if (desde)     params.set("desde", desde);
            if (hasta)     params.set("hasta", hasta);
            if (busqueda)  params.set("q", busqueda);
            params.set("page", String(page));
            params.set("pageSize", "10");

            const res = await fetch(`/api/admin/auditoria?${params.toString()}`);
            if (res.ok) setData(await res.json());
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [modulo, severidad, desde, hasta, busqueda, page]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const applyFilters = () => { setPage(1); fetchData(); };

    const clearFilters = () => {
        setModulo(""); setSeveridad(""); setDesde(""); setHasta(""); setBusqueda("");
        setPage(1);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#2D6B4F]/10 rounded-lg">
                        <ShieldCheck className="text-[#2D6B4F]" size={22} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Auditoría y Traza</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Historial completo de acciones en el sistema
                        </p>
                    </div>
                </div>
                <button
                    onClick={fetchData}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#2D6B4F] transition-colors"
                >
                    <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
                    Actualizar
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-4">
                <div className="flex items-center gap-2 mb-3 text-sm font-medium text-gray-600 dark:text-gray-400">
                    <Filter size={14} /> Filtros
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    {/* Búsqueda */}
                    <div className="relative lg:col-span-2">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar en descripción, usuario..."
                            value={busqueda}
                            onChange={e => setBusqueda(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && applyFilters()}
                            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#2D6B4F]/30"
                        />
                    </div>

                    {/* Módulo */}
                    <select
                        value={modulo}
                        onChange={e => setModulo(e.target.value)}
                        className="text-sm border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#2D6B4F]/30"
                    >
                        <option value="">Todos los módulos</option>
                        {MODULOS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>

                    {/* Severidad */}
                    <select
                        value={severidad}
                        onChange={e => setSeveridad(e.target.value)}
                        className="text-sm border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#2D6B4F]/30"
                    >
                        <option value="">Toda severidad</option>
                        <option value="INFO">Info</option>
                        <option value="WARNING">Aviso</option>
                        <option value="CRITICAL">Crítico</option>
                    </select>

                    {/* Botones */}
                    <div className="flex gap-2">
                        <button
                            onClick={applyFilters}
                            className="flex-1 bg-[#2D6B4F] text-white text-sm rounded-lg px-3 py-2 hover:bg-[#245c42] transition-colors"
                        >
                            Buscar
                        </button>
                        <button
                            onClick={clearFilters}
                            className="px-3 py-2 text-sm border border-gray-200 dark:border-zinc-700 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                        >
                            Limpiar
                        </button>
                    </div>
                </div>

                {/* Rango de fechas */}
                <div className="flex flex-wrap gap-3 mt-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <span>Desde:</span>
                        <input
                            type="date"
                            value={desde}
                            onChange={e => setDesde(e.target.value)}
                            className="border border-gray-200 dark:border-zinc-700 rounded-lg px-2 py-1 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6B4F]/30"
                        />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <span>Hasta:</span>
                        <input
                            type="date"
                            value={hasta}
                            onChange={e => setHasta(e.target.value)}
                            className="border border-gray-200 dark:border-zinc-700 rounded-lg px-2 py-1 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6B4F]/30"
                        />
                    </div>
                </div>
            </div>

            {/* Stats bar */}
            {data && (
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 px-1">
                    <span>
                        <span className="font-semibold text-gray-800 dark:text-gray-200">{data.total.toLocaleString()}</span> registros encontrados
                    </span>
                    <span>Página {data.page} de {data.totalPages}</span>
                </div>
            )}

            {/* Table */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
                {loading ? (
                    <div className="flex justify-center items-center py-24">
                        <Loader2 className="animate-spin text-[#2D6B4F]" size={32} />
                    </div>
                ) : !data || data.registros.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                        <ShieldCheck size={40} className="mb-3 opacity-30" />
                        <p className="font-medium">No se encontraron registros</p>
                        <p className="text-sm mt-1">Intenta cambiar los filtros de búsqueda</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 dark:border-zinc-800 bg-gray-50/60 dark:bg-zinc-800/50">
                                    <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 w-[160px]">Fecha / Hora</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 w-[140px]">Usuario</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 w-[110px]">Módulo</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Descripción</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 w-[90px]">Severidad</th>
                                    <th className="w-8"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-zinc-800">
                                {data.registros.map(reg => (
                                    <Fragment key={reg.id}>
                                        <tr
                                            className="hover:bg-gray-50/60 dark:hover:bg-zinc-800/40 cursor-pointer transition-colors"
                                            onClick={() => setExpandedId(expandedId === reg.id ? null : reg.id)}
                                        >
                                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                                                <div className="font-medium text-gray-800 dark:text-gray-200">
                                                    {format(new Date(reg.fechaHora), "dd/MM/yyyy", { locale: es })}
                                                </div>
                                                <div className="text-xs text-gray-400">
                                                    {format(new Date(reg.fechaHora), "HH:mm:ss")}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-gray-800 dark:text-gray-200 truncate max-w-[130px]" title={reg.nombreUsuario}>
                                                    {reg.nombreUsuario}
                                                </div>
                                                <div className="text-xs text-gray-400">{reg.rolUsuario}</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <ModuloBadge m={reg.modulo} />
                                            </td>
                                            <td className="px-4 py-3 text-gray-700 dark:text-gray-300 max-w-sm">
                                                <p className="truncate" title={reg.descripcion}>{reg.descripcion}</p>
                                                {reg.entidadTipo && (
                                                    <p className="text-xs text-gray-400 mt-0.5">
                                                        {reg.entidadTipo}{reg.entidadId ? ` #${reg.entidadId}` : ""}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <SeveridadBadge s={reg.severidad} />
                                            </td>
                                            <td className="px-3 py-3 text-gray-400">
                                                {expandedId === reg.id
                                                    ? <ChevronUp size={14} />
                                                    : <ChevronDown size={14} />
                                                }
                                            </td>
                                        </tr>

                                        {/* Expanded detail row */}
                                        {expandedId === reg.id && (
                                            <tr className="bg-gray-50/80 dark:bg-zinc-800/30">
                                                <td colSpan={6} className="px-6 py-4">
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                                        <div>
                                                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Acción</p>
                                                            <code className="text-xs bg-gray-100 dark:bg-zinc-700 px-2 py-1 rounded text-gray-700 dark:text-gray-300">
                                                                {reg.accion}
                                                            </code>
                                                        </div>
                                                        {reg.ipOrigen && (
                                                            <div>
                                                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">IP Origen</p>
                                                                <code className="text-xs bg-gray-100 dark:bg-zinc-700 px-2 py-1 rounded text-gray-700 dark:text-gray-300">
                                                                    {reg.ipOrigen}
                                                                </code>
                                                            </div>
                                                        )}
                                                        {reg.metadatos && (
                                                            <div className="md:col-span-3">
                                                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Metadatos</p>
                                                                <pre className="text-xs bg-gray-100 dark:bg-zinc-700 px-3 py-2 rounded text-gray-700 dark:text-gray-300 overflow-x-auto whitespace-pre-wrap max-h-40">
                                                                    {JSON.stringify(reg.metadatos, null, 2)}
                                                                </pre>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {data && data.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-200 dark:border-zinc-700 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                    >
                        <ChevronLeft size={14} /> Anterior
                    </button>

                    <div className="flex gap-1">
                        {Array.from({ length: Math.min(7, data.totalPages) }, (_, i) => {
                            let p: number;
                            if (data.totalPages <= 7) {
                                p = i + 1;
                            } else if (page <= 4) {
                                p = i + 1;
                            } else if (page >= data.totalPages - 3) {
                                p = data.totalPages - 6 + i;
                            } else {
                                p = page - 3 + i;
                            }
                            return (
                                <button
                                    key={p}
                                    onClick={() => setPage(p)}
                                    className={`w-9 h-9 text-sm rounded-lg transition-colors ${
                                        p === page
                                            ? "bg-[#2D6B4F] text-white"
                                            : "border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800"
                                    }`}
                                >
                                    {p}
                                </button>
                            );
                        })}
                    </div>

                    <button
                        onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                        disabled={page === data.totalPages}
                        className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-200 dark:border-zinc-700 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                    >
                        Siguiente <ChevronRight size={14} />
                    </button>
                </div>
            )}
        </div>
    );
}
