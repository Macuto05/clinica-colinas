"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
    Heart, Clock, Siren, Search, FlaskConical, Package,
    ChevronRight, X, Plus, Minus, Loader2, CheckCircle,
    AlertTriangle, Stethoscope, Activity, RefreshCw, UserCheck,
    ClipboardList, Pill,
} from "lucide-react";

/* ─── Types ──────────────────────────────────────────────── */
interface Emergencia {
    emergenciaId: string;
    citaId: string | null;
    paciente: string;
    documento: string;
    nivelUrgencia: string;
    estadoEmergencia: string;
    motivoIngreso: string;
    fechaIngreso: string;
    medico: { nombre: string; especialidad: string } | null;
}

interface Insumo {
    insumoId: string;
    codigo: string;
    nombre: string;
    unidadMedida: string;
    stockTotal: number;
}

interface ItemCarrito {
    insumo: Insumo;
    cantidad: number;
}

interface Examen {
    examenId: string;
    nombre: string;
    descripcion?: string;
}

/* ─── Config ──────────────────────────────────────────────── */
const URGENCY_BADGE: Record<string, string> = {
    CRITICO: "bg-red-500 text-white",
    URGENTE: "bg-orange-400 text-white",
    MODERADO: "bg-yellow-400 text-black",
    LEVE: "bg-green-500 text-white",
};

const STATUS_CONFIG: Record<string, { label: string; color: string; Icon: any }> = {
    HOSPITALIZADO:   { label: "Hospitalizado",   color: "text-amber-700 bg-amber-100/70",   Icon: Clock },
    CIRUGIA_URGENTE: { label: "Cirugía Urgente", color: "text-red-700 bg-red-100/70",       Icon: Siren },
    EN_ATENCION:     { label: "En Atención",     color: "text-blue-700 bg-blue-100/70",     Icon: Heart },
};

function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const h = Math.floor(diff / 3_600_000);
    const m = Math.floor((diff % 3_600_000) / 60_000);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
}

