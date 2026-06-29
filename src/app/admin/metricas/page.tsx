"use client";

import { useEffect, useState } from "react";
import {
    Users, CalendarCheck, Ambulance, DollarSign,
    BarChart3, RefreshCw, Loader2, Stethoscope,
    Package,
} from "lucide-react";

interface Kpis {
    totalPacientes: number;
    citasMes: number;
    emergenciasActivas: number;
    ingresosMes: number;
}

interface BarItem {
    label: string;
    total: number;
    color: string;
}

interface TopMedico {
    medicoId: string;
    nombre: string;
    especialidad: string;
    totalCitas: number;
}

interface MetricasData {
    kpis: Kpis;
    citasPorEstado: { estado: string; total: number }[];
    emergenciasPorNivel: { nivel: string; total: number }[];
    movimientosPorTipo: { tipo: string; total: number }[];
    topMedicos: TopMedico[];
}

// ── colores por valor ──────────────────────────────────────────
const ESTADO_CITA: Record<string, string> = {
    PROGRAMADA:  "#f59e0b",
    CONFIRMADA:  "#3b82f6",
    ATENDIDA:    "#10b981",
    CANCELADA:   "#ef4444",
    NO_ASISTIO:  "#9ca3af",
    EN_CURSO:    "#8b5cf6",
};

const NIVEL_URGENCIA: Record<string, string> = {
    CRITICO:  "#ef4444",
    URGENTE:  "#f97316",
    MODERADO: "#f59e0b",
    LEVE:     "#10b981",
};

const TIPO_MOV: Record<string, string> = {
    ENTRADA:  "#10b981",
    SALIDA:   "#ef4444",
    TRASLADO: "#3b82f6",
    AJUSTE:   "#f59e0b",
};

