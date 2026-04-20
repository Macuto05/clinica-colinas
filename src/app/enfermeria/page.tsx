"use client";

import { useEffect, useState } from "react";
import {
    Activity, Heart, Clock, Siren, UserCheck, CheckCircle,
    RefreshCw, Filter, User, AlertTriangle
} from "lucide-react";
import GestionPacientePanel from "./components/GestionPacientePanel";

/* ─── Types ──────────────────────────────────────────────── */
interface Emergencia {
    emergenciaId: string;
    paciente: string;
    documento: string;
    telefono: string;
    motivoIngreso: string;
    nivelUrgencia: "CRITICO" | "URGENTE" | "MODERADO" | "LEVE";
    estadoEmergencia: "EN_ATENCION" | "HOSPITALIZADO" | "CIRUGIA_URGENTE";
    fechaIngreso: string;
    citaId: string | null;
    medico: { medicoId: string; nombre: string; especialidad: string } | null;
    tieneSeguro: boolean;
}

/* ─── Config maps ─────────────────────────────────────────── */
const URGENCY: Record<string, { bar: string; pill: string; label: string; glow: string }> = {
    CRITICO:  { bar: "bg-red-500",    pill: "bg-red-500 text-white",    label: "🔴 Crítico", glow: "shadow-red-100" },
    URGENTE:  { bar: "bg-orange-400", pill: "bg-orange-400 text-white", label: "🟠 Urgente", glow: "shadow-orange-100" },
    MODERADO: { bar: "bg-yellow-400", pill: "bg-yellow-400 text-white", label: "🟡 Moderado", glow: "shadow-yellow-100" },
    LEVE:     { bar: "bg-green-400",  pill: "bg-green-400 text-white",  label: "🟢 Leve", glow: "shadow-green-100" },
};

const STATUS_BADGE: Record<string, { label: string; color: string; Icon: any }> = {
    EN_ATENCION:     { label: "En Atención",    color: "bg-blue-100/80 text-blue-700 border-blue-200/50",    Icon: Heart },
    HOSPITALIZADO:   { label: "Hospitalizado",  color: "bg-amber-100/80 text-amber-700 border-amber-200/50", Icon: Clock },
    CIRUGIA_URGENTE: { label: "Cirugía Urgente",color: "bg-red-100/80 text-red-700 border-red-200/50",      Icon: Siren },
};

function timeSince(dateStr: string) {
    const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ${mins % 60}m`;
    return `${Math.floor(hrs / 24)}d`;
}

/* ─── Patient Card ────────────────────────────────────────── */
function PacienteCard({ e, onGestionar }: { e: Emergencia; onGestionar: (id: string) => void }) {
    const urg = URGENCY[e.nivelUrgencia] ?? URGENCY.MODERADO;
    const st  = STATUS_BADGE[e.estadoEmergencia] ?? STATUS_BADGE.EN_ATENCION;
    const StIcon = st.Icon;

    return (
        <div className={`bg-white/60 backdrop-blur-xl border border-white/80 rounded-[2rem] shadow-[0_8px_32px_0_rgba(0,0,0,0.06)] hover:shadow-[0_16px_48px_0_rgba(0,0,0,0.10)] hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col relative group`}>
            {/* Urgency top bar */}
            <div className={`absolute top-0 left-0 right-0 h-1.5 ${urg.bar} shadow-md`} />

            <div className="p-6 flex flex-col gap-4 pt-7">
                {/* Header */}
                <div className="flex justify-between items-start gap-3">
                    <div className="min-w-0">
                        <h3 className="font-extrabold text-gray-900 text-[16px] leading-tight truncate">{e.paciente}</h3>
                        <p className="text-xs text-gray-400 font-mono mt-0.5">{e.documento}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className={`rounded-xl px-2.5 py-1 text-[10px] font-black tracking-widest uppercase shadow-sm ${urg.pill}`}>
                            {urg.label}
                        </span>
                        <span className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 bg-white/70 px-2 py-1 rounded-lg border border-white/80 shadow-sm">
                            <Clock size={11} className="text-gray-400" /> {timeSince(e.fechaIngreso)}
                        </span>
                    </div>
                </div>

                {/* Motivo + Médico */}
                <div className="bg-gradient-to-br from-gray-50/80 to-gray-100/50 rounded-2xl p-3.5 border border-gray-100/60 shadow-inner space-y-2.5">
                    <p className="text-[12px] text-gray-600 font-medium leading-snug line-clamp-2">{e.motivoIngreso}</p>
                    <div className="flex items-center gap-2 pt-2 border-t border-gray-200/50">
                        <User size={13} className={e.medico ? "text-blue-500" : "text-red-400"} />
                        <p className={`text-[11px] font-bold truncate ${e.medico ? "text-blue-700" : "text-red-500"}`}>
                            {e.medico ? e.medico.nombre : "⚠ Sin médico asignado"}
                        </p>
                    </div>
                </div>

                {/* Status + Warning if no citaId */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold border shadow-sm ${st.color}`}>
                        <StIcon size={11} /> {st.label}
                    </span>
                    {!e.citaId && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50/80 border border-amber-200/60 rounded-full px-2 py-1">
                            <AlertTriangle size={10} /> Sin cita
                        </span>
                    )}
                    {e.tieneSeguro && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50/80 border border-blue-200/60 rounded-full px-2 py-1">
                            🛡 Asegurado
                        </span>
                    )}
                </div>

                {/* Action button */}
                <button
                    onClick={() => onGestionar(e.emergenciaId)}
                    className="w-full flex items-center justify-center gap-2 text-[13px] font-black text-white bg-slate-900 hover:bg-slate-800 py-3 rounded-xl shadow-lg shadow-slate-900/20 hover:shadow-slate-900/30 transition-all duration-200 border border-slate-700/50 group-hover:scale-[1.01]"
                >
                    <Activity size={15} /> Gestionar Paciente
                </button>
            </div>
        </div>
    );
}

