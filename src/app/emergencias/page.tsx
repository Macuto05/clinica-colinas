"use client";

import { useEffect, useState } from "react";
import {
    Siren, Plus, Loader2, Clock, Shield, Phone, Ambulance,
    UserCheck, Activity, Heart, ChevronRight, AlertTriangle,
    FileText, User, ArrowUpRight, XCircle, CheckCircle
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

/* ─── Types ─────────────────────────────────────────── */
interface Emergencia {
    emergenciaId: string;
    paciente: string;
    documento: string;
    telefono: string;
    motivoIngreso: string;
    nivelUrgencia: "CRITICO" | "URGENTE" | "MODERADO" | "LEVE";
    estadoEmergencia: "TRIAJE" | "EN_ATENCION" | "HOSPITALIZADO" | "CIRUGIA_URGENTE" | "REFERIDO" | "ALTA";
    verificacionPago: "PENDIENTE" | "CONFIRMADO" | "SIN_COBERTURA";
    tipoPago: "PARTICULAR" | "ASEGURADO" | "PENDIENTE";
    fechaIngreso: string;
    fechaAlta: string | null;
    tieneSeguro: boolean;
    aseguradora: string | null;
}

/* ─── Config maps ────────────────────────────────────── */
const URGENCY: Record<string, { bar: string; pill: string; label: string }> = {
    CRITICO:  { bar: "bg-red-500",    pill: "bg-red-500 text-white",    label: "🔴 Crítico" },
    URGENTE:  { bar: "bg-orange-400", pill: "bg-orange-400 text-white", label: "🟠 Urgente" },
    MODERADO: { bar: "bg-yellow-400", pill: "bg-yellow-400 text-white", label: "🟡 Moderado" },
    LEVE:     { bar: "bg-green-400",  pill: "bg-green-400 text-white",  label: "🟢 Leve" },
};

const STATUS: Record<string, { label: string; color: string; Icon: any }> = {
    TRIAJE:         { label: "Triaje",          color: "bg-purple-100 text-purple-700", Icon: Activity },
    EN_ATENCION:    { label: "En Atención",     color: "bg-blue-100 text-blue-700",    Icon: Heart },
    HOSPITALIZADO:  { label: "Hospitalizado",   color: "bg-amber-100 text-amber-700",  Icon: Clock },
    CIRUGIA_URGENTE:{ label: "Cirugía Urgente", color: "bg-red-100 text-red-700",      Icon: Siren },
    REFERIDO:       { label: "Referido",        color: "bg-gray-100 text-gray-600",    Icon: XCircle },
    ALTA:           { label: "Alta",            color: "bg-green-100 text-green-700",  Icon: UserCheck },
};

const PAY_LABEL: Record<string, { label: string; color: string }> = {
    PENDIENTE:      { label: "⏳ Pago pendiente",  color: "text-amber-600" },
    CONFIRMADO:     { label: "✓ Pago confirmado",  color: "text-green-600" },
    SIN_COBERTURA:  { label: "✗ Sin cobertura",    color: "text-red-600"   },
};

/* ─── Helpers ────────────────────────────────────────── */
function timeSince(dateStr: string) {
    const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ${mins % 60}m`;
    return `${Math.floor(hrs / 24)}d`;
}

/* ─── Emergency Card ─────────────────────────────────── */
function EmergencyCard({ e }: { e: Emergencia }) {
    const pathname = usePathname();
    const urg = URGENCY[e.nivelUrgencia] ?? URGENCY.MODERADO;
    const st  = STATUS[e.estadoEmergencia] ?? STATUS.TRIAJE;
    const pay = PAY_LABEL[e.verificacionPago] ?? PAY_LABEL.PENDIENTE;
    const StIcon = st.Icon;

    return (
        <div className="bg-white/40 backdrop-blur-md border border-white/50 rounded-3xl shadow-[0_4px_16px_0_rgba(0,0,0,0.04)] hover:bg-white/60 hover:shadow-[0_8px_24px_0_rgba(0,0,0,0.08)] transition-all overflow-hidden flex flex-col">
            {/* Urgency accent bar */}
            <div className={`h-1 w-full ${urg.bar} opacity-90`} />

            <div className="p-5 flex flex-col gap-3.5 flex-1">
                {/* Row 1 — Patient + urgency pill + time */}
                <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                        <p className="font-black text-gray-900 leading-tight truncate tracking-tight">{e.paciente}</p>
                        <p className="text-xs text-gray-400/80 font-mono mt-0.5">{e.documento}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className={`rounded-full px-3 py-0.5 text-[11px] font-black shadow-sm ${urg.pill}`}>
                            {urg.label}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-gray-400/70">
                            <Clock size={10} /> {timeSince(e.fechaIngreso)}
                        </span>
                    </div>
                </div>

                {/* Row 2 — Motivo */}
                <p className="text-sm text-gray-600 line-clamp-2 font-medium">{e.motivoIngreso}</p>

                {/* Row 3 — Status + Insurance */}
                <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold border border-white/60 shadow-sm ${st.color}`}>
                        <StIcon size={11} /> {st.label}
                    </span>
                    {e.tieneSeguro && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-blue-100/70 text-blue-800 border border-blue-200/60 rounded-full px-2.5 py-1 shadow-sm">
                            <Shield size={10} /> {e.aseguradora}
                        </span>
                    )}
                </div>

                {/* Row 4 — Phone + Payment */}
                <div className="flex justify-between items-center pt-2 border-t border-white/50">
                    <span className="flex items-center gap-1.5 text-xs text-gray-400/80 font-medium">
                        <Phone size={10} /> {e.telefono || "—"}
                    </span>
                    <span className={`text-xs font-bold ${pay.color}`}>{pay.label}</span>
                </div>

                {/* View Detail */}
                <Link
                    href={`/emergencias/${e.emergenciaId}?returnTo=${encodeURIComponent(pathname?.includes('/recepcion') ? '/recepcion?tab=EMERGENCIAS' : '/emergencias')}`}
                    className="w-full flex items-center justify-center gap-1.5 text-sm font-bold text-red-600 hover:text-red-700 py-2.5 rounded-2xl hover:bg-red-50/60 transition-all border border-transparent hover:border-red-200/50"
                >
                    Ver Detalle <ArrowUpRight size={14} />
                </Link>
            </div>
        </div>
    );
}

