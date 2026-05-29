"use client";

import { useEffect, useState } from "react";
import {
    Siren, Plus, Loader2, Clock, Shield, Phone, Ambulance,
    UserCheck, Activity, Heart, ChevronRight, AlertTriangle,
    FileText, User, ArrowUpRight, XCircle, CheckCircle
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import EmergenciaDetalleModal from "./components/EmergenciaDetalleModal";

/* ─── Types ─────────────────────────────────────────── */
interface Emergencia {
    emergenciaId: string;
    paciente: string;
    documento: string;
    telefono: string;
    motivoIngreso: string;
    nivelUrgencia: "CRITICO" | "URGENTE" | "MODERADO" | "LEVE";
    estadoEmergencia: "EN_ATENCION" | "HOSPITALIZADO" | "CIRUGIA_URGENTE" | "REFERIDO" | "ALTA" | "ATENDIDO";
    verificacionPago: "PENDIENTE" | "CONFIRMADO" | "SIN_COBERTURA";
    tipoPago: "PARTICULAR" | "ASEGURADO" | "PENDIENTE";
    fechaIngreso: string;
    fechaAlta: string | null;
    tieneSeguro: boolean;
    aseguradora: string | null;
    medico: { medicoId: string; nombre: string; especialidad: string } | null;
    cartasAval: any[];
}

/* ─── Config maps ────────────────────────────────────── */
const URGENCY: Record<string, { bar: string; pill: string; label: string }> = {
    CRITICO:  { bar: "bg-red-500",    pill: "bg-red-500 text-white",    label: "🔴 Crítico" },
    URGENTE:  { bar: "bg-orange-400", pill: "bg-orange-400 text-white", label: "🟠 Urgente" },
    MODERADO: { bar: "bg-yellow-400", pill: "bg-yellow-400 text-white", label: "🟡 Moderado" },
    LEVE:     { bar: "bg-green-400",  pill: "bg-green-400 text-white",  label: "🟢 Leve" },
};

const STATUS: Record<string, { label: string; color: string; Icon: any }> = {
    EN_ATENCION:    { label: "En Atención",    color: "bg-blue-100 text-blue-700",    Icon: Heart },
    HOSPITALIZADO:  { label: "Hospitalizado",  color: "bg-amber-100 text-amber-700",  Icon: Clock },
    CIRUGIA_URGENTE:{ label: "Cirugía Urgente",color: "bg-red-100 text-red-700",      Icon: Siren },
    REFERIDO:       { label: "Referido",       color: "bg-gray-100 text-gray-600",    Icon: Ambulance },
    ALTA:           { label: "Alta Médica",    color: "bg-green-100 text-green-700",  Icon: UserCheck },
    ATENDIDO:       { label: "Atendido",       color: "bg-emerald-100 text-emerald-700", Icon: CheckCircle },
};

const PAY_LABEL: Record<string, { label: string; color: string }> = {
    PENDIENTE:      { label: "Pago pendiente",     color: "text-amber-600" },
    CONFIRMADO:     { label: "Pago confirmado",    color: "text-green-600" },
    SIN_COBERTURA:  { label: "Sin cobertura",      color: "text-red-600"   },
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
function EmergencyCard({ e, onViewDetails }: { e: Emergencia; onViewDetails: (id: string) => void }) {
    const urg = URGENCY[e.nivelUrgencia] ?? URGENCY.MODERADO;
    const st  = STATUS[e.estadoEmergencia] ?? STATUS.EN_ATENCION;
    const pay = PAY_LABEL[e.verificacionPago] ?? PAY_LABEL.PENDIENTE;
    const StIcon = st.Icon;

    // Derived Carta Aval State
    const hasInsurance = e.tieneSeguro;
    const cartaAval = e.cartasAval?.[0]; // Current latest record
    
    let avalUI = null;
    if (hasInsurance) {
        if (!cartaAval) {
            avalUI = <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100/80 text-red-700 border border-red-200 px-2.5 py-1 text-[10px] uppercase tracking-wide font-black"><AlertTriangle size={12}/> Sin Aval</span>;
        } else if (cartaAval.estado === "SOLICITADA") {
            avalUI = <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100/80 text-amber-700 border border-amber-200 px-2.5 py-1 text-[10px] uppercase tracking-wide font-black"><Clock size={12}/> Solicitada</span>;
        } else if (cartaAval.estado === "APROBADA") {
            avalUI = <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100/80 text-green-700 border border-green-200 px-2.5 py-1 text-[10px] uppercase tracking-wide font-black"><CheckCircle size={12}/> Aprobada</span>;
        } else {
            avalUI = <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100/80 text-rose-700 border border-rose-200 px-2.5 py-1 text-[10px] uppercase tracking-wide font-black"><XCircle size={12}/> Rechazada</span>;
        }
    }

    return (
        <div className="bg-white/60 backdrop-blur-xl border border-white/80 rounded-[2rem] shadow-[0_8px_32px_0_rgba(0,0,0,0.04)] hover:shadow-[0_16px_48px_0_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col relative group">
            {/* Urgency Top Glow */}
            <div className={`absolute top-0 left-0 right-0 h-1.5 ${urg.bar} shadow-[0_2px_12px_rgba(0,0,0,0.2)]`} />

            <div className="p-6 flex flex-col h-full gap-5">
                
                {/* Header: Identity & Urgency */}
                <div className="flex justify-between items-start gap-4">
                    <div className="min-w-0">
                        <h3 className="font-extrabold text-gray-900 text-[17px] leading-tight truncate tracking-tight">{e.paciente}</h3>
                        <p className="text-xs text-gray-500 font-mono mt-0.5">{e.documento}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className={`rounded-xl px-2.5 py-1 text-[10px] font-black shadow-sm tracking-widest uppercase ${urg.pill}`}>
                            {urg.label}
                        </span>
                        <span className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 bg-white/70 px-2.5 py-1 rounded-lg border border-white/80 shadow-sm backdrop-blur-sm">
                            <Clock size={12} className="text-gray-400" /> {timeSince(e.fechaIngreso)}
                        </span>
                    </div>
                </div>

                {/* Body: Medical Context */}
                <div className="bg-gradient-to-br from-gray-50/80 to-gray-100/50 rounded-2xl p-3.5 border border-gray-100/60 shadow-inner flex flex-col gap-3">
                    <div className="flex items-start gap-2.5">
                        <Activity size={16} className="text-gray-400 mt-[2px] shrink-0" />
                        <p className="text-[13px] text-gray-700 font-medium leading-snug line-clamp-2" title={e.motivoIngreso}>
                            {e.motivoIngreso}
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-2.5 pt-2 border-t border-gray-200/50">
                        <User size={14} className={e.medico ? "text-blue-500" : "text-gray-400"} />
                        <p className={`text-[12px] font-bold truncate ${e.medico ? 'text-blue-700' : 'text-gray-400'}`}>
                            {e.medico ? e.medico.nombre : "Sin médico asignado"}
                        </p>
                    </div>
                </div>

                {/* Body: Financial & Status */}
                <div className="flex flex-col gap-2.5 mt-auto pt-1">
                    {/* Status Badge */}
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Flujo Clínico</span>
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold shadow-sm ${st.color}`}>
                            <StIcon size={12} /> {st.label}
                        </span>
                    </div>

                    {/* Financial Badge */}
                    <div className="flex flex-wrap items-center justify-between gap-y-2 mt-1 bg-white/70 rounded-[14px] p-3 border border-gray-200/40 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                        <div className="flex items-center gap-1.5">
                            {hasInsurance ? (
                                <span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-blue-900 tracking-tight">
                                    <Shield size={14} className="text-blue-500" /> {e.aseguradora}
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-emerald-800 tracking-tight">
                                    <UserCheck size={14} className="text-emerald-500" /> Particular
                                </span>
                            )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                            {avalUI}
                            {!hasInsurance && <span className={`text-[11px] font-black uppercase tracking-wider ${pay.color}`}>{pay.label}</span>}
                        </div>
                    </div>
                </div>

                {/* Footer Action */}
                <button
                    onClick={() => onViewDetails(e.emergenciaId)}
                    className="w-full mt-2 flex items-center justify-center gap-2 text-[13px] font-black text-gray-700 bg-white hover:bg-gray-900 hover:text-white border border-gray-200 hover:border-transparent py-3 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 group-hover:scale-[1.01]"
                >
                    Ver Caso Completo <ArrowUpRight size={16} strokeWidth={2.5} className="opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300" />
                </button>
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
        <div className="fixed inset-0 bg-slate-900/30 z-50 flex items-center justify-center p-4 backdrop-blur-md transition-all">
            <div className="bg-white/70 backdrop-blur-2xl backdrop-saturate-[1.2] w-full max-w-5xl rounded-[2.5rem] shadow-[0_8px_32px_0_rgba(0,0,0,0.12)] border border-white/60 flex flex-col overflow-hidden" style={{ maxHeight: "92vh" }}>

                {/* Header */}
                <div className="px-8 py-5 border-b border-white/40 flex justify-between items-center shrink-0 bg-white/30">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 shadow-inner flex items-center justify-center">
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

                {/* Error */}
                {error && (
                    <div className="px-8 pt-4 shrink-0">
                        <div className="p-3.5 bg-red-50/80 border border-red-200/50 text-red-700 rounded-2xl text-sm flex items-center gap-2">
                            <AlertTriangle size={16} className="shrink-0" /> {error}
                        </div>
                    </div>
                )}

                {/* Body — izquierda: pasos 1, 3, 4 / derecha: paso 2 */}
                <div className="flex-1 min-h-0 grid grid-cols-[5fr_7fr] divide-x divide-white/40">

                    {/* ── Left: Pasos 1 + 3 + 4 ── */}
                    <div className="p-5 flex flex-col gap-4 overflow-hidden">

                        {/* Sección 1: Identificar Paciente */}
                        <section className="bg-white/40 backdrop-blur-md border border-white/50 rounded-2xl p-4 shadow-[0_4px_16px_0_rgba(0,0,0,0.02)]">
                            <div className="flex items-center gap-2.5 mb-3">
                                <span className="w-6 h-6 rounded-full bg-gray-900/90 text-white shadow-md text-[11px] font-black flex items-center justify-center">1</span>
                                <h4 className="font-bold text-gray-800 text-sm">Identificar Paciente</h4>
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
                                                    className="w-full text-left px-5 py-3 hover:bg-white/70 transition-colors flex items-center justify-between border-b border-white/40 last:border-0">
                                                    <div>
                                                        <p className="font-bold text-gray-800 text-sm">{p.nombres} {p.apellidos}</p>
                                                        <p className="text-xs text-gray-500 font-mono mt-0.5">{p.documento} {p.telefono ? `· ${p.telefono}` : ""}</p>
                                                    </div>
                                                    <ChevronRight size={16} className="text-gray-400" />
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    <button onClick={() => setMode("new-patient")}
                                        className="w-full py-3 border-2 border-dashed border-gray-300/60 rounded-2xl text-sm font-semibold text-gray-500 hover:border-red-400/60 hover:text-red-600 transition-colors flex items-center justify-center gap-2 bg-white/20 hover:bg-white/40">
                                        <Plus size={16} /> Paciente no registrado — crear perfil
                                    </button>
                                </div>
                            )}

                            {mode === "selected" && selectedPatient && (
                                <div className="rounded-2xl border border-green-400/30 bg-green-50/50 shadow-sm p-4 flex items-start justify-between gap-3">
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-full bg-green-200/50 border border-green-300/50 shadow-inner flex items-center justify-center shrink-0">
                                            <User size={18} className="text-green-700" />
                                        </div>
                                        <div className="pt-0.5">
                                            <p className="font-bold text-gray-900 text-sm">{selectedPatient.nombres} {selectedPatient.apellidos}</p>
                                            <p className="text-xs text-gray-500 font-mono mt-0.5">{selectedPatient.documento}</p>
                                            {selectedPatient.telefono && (
                                                <p className="text-xs text-gray-500 flex items-center gap-1 mt-1"><Phone size={11} />{selectedPatient.telefono}</p>
                                            )}
                                            {patientPolicies.length > 0 && (
                                                <div className="mt-2 flex flex-wrap gap-1.5">
                                                    {patientPolicies.map((pol: any) => (
                                                        <span key={pol.polizaId} className="inline-flex items-center gap-1 text-[11px] bg-blue-100/70 text-blue-800 border border-blue-200/60 rounded-full px-2.5 py-1 font-bold shadow-sm">
                                                            <Shield size={11} /> {pol.aseguradora} — {pol.numeroPoliza}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <button onClick={() => { setSelectedPatient(null); setPatientPolicies([]); setTipoPago("PENDIENTE"); setMode("search"); }}
                                        className="text-xs font-bold text-gray-400 hover:text-red-500 transition-colors shrink-0 underline decoration-gray-300 underline-offset-2">
                                        Cambiar
                                    </button>
                                </div>
                            )}

                            {mode === "new-patient" && (
                                <div className="space-y-3 p-4 border-2 border-dashed border-red-300/50 rounded-2xl bg-red-50/40">
                                    <p className="text-xs font-bold text-red-600/80 uppercase tracking-wider flex items-center gap-1.5"><Heart size={13}/> Perfil de emergencia</p>
                                    <div className="grid grid-cols-2 gap-2.5">
                                        <input placeholder="Nombres *" value={newPatient.nombres} onChange={e => setNewPatient({ ...newPatient, nombres: e.target.value })}
                                            className="px-4 py-2.5 rounded-xl bg-white/60 border border-white/80 text-sm focus:bg-white focus:ring-2 focus:ring-red-300 outline-none shadow-sm transition-all font-medium placeholder:text-gray-400" />
                                        <input placeholder="Apellidos *" value={newPatient.apellidos} onChange={e => setNewPatient({ ...newPatient, apellidos: e.target.value })}
                                            className="px-4 py-2.5 rounded-xl bg-white/60 border border-white/80 text-sm focus:bg-white focus:ring-2 focus:ring-red-300 outline-none shadow-sm transition-all font-medium placeholder:text-gray-400" />
                                        <input placeholder="Cédula / Documento *" value={newPatient.documento} onChange={e => setNewPatient({ ...newPatient, documento: e.target.value })}
                                            className="px-4 py-2.5 rounded-xl bg-white/60 border border-white/80 text-sm focus:bg-white focus:ring-2 focus:ring-red-300 outline-none shadow-sm transition-all font-medium placeholder:text-gray-400" />
                                        <input placeholder="Teléfono" value={newPatient.telefono} onChange={e => setNewPatient({ ...newPatient, telefono: e.target.value })}
                                            className="px-4 py-2.5 rounded-xl bg-white/60 border border-white/80 text-sm focus:bg-white focus:ring-2 focus:ring-red-300 outline-none shadow-sm transition-all font-medium placeholder:text-gray-400" />
                                    </div>
                                    <button onClick={() => { setMode("search"); setNewPatient({ nombres: "", apellidos: "", documento: "", telefono: "" }); }}
                                        className="text-xs font-bold text-gray-500 underline decoration-gray-300 hover:text-gray-800 transition-colors underline-offset-2">← Buscar paciente existente</button>
                                </div>
                            )}
                        </section>

                        {/* Sección 3: Situación de Pago */}
                        <section className="bg-white/40 backdrop-blur-md border border-white/50 rounded-2xl p-4 shadow-[0_4px_16px_0_rgba(0,0,0,0.02)]">
                            <div className="flex items-center gap-2.5 mb-3">
                                <span className="w-6 h-6 rounded-full bg-gray-900/90 text-white shadow-md text-[11px] font-black flex items-center justify-center">3</span>
                                <h4 className="font-bold text-gray-800 text-sm">Situación de Pago</h4>
                                {patientPolicies.length > 0 && (
                                    <span className="text-[10px] font-bold bg-blue-100/70 text-blue-800 border border-blue-200/50 px-2 py-0.5 rounded-full">Auto</span>
                                )}
                            </div>
                            <div className="flex gap-2 flex-wrap">
                                {[
                                    { key: "ASEGURADO", label: "Asegurado", emoji: "🛡️" },
                                    { key: "PARTICULAR", label: "Particular", emoji: "💵" },
                                    { key: "PENDIENTE",  label: "Pendiente",  emoji: "⏳" },
                                ].map(o => (
                                    <button key={o.key} type="button" onClick={() => setTipoPago(o.key)}
                                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold border transition-all shadow-sm ${
                                            tipoPago === o.key
                                                ? "bg-lime-500 text-white border-lime-500"
                                                : "border-white/60 bg-white/50 text-gray-500 hover:bg-white/80"
                                        }`}>
                                        {o.emoji} {o.label}
                                    </button>
                                ))}
                            </div>
                        </section>

                        {/* Sección 4: Notas Internas */}
                        <section className="bg-white/40 backdrop-blur-md border border-white/50 rounded-2xl p-4 shadow-[0_4px_16px_0_rgba(0,0,0,0.02)]">
                            <div className="flex items-center gap-2.5 mb-3">
                                <span className="w-6 h-6 rounded-full bg-gray-900/90 text-white shadow-md text-[11px] font-black flex items-center justify-center">4</span>
                                <h4 className="font-bold text-gray-800 text-sm">Notas Internas</h4>
                                <span className="text-xs text-gray-400/80">Opcional</span>
                            </div>
                            <input type="text" value={observaciones} onChange={e => setObservaciones(e.target.value)}
                                placeholder="Ej: vino con familiar, notas relevantes..."
                                className="w-full px-4 py-3 rounded-xl bg-white/50 border border-white/60 focus:bg-white/80 focus:ring-2 focus:ring-red-400/50 outline-none text-sm shadow-inner transition-all placeholder:text-gray-400 font-medium" />
                        </section>
                    </div>

                    {/* ── Right: Solo Paso 2 (Datos de la Emergencia) ── */}
                    <div className="p-6 flex flex-col overflow-hidden">

                        {/* Sección 2: Datos de la Emergencia */}
                        <section className="bg-white/40 backdrop-blur-md border border-white/50 rounded-3xl p-5 shadow-[0_4px_16px_0_rgba(0,0,0,0.02)] flex flex-col gap-4 h-full">
                            <div className="flex items-center gap-3">
                                <span className="w-7 h-7 rounded-full bg-gray-900/90 text-white shadow-md text-xs font-black flex items-center justify-center">2</span>
                                <h4 className="font-bold text-gray-800 text-base">Datos de la Emergencia</h4>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500/80 uppercase tracking-wider mb-2 block">Motivo de Ingreso *</label>
                                <textarea value={motivo} onChange={e => setMotivo(e.target.value)} rows={3}
                                    placeholder="Describe la situación: síntomas, lesión, circunstancias..."
                                    className="w-full px-5 py-4 rounded-2xl bg-white/50 border border-white/60 focus:bg-white/80 focus:ring-2 focus:ring-red-400/50 outline-none resize-none text-sm shadow-inner transition-all placeholder:text-gray-400 font-medium" />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500/80 uppercase tracking-wider mb-2 block">Nivel de Urgencia *</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {urgencyOptions.map(opt => (
                                        <button key={opt.key} type="button" onClick={() => setUrgencia(opt.key)}
                                            className={`py-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all outline-none font-bold ${
                                                urgencia === opt.key ? opt.sel : opt.bg
                                            }`}>
                                            <span className="text-xl drop-shadow-sm">{opt.emoji}</span>
                                            <span className="text-[11px]">{opt.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500/80 uppercase tracking-wider mb-2 block">¿Cómo llegó?</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { key: "CUENTA_PROPIA",     label: "Cuenta propia",     emoji: "🚶" },
                                        { key: "AMBULANCIA_PROPIA", label: "Ambulancia clínica", emoji: "🚑" },
                                        { key: "AMBULANCIA_EXTERNA",label: "Ambulancia externa", emoji: "🚒" },
                                    ].map(o => (
                                        <button key={o.key} type="button" onClick={() => setLlegada(o.key)}
                                            className={`py-2.5 px-2 rounded-xl border text-[11px] font-bold transition-all flex flex-col items-center gap-1 outline-none ${
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
                        </section>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-8 py-5 border-t border-white/40 flex gap-3 shrink-0 bg-white/30 backdrop-blur-md">
                    <button onClick={onClose} className="flex-1 py-3 rounded-2xl bg-white/50 border border-white/60 text-gray-700 font-bold hover:bg-white/80 transition-colors text-sm shadow-sm outline-none focus:ring-2 focus:ring-gray-300">
                        Cancelar
                    </button>
                    <button onClick={createAndSubmit} disabled={saving}
                        className="flex-1 py-3 rounded-2xl bg-red-500/95 hover:bg-red-500 text-white font-bold disabled:opacity-50 transition-colors text-sm flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(239,68,68,0.3)] border border-red-400/50 outline-none focus:ring-2 focus:ring-red-300">
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
    const [selectedDetailId, setSelectedDetailId] = useState<string | null>(null);

    const fetchEmergencies = async () => {
        setLoading(true);
        try {
            const q = filter === "active" ? "?active=true" : filter === "closed" ? "?status=ALTA&status2=ATENDIDO" : "";
            const res = await fetch(`/api/emergency${q}`);
            if (res.ok) setEmergencias(await res.json());
        } catch { } finally { setLoading(false); }
    };

    useEffect(() => { fetchEmergencies(); }, [filter]);

    const active   = emergencias.filter(e => !["ALTA", "ATENDIDO"].includes(e.estadoEmergencia));
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
                    {emergencias.map(e => <EmergencyCard key={e.emergenciaId} e={e} onViewDetails={setSelectedDetailId} />)}
                </div>
            )}

            {showModal && (
                <NewAdmissionModal
                    onClose={() => setShowModal(false)}
                    onSuccess={() => { setShowModal(false); fetchEmergencies(); }}
                />
            )}

            {selectedDetailId && (
                <EmergenciaDetalleModal
                    emergenciaId={selectedDetailId}
                    initialData={emergencias.find(e => e.emergenciaId === selectedDetailId)}
                    onClose={() => setSelectedDetailId(null)}
                    onStatusChange={() => fetchEmergencies()}
                />
            )}
        </div>
    );
}