/* ─── Filter Tabs ─────────────────────────────────────────── */
const FILTERS = [
    { key: "TODOS",          label: "Todos",           icon: Activity },
    { key: "EN_ATENCION",    label: "En Atención",      icon: Heart },
    { key: "HOSPITALIZADO",  label: "Hospitalizados",   icon: Clock },
    { key: "CIRUGIA_URGENTE",label: "Cirugía",          icon: Siren },
];

/* ─── Main Page ───────────────────────────────────────────── */
export default function EnfermeriaPage() {
    const [emergencias, setEmergencias] = useState<Emergencia[]>([]);
    const [isLoading, setIsLoading]     = useState(true);
    const [filter, setFilter]           = useState("TODOS");
    const [selectedId, setSelectedId]   = useState<string | null>(null);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/emergency?active=true");
            if (res.ok) {
                const data = await res.json();
                setEmergencias(data);
            }
        } catch (e) { console.error(e); }
        finally { setIsLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const filtered = filter === "TODOS"
        ? emergencias
        : emergencias.filter(e => e.estadoEmergencia === filter);

    const counts = {
        TODOS:           emergencias.length,
        EN_ATENCION:     emergencias.filter(e => e.estadoEmergencia === "EN_ATENCION").length,
        HOSPITALIZADO:   emergencias.filter(e => e.estadoEmergencia === "HOSPITALIZADO").length,
        CIRUGIA_URGENTE: emergencias.filter(e => e.estadoEmergencia === "CIRUGIA_URGENTE").length,
    } as Record<string, number>;

    return (
        <div className="space-y-6">
            {/* ── Header ──────────────────────────────────── */}
            <div className="bg-white/40 backdrop-blur-md border border-white/50 rounded-3xl px-6 py-5 shadow-[0_4px_16px_0_rgba(0,0,0,0.04)] flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-lime-500/10 border border-lime-400/20 flex items-center justify-center shadow-inner">
                        <Activity size={22} className="text-lime-600" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-gray-900 tracking-tight">Estación de Enfermería</h1>
                        <p className="text-sm text-gray-500 font-medium">
                            {isLoading ? "Cargando…" : `${emergencias.length} paciente${emergencias.length !== 1 ? "s" : ""} en piso actualmente`}
                        </p>
                    </div>
                </div>
                <button
                    onClick={fetchData}
                    disabled={isLoading}
                    className="flex items-center gap-2 text-sm font-bold text-gray-600 bg-white/60 hover:bg-white/80 border border-white/60 px-4 py-2.5 rounded-2xl shadow-sm transition-all disabled:opacity-50"
                >
                    <RefreshCw size={15} className={isLoading ? "animate-spin" : ""} />
                    Actualizar
                </button>
            </div>

            {/* ── Filter Tabs ──────────────────────────────── */}
            <div className="bg-white/40 backdrop-blur-md border border-white/50 rounded-3xl p-2 shadow-[0_4px_16px_0_rgba(0,0,0,0.04)] flex gap-1.5 flex-wrap">
                {FILTERS.map(f => {
                    const isActive = filter === f.key;
                    const FIcon = f.icon;
                    return (
                        <button
                            key={f.key}
                            onClick={() => setFilter(f.key)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold transition-all ${
                                isActive
                                    ? "bg-lime-500 text-white shadow-lg shadow-lime-200 border border-lime-400/50 scale-[1.02]"
                                    : "text-gray-500 hover:bg-white/60 border border-transparent hover:border-white/60"
                            }`}
                        >
                            <FIcon size={14} />
                            {f.label}
                            <span className={`text-[11px] font-black px-1.5 py-0.5 rounded-full ${
                                isActive ? "bg-white/20" : "bg-gray-100"
                            }`}>
                                {counts[f.key] ?? 0}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* ── Patient Grid ─────────────────────────────── */}
            {isLoading ? (
                <div className="flex justify-center items-center py-24">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-lime-500/10 border border-lime-400/20 flex items-center justify-center animate-pulse">
                            <Activity size={20} className="text-lime-500" />
                        </div>
                        <p className="text-sm font-bold text-gray-400">Cargando pacientes en piso…</p>
                    </div>
                </div>
            ) : filtered.length === 0 ? (
                <div className="bg-white/40 backdrop-blur-md border border-white/50 rounded-3xl p-16 text-center shadow-[0_4px_16px_0_rgba(0,0,0,0.04)]">
                    <UserCheck size={48} className="mx-auto mb-4 text-gray-300" />
                    <h3 className="text-base font-black text-gray-700 mb-1">Sin pacientes activos</h3>
                    <p className="text-sm text-gray-400 font-medium">
                        {filter === "TODOS"
                            ? "No hay pacientes en piso en este momento."
                            : `No hay pacientes con estado "${FILTERS.find(f => f.key === filter)?.label}".`}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {filtered.map(e => (
                        <PacienteCard key={e.emergenciaId} e={e} onGestionar={setSelectedId} />
                    ))}
                </div>
            )}

            {/* ── Side Panel ───────────────────────────────── */}
            {selectedId && (
                <GestionPacientePanel
                    emergenciaId={selectedId}
                    onClose={() => setSelectedId(null)}
                    onStatusChange={fetchData}
                />
            )}
        </div>
    );
}