/* ─── New Admission Form ─────────────────────────────── */
interface NewAdmissionModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

type FormMode = "search" | "selected" | "new-patient";

function NewAdmissionModal({ onClose, onSuccess }: NewAdmissionModalProps) {
    // Patient search
    const [mode, setMode] = useState<FormMode>("search");
    const [search, setSearch] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<any>(null);
    const [patientPolicies, setPatientPolicies] = useState<any[]>([]);
    const [loadingSearch, setLoadingSearch] = useState(false);

    // Quick patient creation
    const [newPatient, setNewPatient] = useState({ nombres: "", apellidos: "", documento: "", telefono: "" });

    // Emergency data
    const [motivo, setMotivo] = useState("");
    const [urgencia, setUrgencia] = useState("MODERADO");
    const [llegada, setLlegada] = useState("CUENTA_PROPIA");
    const [tipoPago, setTipoPago] = useState("PENDIENTE");
    const [observaciones, setObservaciones] = useState("");

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Debounced search
    useEffect(() => {
        if (search.length < 2) { setSearchResults([]); return; }
        const t = setTimeout(async () => {
            setLoadingSearch(true);
            try {
                const res = await fetch(`/api/reception/patients?search=${encodeURIComponent(search)}&limit=6`);
                if (res.ok) {
                    const data = await res.json();
                    setSearchResults(data.data || []);
                }
            } catch { } finally { setLoadingSearch(false); }
        }, 300);
        return () => clearTimeout(t);
    }, [search]);

    const selectPatient = async (p: any) => {
        setSelectedPatient(p);
        setMode("selected");
        setSearch("");
        setSearchResults([]);
        // Fetch active policies
        try {
            const res = await fetch(`/api/patients/${p.id}/policies`);
            if (res.ok) {
                const policies: any[] = await res.json();
                const active = policies.filter((pol: any) => pol.estado === "ACTIVA");
                setPatientPolicies(active);
                if (active.length > 0) {
                    setTipoPago("ASEGURADO");
                }
            }
        } catch { }
    };

    const createAndSubmit = async () => {
        setError(null);

        // Validate emergency data
        if (!motivo.trim()) { setError("Escribe el motivo de ingreso."); return; }

        setSaving(true);
        try {
            let pacienteId: string | null = null;

            if (mode === "new-patient") {
                if (!newPatient.nombres || !newPatient.apellidos || !newPatient.documento) {
                    setError("Nombre, apellido y documento son requeridos."); setSaving(false); return;
                }
                const res = await fetch("/api/reception/patients", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        nombres: newPatient.nombres,
                        apellidos: newPatient.apellidos,
                        documentoIdentidad: newPatient.documento,
                        telefono: newPatient.telefono || null,
                    })
                });
                if (!res.ok) {
                    const d = await res.json();
                    setError(d.error || "Error al crear el paciente."); setSaving(false); return;
                }
                const d = await res.json();
                pacienteId = d.patient.id;
            } else {
                if (!selectedPatient) { setError("Selecciona un paciente."); setSaving(false); return; }
                pacienteId = selectedPatient.id;
            }

            const res = await fetch("/api/emergency", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    pacienteId,
                    motivoIngreso: motivo,
                    nivelUrgencia: urgencia,
                    observaciones: `Llegada: ${llegada}${observaciones ? ". " + observaciones : ""}`,
                })
            });

            if (!res.ok) {
                const d = await res.json();
                setError(d.error || "Error al registrar emergencia."); setSaving(false); return;
            }
            onSuccess();
        } catch { setError("Error de conexión."); setSaving(false); }
    };

    const urgencyOptions = [
        { key: "CRITICO",  label: "Crítico",  emoji: "🔴", bg: "border-red-100 bg-white text-red-400 opacity-70 hover:opacity-100 hover:border-red-300",    sel: "border-red-600 bg-white text-red-700 shadow-md shadow-red-200 ring-2 ring-red-100 scale-[1.02]" },
        { key: "URGENTE",  label: "Urgente",  emoji: "🟠", bg: "border-orange-100 bg-white text-orange-400 opacity-70 hover:opacity-100 hover:border-orange-300", sel: "border-orange-600 bg-white text-orange-700 shadow-md shadow-orange-200 ring-2 ring-orange-100 scale-[1.02]" },
        { key: "MODERADO", label: "Moderado", emoji: "🟡", bg: "border-yellow-200 bg-white text-yellow-500 opacity-70 hover:opacity-100 hover:border-yellow-400", sel: "border-yellow-500 bg-white text-yellow-700 shadow-md shadow-yellow-200 ring-2 ring-yellow-100 scale-[1.02]" },
        { key: "LEVE",     label: "Leve",     emoji: "🟢", bg: "border-green-100 bg-white text-green-400 opacity-70 hover:opacity-100 hover:border-green-300",  sel: "border-green-600 bg-white text-green-700 shadow-md shadow-green-200 ring-2 ring-green-100 scale-[1.02]" },
    ];

    return (
        <div className="fixed inset-0 bg-slate-900/30 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-md transition-all">
            <div className="bg-white/70 backdrop-blur-2xl backdrop-saturate-[1.2] w-full sm:max-w-2xl rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-[0_8px_32px_0_rgba(0,0,0,0.12)] border border-white/60 max-h-[90vh] flex flex-col overflow-hidden">

                {/* Header */}
                <div className="p-6 border-b border-white/40 flex justify-between items-center shrink-0 bg-white/30">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 shadow-inner flex items-center justify-center backdrop-blur-md">
                            <Siren size={18} className="text-red-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-lg tracking-tight">Nuevo Ingreso de Emergencia</h3>
                            <p className="text-xs text-gray-500/80 font-medium">Completa la información del paciente y el caso</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2.5 rounded-full bg-white/40 hover:bg-white/60 border border-white/50 shadow-sm text-gray-500 hover:text-gray-700 transition-all">
                        <XCircle size={22} strokeWidth={2.5} />
                    </button>
                </div>

                <div className="overflow-y-auto flex-1 p-6 space-y-6">
                    {error && (
                        <div className="p-4 bg-red-50/80 backdrop-blur-md border border-red-200/50 text-red-700 rounded-2xl text-sm flex items-center gap-2 shadow-sm">
                            <AlertTriangle size={18} className="shrink-0" /> {error}
                        </div>
                    )}

                    {/* ── SECCIÓN 1: Paciente ── */}
                    <section className="bg-white/40 backdrop-blur-md border border-white/50 rounded-3xl p-5 shadow-[0_4px_16px_0_rgba(0,0,0,0.02)]">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="w-7 h-7 rounded-full bg-gray-900/90 text-white shadow-md text-xs font-black flex items-center justify-center">1</span>
                            <h4 className="font-bold text-gray-800 text-base">Identificar Paciente</h4>
                        </div>

                        {mode === "search" && (
                            <div className="space-y-3">
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Buscar por nombre o cédula..."
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        autoFocus
                                        className="w-full px-5 py-3.5 rounded-2xl bg-white/50 border border-white/60 focus:bg-white/80 focus:ring-2 focus:ring-red-400/50 outline-none text-sm shadow-inner transition-all placeholder:text-gray-400 font-medium"
                                    />
                                    {loadingSearch && <Loader2 size={18} className="animate-spin absolute right-4 top-3.5 text-gray-400" />}
                                </div>

                                {searchResults.length > 0 && (
                                    <div className="bg-white/50 backdrop-blur-lg border border-white/60 rounded-2xl overflow-hidden shadow-sm">
                                        {searchResults.map((p: any) => (
                                            <button key={p.id} onClick={() => selectPatient(p)}
                                                className="w-full text-left px-5 py-3.5 hover:bg-white/70 transition-colors flex items-center justify-between border-b border-white/40 last:border-0">
                                                <div>
                                                    <p className="font-bold text-gray-800 text-sm">{p.nombres} {p.apellidos}</p>
                                                    <p className="text-xs text-gray-500 font-mono font-medium mt-0.5">{p.documento} {p.telefono ? `· ${p.telefono}` : ""}</p>
                                                </div>
                                                <ChevronRight size={18} className="text-gray-400" />
                                            </button>
                                        ))}
                                    </div>
                                )}

                                <button onClick={() => setMode("new-patient")}
                                    className="w-full py-3 border-2 border-dashed border-gray-300/60 rounded-2xl text-sm font-semibold text-gray-500 hover:border-red-400/60 hover:text-red-600 transition-colors flex items-center justify-center gap-2 bg-white/20 hover:bg-white/40">
                                    <Plus size={18} /> Paciente no registrado — crear perfil
                                </button>
                            </div>
                        )}

                        {mode === "selected" && selectedPatient && (
                            <div className="rounded-2xl border border-green-400/30 bg-green-50/50 backdrop-blur-sm shadow-sm p-4 flex items-start justify-between gap-3">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-full bg-green-200/50 border border-green-300/50 shadow-inner flex items-center justify-center shrink-0">
                                        <User size={20} className="text-green-700" />
                                    </div>
                                    <div className="pt-0.5">
                                        <p className="font-bold text-gray-900 text-[15px]">{selectedPatient.nombres} {selectedPatient.apellidos}</p>
                                        <p className="text-xs text-gray-500 font-mono font-medium mt-0.5">{selectedPatient.documento}</p>
                                        {selectedPatient.telefono && (
                                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-1 font-medium"><Phone size={12} />{selectedPatient.telefono}</p>
                                        )}
                                        {patientPolicies.length > 0 && (
                                            <div className="mt-2.5 flex flex-wrap gap-1.5">
                                                {patientPolicies.map((pol: any) => (
                                                    <span key={pol.polizaId} className="inline-flex items-center gap-1 text-[11px] bg-blue-100/70 text-blue-800 border border-blue-200/60 rounded-full px-2.5 py-1 font-bold shadow-sm">
                                                        <Shield size={12} /> {pol.aseguradora} — {pol.numeroPoliza}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <button onClick={() => { setSelectedPatient(null); setPatientPolicies([]); setTipoPago("PENDIENTE"); setMode("search"); }}
                                    className="text-xs font-bold text-gray-400 hover:text-red-500 transition-colors shrink-0 underline decoration-gray-300 hover:decoration-red-300 underline-offset-2">
                                    Cambiar
                                </button>
                            </div>
                        )}

                        {mode === "new-patient" && (
                            <div className="space-y-4 p-5 border-2 border-dashed border-red-300/50 rounded-2xl bg-red-50/40 backdrop-blur-sm">
                                <p className="text-xs font-bold text-red-600/80 uppercase tracking-wider flex items-center gap-1.5"><Heart size={14}/> Perfil de emergencia</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <input placeholder="Nombres *" value={newPatient.nombres} onChange={e => setNewPatient({ ...newPatient, nombres: e.target.value })}
                                        className="px-4 py-3 rounded-xl bg-white/60 border border-white/80 text-sm focus:bg-white focus:ring-2 focus:ring-red-300 outline-none shadow-sm transition-all font-medium placeholder:text-gray-400" />
                                    <input placeholder="Apellidos *" value={newPatient.apellidos} onChange={e => setNewPatient({ ...newPatient, apellidos: e.target.value })}
                                        className="px-4 py-3 rounded-xl bg-white/60 border border-white/80 text-sm focus:bg-white focus:ring-2 focus:ring-red-300 outline-none shadow-sm transition-all font-medium placeholder:text-gray-400" />
                                    <input placeholder="Cédula / Documento *" value={newPatient.documento} onChange={e => setNewPatient({ ...newPatient, documento: e.target.value })}
                                        className="px-4 py-3 rounded-xl bg-white/60 border border-white/80 text-sm focus:bg-white focus:ring-2 focus:ring-red-300 outline-none shadow-sm transition-all font-medium placeholder:text-gray-400" />
                                    <input placeholder="Teléfono" value={newPatient.telefono} onChange={e => setNewPatient({ ...newPatient, telefono: e.target.value })}
                                        className="px-4 py-3 rounded-xl bg-white/60 border border-white/80 text-sm focus:bg-white focus:ring-2 focus:ring-red-300 outline-none shadow-sm transition-all font-medium placeholder:text-gray-400" />
                                </div>
                                <button onClick={() => { setMode("search"); setNewPatient({ nombres: "", apellidos: "", documento: "", telefono: "" }); }}
                                    className="text-xs font-bold text-gray-500 underline decoration-gray-300 hover:text-gray-800 transition-colors underline-offset-2">← Buscar paciente existente</button>
                            </div>
                        )}
                    </section>

                    {/* ── SECCIÓN 2: Emergencia ── */}
                    <section className="bg-white/40 backdrop-blur-md border border-white/50 rounded-3xl p-5 shadow-[0_4px_16px_0_rgba(0,0,0,0.02)]">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="w-7 h-7 rounded-full bg-gray-900/90 text-white shadow-md text-xs font-black flex items-center justify-center">2</span>
                            <h4 className="font-bold text-gray-800 text-base">Datos de la Emergencia</h4>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className="text-xs font-bold text-gray-500/80 uppercase tracking-wider mb-2.5 block">Motivo de Ingreso *</label>
                                <textarea value={motivo} onChange={e => setMotivo(e.target.value)} rows={3}
                                    placeholder="Describe la situación: síntomas, lesión, circunstancias..."
                                    className="w-full px-5 py-4 rounded-2xl bg-white/50 border border-white/60 focus:bg-white/80 focus:ring-2 focus:ring-red-400/50 outline-none resize-none text-sm shadow-inner transition-all placeholder:text-gray-400 font-medium" />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500/80 uppercase tracking-wider mb-2.5 block">Nivel de Urgencia *</label>
                                <div className="grid grid-cols-4 gap-2.5">
                                    {urgencyOptions.map(opt => (
                                        <button key={opt.key} onClick={() => setUrgencia(opt.key)}
                                            className={`py-3.5 rounded-2xl border flex flex-col items-center gap-1.5 transition-all outline-none font-bold ${
                                                urgencia === opt.key ? opt.sel : opt.bg
                                            }`}>
                                            <span className="text-xl drop-shadow-sm">{opt.emoji}</span>
                                            <span className="text-[13px]">{opt.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500/80 uppercase tracking-wider mb-2.5 block">¿Cómo llegó?</label>
                                <div className="grid grid-cols-3 gap-2.5">
                                    {[
                                        { key: "CUENTA_PROPIA", label: "Cuenta propia", emoji: "🚶" },
                                        { key: "AMBULANCIA_PROPIA", label: "Ambulancia clínica", emoji: "🚑" },
                                        { key: "AMBULANCIA_EXTERNA", label: "Ambulancia externa", emoji: "🚒" },
                                    ].map(o => (
                                        <button key={o.key} onClick={() => setLlegada(o.key)}
                                            className={`py-3.5 px-3 rounded-2xl border text-[13px] font-bold transition-all flex flex-col items-center gap-1.5 outline-none ${
                                                llegada === o.key
                                                    ? "border-lime-500/80 bg-lime-50 text-lime-700 shadow-[0_4px_12px_rgba(132,204,22,0.2)] ring-2 ring-lime-400/20 scale-[1.02]"
                                                    : "border-white/60 bg-white/40 text-gray-500 opacity-80 hover:opacity-100 hover:bg-white/60 shadow-sm"
                                            }`}>
                                            <span className="text-xl drop-shadow-sm">{o.emoji}</span>
                                            {o.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ── SECCIÓN 3: Pago ── */}
                    <section className="bg-white/40 backdrop-blur-md border border-white/50 rounded-3xl p-5 shadow-[0_4px_16px_0_rgba(0,0,0,0.02)]">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="w-7 h-7 rounded-full bg-gray-900/90 text-white shadow-md text-xs font-black flex items-center justify-center">3</span>
                            <h4 className="font-bold text-gray-800 text-base">Situación de Pago</h4>
                            {patientPolicies.length > 0 && (
                                <span className="text-[10px] uppercase tracking-wider font-bold bg-blue-100/70 text-blue-800 border border-blue-200/50 px-2.5 py-1 rounded-full shadow-sm">Auto-completado</span>
                            )}
                        </div>

                        <div className="w-full">
                            <label className="text-xs font-bold text-gray-500/80 uppercase tracking-wider mb-2.5 block">Selecciona quién asume el costo inicial</label>
                            <div className="grid grid-cols-3 gap-2.5">
                                {[
                                    { key: "ASEGURADO", label: "Asegurado", emoji: "🛡️" },
                                    { key: "PARTICULAR", label: "Particular", emoji: "💵" },
                                    { key: "PENDIENTE", label: "Pendiente", emoji: "⏳" },
                                ].map(o => (
                                    <button key={o.key} onClick={() => setTipoPago(o.key)}
                                        className={`py-3.5 px-3 rounded-2xl border text-sm font-bold transition-all flex flex-col items-center gap-1.5 outline-none ${
                                            tipoPago === o.key 
                                                ? "border-lime-500/80 bg-lime-50 text-lime-700 shadow-[0_4px_12px_rgba(132,204,22,0.2)] ring-2 ring-lime-400/20 scale-[1.02]" 
                                                : "border-white/60 bg-white/40 text-gray-500 opacity-80 hover:opacity-100 hover:bg-white/60 shadow-sm"
                                        }`}>
                                        <span className="text-xl drop-shadow-sm">{o.emoji}</span>
                                        {o.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* ── SECCIÓN 4: Observaciones ── */}
                    <section className="bg-white/40 backdrop-blur-md border border-white/50 rounded-3xl p-5 shadow-[0_4px_16px_0_rgba(0,0,0,0.02)]">
                        <div className="flex items-center gap-3 mb-3.5">
                            <span className="w-7 h-7 rounded-full bg-gray-900/90 text-white shadow-md text-xs font-black flex items-center justify-center">4</span>
                            <h4 className="font-bold text-gray-800 text-base">Notas Internas</h4>
                            <span className="text-xs font-semibold text-gray-400/80">Opcional</span>
                        </div>
                        <input type="text" value={observaciones} onChange={e => setObservaciones(e.target.value)}
                            placeholder="Ej: vino con familiar, notas relevantes..."
                            className="w-full px-5 py-4 rounded-2xl bg-white/50 border border-white/60 focus:bg-white/80 focus:ring-2 focus:ring-red-400/50 outline-none text-sm shadow-inner transition-all placeholder:text-gray-400 font-medium" />
                    </section>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/40 flex gap-3 shrink-0 bg-white/30 backdrop-blur-md">
                    <button onClick={onClose} className="flex-1 py-3.5 rounded-2xl bg-white/50 border border-white/60 text-gray-700 font-bold hover:bg-white/80 transition-colors text-sm shadow-sm backdrop-blur-sm outline-none focus:ring-2 focus:ring-gray-300">
                        Cancelar
                    </button>
                    <button onClick={createAndSubmit} disabled={saving}
                        className="flex-1 py-3.5 rounded-2xl bg-red-500/95 hover:bg-red-500 text-white font-bold disabled:opacity-50 transition-colors text-sm flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(239,68,68,0.3)] backdrop-blur-md border border-red-400/50 outline-none focus:ring-2 focus:ring-red-300">
                        {saving ? <Loader2 size={18} className="animate-spin" /> : <Siren size={18} />}
                        {saving ? "Ingresando..." : "Ingresar Paciente"}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ─── Main Page ─────────────────────────────────────── */
export default function EmergenciasPage() {
    const [emergencias, setEmergencias] = useState<Emergencia[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<"active" | "all" | "closed">("active");
    const [showModal, setShowModal] = useState(false);

    const fetchEmergencies = async () => {
        setLoading(true);
        try {
            const q = filter === "active" ? "?active=true" : filter === "closed" ? "?status=ALTA" : "";
            const res = await fetch(`/api/emergency${q}`);
            if (res.ok) setEmergencias(await res.json());
        } catch { } finally { setLoading(false); }
    };

    useEffect(() => { fetchEmergencies(); }, [filter]);

    const active   = emergencias.filter(e => !["ALTA", "REFERIDO"].includes(e.estadoEmergencia));
    const critical = active.filter(e => e.nivelUrgencia === "CRITICO").length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between bg-white/40 backdrop-blur-md border border-white/50 rounded-3xl px-6 py-5 shadow-[0_4px_16px_0_rgba(0,0,0,0.03)]">
                <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-inner border ${
                        active.length > 0
                            ? "bg-red-500/10 border-red-400/20"
                            : "bg-white/60 border-white/60"
                    }`}>
                        <Siren size={20} className={active.length > 0 ? "text-red-600" : "text-gray-400"} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-gray-900 tracking-tight">Emergencias</h2>
                        <p className="text-sm text-gray-400/80 font-medium">
                            {active.length > 0
                                ? `${active.length} caso${active.length !== 1 ? "s" : ""} activo${active.length !== 1 ? "s" : ""}${critical > 0 ? ` · ${critical} crítico${critical !== 1 ? "s" : ""}` : ""}`
                                : "Sin emergencias activas"}
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 bg-red-500/95 hover:bg-red-500 text-white px-5 py-2.5 rounded-2xl text-sm font-bold transition-all shadow-[0_8px_20px_rgba(239,68,68,0.25)] border border-red-400/50"
                >
                    <Plus size={16} /> Nuevo Ingreso
                </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-1 bg-white/40 backdrop-blur-md border border-white/50 p-1 rounded-2xl w-fit shadow-sm">
                {([{ k: "active", l: "Activos" }, { k: "all", l: "Todos" }, { k: "closed", l: "Altas" }] as const).map(t => (
                    <button key={t.k} onClick={() => setFilter(t.k)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                            filter === t.k
                                ? "bg-white/80 text-gray-900 shadow-sm border border-white/70"
                                : "text-gray-500 hover:text-gray-700 hover:bg-white/40"
                        }`}>
                        {t.l}
                    </button>
                ))}
            </div>

            {/* Cards Grid */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="animate-spin text-red-400" size={30} />
                </div>
            ) : emergencias.length === 0 ? (
                <div className="bg-white/40 backdrop-blur-md border-2 border-dashed border-white/60 rounded-3xl p-16 text-center">
                    <Siren size={40} className="mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-400 font-bold">
                        {filter === "active" ? "No hay emergencias activas" : filter === "closed" ? "No hay altas registradas" : "Sin registros"}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {emergencias.map(e => <EmergencyCard key={e.emergenciaId} e={e} />)}
                </div>
            )}

            {showModal && (
                <NewAdmissionModal
                    onClose={() => setShowModal(false)}
                    onSuccess={() => { setShowModal(false); fetchEmergencies(); }}
                />
            )}
        </div>
    );
}