/* ─── Sub-components ──────────────────────────────────────── */
function PatientCard({ e, onSelect, selected }: { e: Emergencia; onSelect: () => void; selected: boolean }) {
    const urg = URGENCY_BADGE[e.nivelUrgencia] ?? "bg-gray-200 text-gray-700";
    const st  = STATUS_CONFIG[e.estadoEmergencia] ?? STATUS_CONFIG.EN_ATENCION;
    const StIcon = st.Icon;

    return (
        <button
            onClick={onSelect}
            className={`w-full text-left rounded-3xl border transition-all duration-200 p-5 shadow-[0_4px_16px_0_rgba(0,0,0,0.04)] ${
                selected
                    ? "bg-white/70 border-red-400/40 ring-2 ring-red-400/20 shadow-[0_8px_24px_rgba(239,68,68,0.12)]"
                    : "bg-white/40 border-white/50 hover:bg-white/60 hover:border-white/70"
            } backdrop-blur-md`}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-black rounded-full px-2 py-0.5 ${urg}`}>
                            {e.nivelUrgencia}
                        </span>
                        <span className={`text-[10px] font-bold rounded-full px-2 py-0.5 inline-flex items-center gap-1 ${st.color}`}>
                            <StIcon size={9} /> {st.label}
                        </span>
                    </div>
                    <h3 className="font-black text-gray-900 text-sm leading-tight truncate">{e.paciente}</h3>
                    <p className="text-xs text-gray-500 font-mono mt-0.5">{e.documento}</p>
                </div>
                <div className="shrink-0 text-right">
                    <p className="text-xs font-bold text-gray-400">{timeAgo(e.fechaIngreso)}</p>
                    <ChevronRight size={14} className={`mt-1 ml-auto transition-colors ${selected ? "text-red-400" : "text-gray-300"}`} />
                </div>
            </div>
            <p className="text-xs text-gray-500 mt-2 line-clamp-1 italic">{e.motivoIngreso}</p>
            {e.medico && (
                <p className="text-xs text-blue-600 font-medium mt-1 flex items-center gap-1">
                    <Stethoscope size={10} /> {e.medico.nombre}
                </p>
            )}
        </button>
    );
}

/* ─── Main Page ───────────────────────────────────────────── */
export default function EnfermeriaPage() {
    const [tab, setTab]           = useState<"hospitalizados" | "todos">("hospitalizados");
    const [emergencias, setEmergencias]   = useState<Emergencia[]>([]);
    const [loading, setLoading]   = useState(true);
    const [selected, setSelected] = useState<Emergencia | null>(null);
    const [panel, setPanel]       = useState<"insumos" | "laboratorio" | null>(null);

    // Insumos state
    const [insumoSearch, setInsumoSearch] = useState("");
    const [insumos, setInsumos]           = useState<Insumo[]>([]);
    const [loadingIns, setLoadingIns]     = useState(false);
    const [carrito, setCarrito]           = useState<ItemCarrito[]>([]);
    const [savingIns, setSavingIns]       = useState(false);
    const [insSuccess, setInsSuccess]     = useState(false);

    // Lab state
    const [examenes, setExamenes]           = useState<Examen[]>([]);
    const [loadingLab, setLoadingLab]       = useState(false);
    const [selectedExams, setSelectedExams] = useState<Set<string>>(new Set());
    const [labObs, setLabObs]               = useState("");
    const [savingLab, setSavingLab]         = useState(false);
    const [labSuccess, setLabSuccess]       = useState(false);

    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    /* Fetch patients */
    const fetchEmergencias = useCallback(async () => {
        setLoading(true);
        const q = tab === "hospitalizados"
            ? "?status=HOSPITALIZADO&status2=CIRUGIA_URGENTE"
            : "?active=true";
        const res = await fetch(`/api/emergency${q}`);
        if (res.ok) setEmergencias(await res.json());
        setLoading(false);
    }, [tab]);

    useEffect(() => { fetchEmergencias(); }, [fetchEmergencias]);

    /* Fetch insumos (debounced) */
    useEffect(() => {
        if (panel !== "insumos") return;
        if (searchTimer.current) clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(async () => {
            setLoadingIns(true);
            const res = await fetch(`/api/enfermeria/insumos?q=${encodeURIComponent(insumoSearch)}`);
            if (res.ok) setInsumos(await res.json());
            setLoadingIns(false);
        }, 300);
    }, [insumoSearch, panel]);

    /* Fetch examenes once */
    useEffect(() => {
        if (panel !== "laboratorio" || examenes.length > 0) return;
        setLoadingLab(true);
        fetch("/api/enfermeria/laboratorio")
            .then(r => r.ok ? r.json() : [])
            .then(d => setExamenes(d))
            .finally(() => setLoadingLab(false));
    }, [panel]);

    /* Open panel */
    const openPanel = (p: "insumos" | "laboratorio") => {
        setPanel(p);
        setInsSuccess(false);
        setLabSuccess(false);
        setCarrito([]);
        setSelectedExams(new Set());
        setLabObs("");
        setInsumoSearch("");
    };

    /* Carrito helpers */
    const addToCart = (ins: Insumo) => {
        setCarrito(c => {
            const existing = c.find(i => i.insumo.insumoId === ins.insumoId);
            if (existing) return c.map(i => i.insumo.insumoId === ins.insumoId ? { ...i, cantidad: i.cantidad + 1 } : i);
            return [...c, { insumo: ins, cantidad: 1 }];
        });
    };
    const adjustCart = (id: string, delta: number) => {
        setCarrito(c => c
            .map(i => i.insumo.insumoId === id ? { ...i, cantidad: Math.max(1, i.cantidad + delta) } : i)
            .filter(i => i.cantidad > 0));
    };
    const removeFromCart = (id: string) => setCarrito(c => c.filter(i => i.insumo.insumoId !== id));

    /* Submit insumos */
    const submitInsumos = async () => {
        if (!selected?.citaId || carrito.length === 0) return;
        setSavingIns(true);
        try {
            const res = await fetch("/api/enfermeria/consumo", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    citaId: selected.citaId,
                    insumos: carrito.map(i => ({ insumoId: i.insumo.insumoId, cantidad: i.cantidad })),
                }),
            });
            if (res.ok) {
                setInsSuccess(true);
                setCarrito([]);
            }
        } finally { setSavingIns(false); }
    };

    /* Submit lab */
    const submitLab = async () => {
        if (!selected?.citaId || selectedExams.size === 0) return;
        setSavingLab(true);
        try {
            const res = await fetch("/api/enfermeria/laboratorio", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    citaId:   selected.citaId,
                    examenes: Array.from(selectedExams).map(id => ({ examenId: id })),
                    observaciones: labObs || null,
                }),
            });
            if (res.ok) {
                setLabSuccess(true);
                setSelectedExams(new Set());
                setLabObs("");
            }
        } finally { setSavingLab(false); }
    };

    const hospitalizados = emergencias.filter(e => e.estadoEmergencia === "HOSPITALIZADO" || e.estadoEmergencia === "CIRUGIA_URGENTE");
    const displayList    = tab === "hospitalizados" ? hospitalizados : emergencias;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 via-teal-50/30 to-cyan-50/20 p-4 md:p-6 space-y-6">

            {/* Header */}
            <div className="bg-white/40 backdrop-blur-md border border-white/50 rounded-3xl p-5 shadow-[0_4px_16px_0_rgba(0,0,0,0.04)] flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-teal-500/10 border border-teal-400/20 flex items-center justify-center shrink-0">
                        <Heart size={20} className="text-teal-600" />
                    </div>
                    <div>
                        <h1 className="text-lg font-black text-gray-900 tracking-tight">Módulo de Enfermería</h1>
                        <p className="text-xs text-gray-500 font-medium">Gestión de pacientes hospitalizados</p>
                    </div>
                </div>
                <button
                    onClick={fetchEmergencias}
                    className="p-2.5 rounded-2xl bg-white/50 border border-white/60 text-gray-500 hover:text-gray-800 hover:bg-white/80 transition-all"
                >
                    <RefreshCw size={15} />
                </button>
            </div>

            {/* Stats strip */}
            <div className="grid grid-cols-3 gap-3">
                {[
                    { label: "Hospitalizados", value: emergencias.filter(e => e.estadoEmergencia === "HOSPITALIZADO").length, color: "text-amber-600", bg: "bg-amber-100/60" },
                    { label: "Cirugía Urgente", value: emergencias.filter(e => e.estadoEmergencia === "CIRUGIA_URGENTE").length, color: "text-red-600", bg: "bg-red-100/60" },
                    { label: "En Atención", value: emergencias.filter(e => e.estadoEmergencia === "EN_ATENCION").length, color: "text-blue-600", bg: "bg-blue-100/60" },
                ].map(s => (
                    <div key={s.label} className={`${s.bg} backdrop-blur-md border border-white/50 rounded-3xl p-4 text-center shadow-[0_4px_16px_0_rgba(0,0,0,0.04)]`}>
                        <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-0.5">{s.label}</p>
                    </div>
                ))}
            </div>

            <div className="flex gap-4 items-start">
                {/* Patient list */}
                <div className="flex-1 min-w-0 space-y-3">
                    {/* Tabs */}
                    <div className="bg-white/40 backdrop-blur-md border border-white/50 rounded-2xl p-1 flex gap-1">
                        {([
                            { key: "hospitalizados", label: "Hospitalizados" },
                            { key: "todos",          label: "Todos Activos" },
                        ] as const).map(t => (
                            <button
                                key={t.key}
                                onClick={() => { setTab(t.key); setSelected(null); setPanel(null); }}
                                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                                    tab === t.key
                                        ? "bg-white/80 text-gray-900 shadow-sm"
                                        : "text-gray-500 hover:text-gray-700"
                                }`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {/* List */}
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="animate-spin text-teal-500" size={28} />
                        </div>
                    ) : displayList.length === 0 ? (
                        <div className="bg-white/40 backdrop-blur-md border border-white/50 rounded-3xl p-10 text-center shadow-[0_4px_16px_0_rgba(0,0,0,0.04)]">
                            <Heart size={32} className="mx-auto mb-3 text-gray-300" />
                            <p className="text-sm font-bold text-gray-400">
                                {tab === "hospitalizados" ? "No hay pacientes hospitalizados" : "No hay emergencias activas"}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {displayList.map(e => (
                                <PatientCard
                                    key={e.emergenciaId}
                                    e={e}
                                    selected={selected?.emergenciaId === e.emergenciaId}
                                    onSelect={() => {
                                        setSelected(e);
                                        setPanel(null);
                                        setInsSuccess(false);
                                        setLabSuccess(false);
                                        setCarrito([]);
                                        setSelectedExams(new Set());
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Action Panel */}
                {selected && (
                    <div className="w-[440px] shrink-0 space-y-3">
                        {/* Patient header */}
                        <div className="bg-white/60 backdrop-blur-md border border-white/60 rounded-3xl p-5 shadow-[0_4px_16px_0_rgba(0,0,0,0.04)]">
                            <div className="flex items-start justify-between gap-3 mb-3">
                                <div>
                                    <h2 className="font-black text-gray-900 text-base leading-tight">{selected.paciente}</h2>
                                    <p className="text-xs text-gray-500 font-mono">{selected.documento}</p>
                                </div>
                                <button
                                    onClick={() => { setSelected(null); setPanel(null); }}
                                    className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-white/60 rounded-full transition-all shrink-0"
                                >
                                    <X size={15} />
                                </button>
                            </div>
                            <div className="bg-white/50 border border-white/60 rounded-2xl px-4 py-3 text-xs text-gray-600 space-y-1">
                                <p><span className="font-bold text-gray-400">Motivo:</span> {selected.motivoIngreso}</p>
                                <p><span className="font-bold text-gray-400">Ingreso:</span> {new Date(selected.fechaIngreso).toLocaleString("es-VE")} ({timeAgo(selected.fechaIngreso)} atrás)</p>
                                {selected.medico && (
                                    <p><span className="font-bold text-gray-400">Médico:</span> {selected.medico.nombre}</p>
                                )}
                                {!selected.citaId && (
                                    <p className="text-amber-600 font-bold flex items-center gap-1">
                                        <AlertTriangle size={11} /> Sin cita vinculada — registro de insumos/lab no disponible
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => openPanel(panel === "insumos" ? null : "insumos")}
                                disabled={!selected.citaId}
                                className={`flex flex-col items-center gap-2 py-4 rounded-3xl border font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                                    panel === "insumos"
                                        ? "bg-teal-500/90 text-white border-teal-400/50 shadow-[0_8px_20px_rgba(20,184,166,0.3)]"
                                        : "bg-white/50 border-white/60 text-gray-700 hover:bg-white/70"
                                }`}
                            >
                                <Package size={22} />
                                Cargar Insumos
                            </button>
                            <button
                                onClick={() => openPanel(panel === "laboratorio" ? null : "laboratorio")}
                                disabled={!selected.citaId}
                                className={`flex flex-col items-center gap-2 py-4 rounded-3xl border font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                                    panel === "laboratorio"
                                        ? "bg-violet-500/90 text-white border-violet-400/50 shadow-[0_8px_20px_rgba(139,92,246,0.3)]"
                                        : "bg-white/50 border-white/60 text-gray-700 hover:bg-white/70"
                                }`}
                            >
                                <FlaskConical size={22} />
                                Pedir Laboratorio
                            </button>
                        </div>

                        {/* ── INSUMOS PANEL ── */}
                        {panel === "insumos" && (
                            <div className="bg-white/60 backdrop-blur-md border border-white/60 rounded-3xl overflow-hidden shadow-[0_4px_16px_0_rgba(0,0,0,0.06)]">
                                {/* Step header */}
                                <div className="px-5 py-4 border-b border-white/40 bg-white/30 flex items-center gap-3">
                                    <span className="w-7 h-7 rounded-full bg-gray-900/90 text-white shadow-md text-xs font-black flex items-center justify-center shrink-0">1</span>
                                    <h4 className="font-bold text-gray-800 text-base">Carga de Suministros</h4>
                                </div>

                                <div className="p-5 space-y-4">
                                    {insSuccess ? (
                                        <div className="flex flex-col items-center py-8 gap-3">
                                            <CheckCircle size={36} className="text-teal-500" />
                                            <p className="font-black text-gray-800">¡Consumo registrado!</p>
                                            <p className="text-xs text-gray-500 text-center">El stock fue descontado y el movimiento registrado</p>
                                            <button
                                                onClick={() => { setInsSuccess(false); setCarrito([]); setInsumoSearch(""); }}
                                                className="mt-2 px-5 py-2.5 rounded-2xl bg-teal-500/90 text-white font-bold text-sm hover:bg-teal-600 transition-all"
                                            >
                                                Registrar otro consumo
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Search */}
                                            <div className="relative">
                                                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                                <input
                                                    type="text"
                                                    placeholder="Buscar insumo por nombre..."
                                                    value={insumoSearch}
                                                    onChange={e => setInsumoSearch(e.target.value)}
                                                    className="w-full pl-9 pr-4 py-3 rounded-2xl bg-white/50 border border-white/60 text-sm font-medium text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400/50 transition-all"
                                                />
                                            </div>

                                            {/* Results */}
                                            {loadingIns ? (
                                                <div className="flex justify-center py-4">
                                                    <Loader2 className="animate-spin text-teal-400" size={20} />
                                                </div>
                                            ) : (
                                                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                                                    {insumos.length === 0 && insumoSearch ? (
                                                        <p className="text-xs text-gray-400 text-center py-4">Sin resultados para "{insumoSearch}"</p>
                                                    ) : insumos.map(ins => (
                                                        <button
                                                            key={ins.insumoId}
                                                            onClick={() => addToCart(ins)}
                                                            className="w-full flex items-center justify-between px-4 py-2.5 rounded-2xl bg-white/50 border border-white/60 hover:bg-white/80 transition-all text-left group"
                                                        >
                                                            <div>
                                                                <p className="text-xs font-bold text-gray-800">{ins.nombre}</p>
                                                                <p className="text-[10px] text-gray-400">{ins.unidadMedida} · Stock: {ins.stockTotal}</p>
                                                            </div>
                                                            <Plus size={14} className="text-teal-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                                                        </button>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Cart */}
                                            {carrito.length > 0 && (
                                                <>
                                                    <div className="border-t border-white/40 pt-3">
                                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                                            <ClipboardList size={10} /> Carrito ({carrito.length})
                                                        </p>
                                                        <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                                                            {carrito.map(item => (
                                                                <div key={item.insumo.insumoId} className="flex items-center gap-2 bg-teal-50/60 border border-teal-200/40 rounded-2xl px-3 py-2">
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-xs font-bold text-gray-800 truncate">{item.insumo.nombre}</p>
                                                                        <p className="text-[10px] text-gray-500">{item.insumo.unidadMedida}</p>
                                                                    </div>
                                                                    <div className="flex items-center gap-1 shrink-0">
                                                                        <button onClick={() => adjustCart(item.insumo.insumoId, -1)} className="w-6 h-6 rounded-full bg-white/70 border border-white/60 flex items-center justify-center hover:bg-white transition-all">
                                                                            <Minus size={10} />
                                                                        </button>
                                                                        <span className="w-7 text-center text-xs font-black">{item.cantidad}</span>
                                                                        <button onClick={() => adjustCart(item.insumo.insumoId, 1)} className="w-6 h-6 rounded-full bg-white/70 border border-white/60 flex items-center justify-center hover:bg-white transition-all">
                                                                            <Plus size={10} />
                                                                        </button>
                                                                        <button onClick={() => removeFromCart(item.insumo.insumoId)} className="ml-1 text-red-400 hover:text-red-600 transition-colors">
                                                                            <X size={12} />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <button
                                                        onClick={submitInsumos}
                                                        disabled={savingIns}
                                                        className="w-full py-3.5 rounded-2xl bg-teal-500/95 hover:bg-teal-500 text-white font-bold shadow-[0_8px_20px_rgba(20,184,166,0.3)] border border-teal-400/50 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                                                    >
                                                        {savingIns ? <Loader2 size={16} className="animate-spin" /> : <Package size={16} />}
                                                        Registrar consumo
                                                    </button>
                                                </>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ── LABORATORIO PANEL ── */}
                        {panel === "laboratorio" && (
                            <div className="bg-white/60 backdrop-blur-md border border-white/60 rounded-3xl overflow-hidden shadow-[0_4px_16px_0_rgba(0,0,0,0.06)]">
                                {/* Step header */}
                                <div className="px-5 py-4 border-b border-white/40 bg-white/30 flex items-center gap-3">
                                    <span className="w-7 h-7 rounded-full bg-gray-900/90 text-white shadow-md text-xs font-black flex items-center justify-center shrink-0">2</span>
                                    <h4 className="font-bold text-gray-800 text-base">Solicitar Laboratorio</h4>
                                </div>

                                <div className="p-5 space-y-4">
                                    {labSuccess ? (
                                        <div className="flex flex-col items-center py-8 gap-3">
                                            <CheckCircle size={36} className="text-violet-500" />
                                            <p className="font-black text-gray-800">¡Solicitud enviada!</p>
                                            <p className="text-xs text-gray-500 text-center">La orden fue enviada al laboratorio para su atención</p>
                                            <button
                                                onClick={() => { setLabSuccess(false); setSelectedExams(new Set()); setLabObs(""); }}
                                                className="mt-2 px-5 py-2.5 rounded-2xl bg-violet-500/90 text-white font-bold text-sm hover:bg-violet-600 transition-all"
                                            >
                                                Nueva solicitud
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            {loadingLab ? (
                                                <div className="flex justify-center py-6">
                                                    <Loader2 className="animate-spin text-violet-400" size={22} />
                                                </div>
                                            ) : (
                                                <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
                                                    {examenes.length === 0 && (
                                                        <p className="text-xs text-gray-400 text-center py-4">No hay exámenes configurados</p>
                                                    )}
                                                    {examenes.map(ex => {
                                                        const sel = selectedExams.has(ex.examenId);
                                                        return (
                                                            <button
                                                                key={ex.examenId}
                                                                onClick={() => setSelectedExams(prev => {
                                                                    const n = new Set(prev);
                                                                    sel ? n.delete(ex.examenId) : n.add(ex.examenId);
                                                                    return n;
                                                                })}
                                                                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-2xl border transition-all text-left ${
                                                                    sel
                                                                        ? "bg-violet-50/80 border-violet-300/60 text-violet-800 ring-1 ring-violet-300/30"
                                                                        : "bg-white/50 border-white/60 text-gray-700 hover:bg-white/80"
                                                                }`}
                                                            >
                                                                <div>
                                                                    <p className="text-xs font-bold">{ex.nombre}</p>
                                                                    {ex.descripcion && <p className="text-[10px] text-gray-400 mt-0.5">{ex.descripcion}</p>}
                                                                </div>
                                                                {sel && <CheckCircle size={14} className="text-violet-500 shrink-0" />}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            {selectedExams.size > 0 && (
                                                <>
                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-bold text-gray-500/80 uppercase tracking-wider">Observaciones (opcional)</label>
                                                        <input
                                                            type="text"
                                                            value={labObs}
                                                            onChange={e => setLabObs(e.target.value)}
                                                            placeholder="Notas para el laboratorio..."
                                                            className="w-full px-4 py-3 rounded-2xl bg-white/50 border border-white/60 text-sm font-medium text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-400/50 transition-all"
                                                        />
                                                    </div>
                                                    <button
                                                        onClick={submitLab}
                                                        disabled={savingLab}
                                                        className="w-full py-3.5 rounded-2xl bg-violet-500/95 hover:bg-violet-500 text-white font-bold shadow-[0_8px_20px_rgba(139,92,246,0.3)] border border-violet-400/50 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                                                    >
                                                        {savingLab ? <Loader2 size={16} className="animate-spin" /> : <FlaskConical size={16} />}
                                                        Enviar solicitud ({selectedExams.size} examen{selectedExams.size > 1 ? "es" : ""})
                                                    </button>
                                                </>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