// ── componente de barra horizontal ────────────────────────────
function BarChart({ items, max }: { items: BarItem[]; max: number }) {
    return (
        <div className="space-y-3">
            {items.map(item => (
                <div key={item.label}>
                    <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-gray-700 dark:text-gray-300">{item.label}</span>
                        <span className="font-bold text-gray-800 dark:text-gray-200">{item.total}</span>
                    </div>
                    <div className="h-2.5 bg-gray-100 dark:bg-zinc-700 rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                                width: max > 0 ? `${(item.total / max) * 100}%` : "0%",
                                backgroundColor: item.color,
                            }}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
}

// ── KPI card ──────────────────────────────────────────────────
function KpiCard({
    icon, label, value, sub, color,
}: {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    sub?: string;
    color: string;
}) {
    return (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-5 flex items-center gap-4">
            <div className={`p-3 rounded-xl ${color}`}>{icon}</div>
            <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 leading-tight">{value}</p>
                {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
            </div>
        </div>
    );
}

// ── página principal ──────────────────────────────────────────
export default function AdminMetricasPage() {
    const [data, setData] = useState<MetricasData | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    // selector de mes: valor "YYYY-MM"
    const hoy = new Date();
    const mesHoy = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}`;
    const [mesSel, setMesSel] = useState(mesHoy);

    // generar opciones: últimos 12 meses
    const opcionesMes = Array.from({ length: 12 }, (_, i) => {
        const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
        const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const label = d.toLocaleDateString("es-VE", { month: "long", year: "numeric" });
        return { val, label };
    });

    const fetchData = async (mes = mesSel) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/metricas?mes=${mes}`);
            if (res.ok) {
                setData(await res.json());
                setLastUpdated(new Date());
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(mesSel); }, [mesSel]);

    const mesActual = opcionesMes.find(o => o.val === mesSel)?.label ?? mesSel;

    // preparar items de barras
    const citasItems: BarItem[] = (data?.citasPorEstado ?? []).map(c => ({
        label: c.estado.replace(/_/g, " "),
        total: c.total,
        color: ESTADO_CITA[c.estado] ?? "#6b7280",
    }));
    const emergItems: BarItem[] = (data?.emergenciasPorNivel ?? []).map(e => ({
        label: e.nivel,
        total: e.total,
        color: NIVEL_URGENCIA[e.nivel] ?? "#6b7280",
    }));
    const movItems: BarItem[] = (data?.movimientosPorTipo ?? []).map(m => ({
        label: m.tipo,
        total: m.total,
        color: TIPO_MOV[m.tipo] ?? "#6b7280",
    }));

    const maxCitas  = Math.max(...citasItems.map(i => i.total), 1);
    const maxEmerg  = Math.max(...emergItems.map(i => i.total), 1);
    const maxMov    = Math.max(...movItems.map(i => i.total), 1);
    const maxMedico = Math.max(...(data?.topMedicos.map(m => m.totalCitas) ?? [1]));

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-wrap items-center gap-4 justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <BarChart3 className="text-blue-600 dark:text-blue-400" size={22} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Métricas y Reportes</h1>
                        <p className="text-sm text-gray-500 capitalize">{mesActual}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Selector de mes */}
                    <select
                        value={mesSel}
                        onChange={e => setMesSel(e.target.value)}
                        className="text-sm border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 bg-white dark:bg-zinc-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400/40 capitalize"
                    >
                        {opcionesMes.map(o => (
                            <option key={o.val} value={o.val} className="capitalize">{o.label}</option>
                        ))}
                    </select>

                    <button
                        onClick={() => fetchData(mesSel)}
                        disabled={loading}
                        className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors disabled:opacity-50"
                    >
                        <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                        {lastUpdated
                            ? `${lastUpdated.toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" })}`
                            : "Actualizar"}
                    </button>
                </div>
            </div>

            {loading && !data ? (
                <div className="flex justify-center items-center py-32">
                    <Loader2 className="animate-spin text-blue-500" size={36} />
                </div>
            ) : (
                <>
                    {/* ── KPI cards ── */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <KpiCard
                            icon={<Users size={20} className="text-violet-600" />}
                            label="Pacientes registrados"
                            value={(data?.kpis.totalPacientes ?? 0).toLocaleString()}
                            color="bg-violet-50 dark:bg-violet-900/20"
                        />
                        <KpiCard
                            icon={<CalendarCheck size={20} className="text-blue-600" />}
                            label="Citas este mes"
                            value={data?.kpis.citasMes ?? 0}
                            sub="Excluye emergencias"
                            color="bg-blue-50 dark:bg-blue-900/20"
                        />
                        <KpiCard
                            icon={<Ambulance size={20} className="text-red-500" />}
                            label="Emergencias del mes"
                            value={data?.kpis.emergenciasActivas ?? 0}
                            sub="Total ingresadas"
                            color="bg-red-50 dark:bg-red-900/20"
                        />
                        <KpiCard
                            icon={<DollarSign size={20} className="text-emerald-600" />}
                            label="Ingresos del mes"
                            value={`$${(data?.kpis.ingresosMes ?? 0).toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                            sub="Pagos validados (USD)"
                            color="bg-emerald-50 dark:bg-emerald-900/20"
                        />
                    </div>

                    {/* ── Charts fila 1 ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                        {/* Citas por estado */}
                        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-6">
                            <div className="flex items-center gap-2 mb-5">
                                <CalendarCheck size={16} className="text-blue-500" />
                                <h2 className="font-semibold text-gray-800 dark:text-gray-200">Citas por estado</h2>
                                <span className="ml-auto text-xs text-gray-400">este mes</span>
                            </div>
                            {citasItems.length === 0 ? (
                                <p className="text-sm text-gray-400 text-center py-6">Sin datos este mes</p>
                            ) : (
                                <BarChart items={citasItems} max={maxCitas} />
                            )}
                        </div>

                        {/* Emergencias por nivel */}
                        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-6">
                            <div className="flex items-center gap-2 mb-5">
                                <Ambulance size={16} className="text-red-500" />
                                <h2 className="font-semibold text-gray-800 dark:text-gray-200">Emergencias por nivel</h2>
                                <span className="ml-auto text-xs text-gray-400">este mes</span>
                            </div>
                            {emergItems.length === 0 ? (
                                <p className="text-sm text-gray-400 text-center py-6">Sin emergencias este mes</p>
                            ) : (
                                <BarChart items={emergItems} max={maxEmerg} />
                            )}
                        </div>
                    </div>

                    {/* ── Charts fila 2 ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                        {/* Movimientos de inventario */}
                        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-6">
                            <div className="flex items-center gap-2 mb-5">
                                <Package size={16} className="text-orange-500" />
                                <h2 className="font-semibold text-gray-800 dark:text-gray-200">Inventario — movimientos</h2>
                                <span className="ml-auto text-xs text-gray-400 capitalize">{mesActual}</span>
                            </div>
                            {movItems.length === 0 ? (
                                <p className="text-sm text-gray-400 text-center py-6">Sin movimientos esta semana</p>
                            ) : (
                                <BarChart items={movItems} max={maxMov} />
                            )}
                        </div>

                        {/* Top médicos */}
                        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-6">
                            <div className="flex items-center gap-2 mb-5">
                                <Stethoscope size={16} className="text-[#2D6B4F]" />
                                <h2 className="font-semibold text-gray-800 dark:text-gray-200">Top médicos por citas</h2>
                                <span className="ml-auto text-xs text-gray-400">este mes</span>
                            </div>
                            {!data?.topMedicos.length ? (
                                <p className="text-sm text-gray-400 text-center py-6">Sin datos este mes</p>
                            ) : (
                                <div className="space-y-4">
                                    {data.topMedicos.map((m, i) => (
                                        <div key={m.medicoId} className="flex items-center gap-3">
                                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                                                i === 0 ? "bg-yellow-100 text-yellow-700"
                                                : i === 1 ? "bg-gray-100 text-gray-600"
                                                : i === 2 ? "bg-orange-100 text-orange-600"
                                                : "bg-gray-50 text-gray-400"
                                            }`}>
                                                {i + 1}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{m.nombre}</p>
                                                <p className="text-xs text-gray-400 truncate">{m.especialidad}</p>
                                                <div className="h-1.5 bg-gray-100 dark:bg-zinc-700 rounded-full mt-1.5 overflow-hidden">
                                                    <div
                                                        className="h-full bg-[#2D6B4F] rounded-full transition-all duration-700"
                                                        style={{ width: `${(m.totalCitas / maxMedico) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                            <span className="text-sm font-bold text-gray-700 dark:text-gray-300 shrink-0">
                                                {m.totalCitas}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                </>
            )}
        </div>
    );
}
