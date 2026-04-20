"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
    Loader2, Siren, Heart, Clock, UserCheck, Ban, Shield,
    FileText, Phone, AlertTriangle, Plus, CheckCircle, XCircle, Save, X,
    Hash, Tag, Building2, Stethoscope
} from "lucide-react";

/* ─── Status helpers ───────────────────────────────────── */
const statusSteps = [
    { key: "EN_ATENCION",     label: "En Atención",    Icon: Heart      },
    { key: "HOSPITALIZADO",   label: "Hospitalizado",  Icon: Clock      },
    { key: "CIRUGIA_URGENTE", label: "Cirugía Urgente",Icon: Siren      },
    { key: "ALTA",            label: "Alta Médica",    Icon: UserCheck  },
    { key: "ATENDIDO",        label: "Atendido",       Icon: CheckCircle},
];

const urgencyBadge: Record<string, string> = {
    CRITICO:  "bg-red-500 text-white",
    URGENTE:  "bg-orange-400 text-white",
    MODERADO: "bg-yellow-400 text-white",
    LEVE:     "bg-green-500 text-white",
};

const payBadge: Record<string, string> = {
    PENDIENTE:    "bg-amber-100/70 text-amber-700 border-amber-300/40",
    CONFIRMADO:   "bg-lime-100/70 text-lime-700 border-lime-300/40",
    SIN_COBERTURA:"bg-red-100/60 text-red-700 border-red-300/40",
};

const cartaEstadoBadge: Record<string, string> = {
    SOLICITADA: "bg-amber-50/80 border-amber-200/60 text-amber-700",
    APROBADA:   "bg-lime-50/80 border-lime-200/60 text-lime-700",
    RECHAZADA:  "bg-red-50/80 border-red-200/60 text-red-700",
};
const cartaEstadoIcon: Record<string, any> = {
    SOLICITADA: Clock,
    APROBADA:   CheckCircle,
    RECHAZADA:  XCircle,
};

/* ─── Component ─────────────────────────────────────────── */
interface EmergenciaDetalleModalProps {
    emergenciaId: string;
    initialData?: any;
    onClose: () => void;
    onStatusChange?: () => void;
}

export default function EmergenciaDetalleModal({ emergenciaId, initialData, onClose, onStatusChange }: EmergenciaDetalleModalProps) {
    const [emergencia, setEmergencia] = useState<any>(null);
    const [isLoading, setIsLoading]   = useState(true);
    // Local form state for changes
    const [formData, setFormData] = useState<{
        medicoId: string;
        estadoEmergencia: string;
        verificacionPago: string;
        tipoPago: string;
        cartaAval: any;
    }>({
        medicoId: "",
        estadoEmergencia: "",
        verificacionPago: "",
        tipoPago: "",
        cartaAval: null
    });

    const [isUpdating, setIsUpdating] = useState(false);

    // Carta Aval
    const [showCartaModal, setShowCartaModal] = useState(false);
    const [cartaForm, setCartaForm] = useState<any>({
        cartaAvalId: "", polizaId: "", codigoAval: "", estado: "SOLICITADA", observaciones: ""
    });
    const [isSavingCarta, setIsSavingCarta] = useState(false);

    // Doctor assignment
    const [allDoctors, setAllDoctors] = useState<any[]>([]);

    const fetchData = async () => {
        try {
            const res = await fetch(`/api/emergency/${emergenciaId}`);
            if (res.ok) {
                const data = await res.json();
                setEmergencia(data);
                
                
                // Directly set the form data since this is the canonical state now
                setFormData({
                    medicoId: data.medico?.empleadoId?.toString() || data.medicoId?.toString() || "",
                    estadoEmergencia: data.estadoEmergencia,
                    verificacionPago: data.verificacionPago,
                    tipoPago: data.tipoPago,
                    cartaAval: data.cartasAval?.[0] || null
                });
            }
        } catch (e) { console.error(e); }
        finally { setIsLoading(false); }
    };

    useEffect(() => { fetchData(); }, [emergenciaId]);

    // Load all active doctors for assignment dropdown
    useEffect(() => {
        fetch("/api/emergency/doctors")
            .then(r => r.ok ? r.json() : [])
            .then(data => setAllDoctors(Array.isArray(data) ? data : []))
            .catch(() => {});
    }, []);

    const updateField = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const saveChanges = async () => {
        setIsUpdating(true);
        try {
            await fetch(`/api/emergency/${emergenciaId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    medicoId: formData.medicoId || null,
                    estadoEmergencia: formData.estadoEmergencia || null,
                    verificacionPago: formData.verificacionPago || null,
                    tipoPago: formData.tipoPago || null,
                    cartaAval: formData.cartaAval || null
                })
            });
            if (onStatusChange) onStatusChange();
            onClose();
        } catch (e) { 
            console.error(e); 
        } finally { 
            setIsUpdating(false); 
        }
    };

    const submitCartaAval = async () => {
        if (!cartaForm.polizaId) return;
        setFormData(prev => ({
            ...prev,
            cartaAval: {
                ...cartaForm
            }
        }));
        setShowCartaModal(false);
    };

    const formatMilitaryTime = (dateStr: string) => {
        const d = new Date(dateStr);
        const datePart = d.toLocaleDateString("es-VE");
        const hh = d.getHours().toString().padStart(2, "0");
        const mm = d.getMinutes().toString().padStart(2, "0");
        return `${datePart}, ${hh}:${mm}`;
    };

    return (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white/70 backdrop-blur-2xl backdrop-saturate-[1.2] w-full max-w-6xl rounded-[2.5rem] shadow-[0_8px_32px_0_rgba(0,0,0,0.12)] border border-white/60 h-[95vh] max-h-[900px] flex flex-col overflow-hidden">
                
                {/* Header */}
                <div className="p-6 border-b border-white/40 flex justify-between items-center shrink-0 bg-white/30">
                    <h3 className="font-bold text-gray-900 text-lg tracking-tight flex items-center gap-2">
                        <Siren size={20} className="text-red-600" />
                        Detalle del Caso
                    </h3>
                    <button onClick={onClose} className="p-2.5 rounded-full bg-white/40 hover:bg-white/60 border border-white/50 shadow-sm text-gray-500 hover:text-gray-700 transition-all">
                        <X size={20} className="stroke-[2.5]" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-5">
                    {/* ── Loading / Not found ── */}
                    {isLoading ? (
                        <div className="flex justify-center items-center py-20 h-40">
                            <Loader2 className="animate-spin text-red-500" size={32} />
                        </div>
                    ) : !emergencia ? (
                        <div className="text-center py-20 text-gray-500 font-medium text-sm h-40">Emergencia no encontrada.</div>
                    ) : (() => {
                        const polizas       = emergencia.paciente?.polizas || (emergencia.aseguradora ? [{ polizaId: 'temp', aseguradora: { nombre: emergencia.aseguradora } }] : []);
                        const cartasAval    = formData.cartaAval ? [formData.cartaAval] : [];
                        const currentStatus = formData.estadoEmergencia || emergencia.estadoEmergencia;
                        const isReferido    = currentStatus === "REFERIDO";
                        const pacienteName  = typeof emergencia.paciente === 'string' 
                                              ? emergencia.paciente 
                                              : `${emergencia.paciente?.nombres || ""} ${emergencia.paciente?.apellidos || ""}`;
                        const paDocumento   = typeof emergencia.paciente === 'string'
                                              ? emergencia.documento
                                              : emergencia.paciente?.documentoIdentidad;
                        const paTelefono    = typeof emergencia.paciente === 'string'
                                              ? emergencia.telefono
                                              : emergencia.paciente?.telefono;

                        return (
                            <>
                                {/* ── Header card ─────────────────────────────────── */}
                                <section className="bg-white/50 backdrop-blur-md border border-white/60 rounded-3xl p-6 shadow-sm">
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex items-center gap-4 min-w-0">
                                            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-400/20 flex items-center justify-center shrink-0">
                                                <Siren size={22} className="text-red-500" />
                                            </div>
                                            <div className="min-w-0">
                                                <h1 className="text-xl font-black text-gray-900 tracking-tight truncate">
                                                    {pacienteName}
                                                </h1>
                                                <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-500 font-medium">
                                                    <span className="font-mono">{paDocumento || "Sin documento"}</span>
                                                    {paTelefono && (
                                                        <span className="flex items-center gap-1">
                                                            <Phone size={12} /> {paTelefono}
                                                        </span>
                                                    )}
                                                    <span className="flex items-center gap-1 font-mono text-gray-400">
                                                        #Cita-{emergencia.citaId || emergencia.emergenciaId} 
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock size={12} /> Ingreso: {formatMilitaryTime(emergencia.fechaIngreso)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <span className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-black shadow-sm ${urgencyBadge[emergencia.nivelUrgencia] ?? "bg-gray-200 text-gray-700"}`}>
                                            {emergencia.nivelUrgencia}
                                        </span>
                                    </div>

                                    {/* Motivo */}
                                    <div className="mt-4 bg-white/60 border border-white/70 rounded-2xl px-5 py-4">
                                        <p className="text-xs font-bold text-gray-400/80 uppercase tracking-wider mb-1">Motivo de ingreso</p>
                                        <p className="text-sm font-medium text-gray-700">{emergencia.motivoIngreso}</p>
                                    </div>

                                    {/* Doctor Asignado */}
                                    <div className="mt-4 bg-white/60 border border-white/70 rounded-2xl px-5 py-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-gray-400/80 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                                    <Stethoscope size={11} /> Médico Asignado
                                                </p>
                                                {emergencia.medico && typeof emergencia.medico === 'object' ? (
                                                    <p className="text-sm font-bold text-gray-800">
                                                        {emergencia.medico.nombre || `${emergencia.medico.empleado?.nombres} ${emergencia.medico.empleado?.apellidos}`}
                                                        <span className="ml-2 text-xs font-medium text-gray-500">· {emergencia.medico.especialidad?.nombre || emergencia.medico.especialidad || "—"}</span>
                                                    </p>
                                                ) : (
                                                    <p className="text-sm text-gray-400 italic">Sin médico asignado</p>
                                                )}
                                            </div>
                                            <select
                                                onChange={e => updateField("medicoId", e.target.value)}
                                                value={formData.medicoId}
                                                className="shrink-0 px-3 py-2 rounded-xl bg-white/80 border border-white/80 text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-400/50 transition-all shadow-sm"
                                            >
                                                <option value="">Sin asignar</option>
                                                {allDoctors.map((d: any) => (
                                                    <option key={d.empleadoId || d.id} value={d.empleadoId || d.id}>
                                                        {d.nombre || `${d.nombres} ${d.apellidos}`} {d.especialidad ? `— ${d.especialidad}` : ""}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </section>

                                {/* ── Status Timeline ──────────────────────────────── */}
                                <section className="bg-white/50 backdrop-blur-md border border-white/60 rounded-3xl p-6 shadow-sm">
                                    <h2 className="text-xs font-black text-gray-400/80 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Estado del Caso
                                    </h2>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {statusSteps.map(step => {
                                            const StepIcon  = step.Icon;
                                            const isActive  = currentStatus === step.key;

                                            return (
                                                <button
                                                    key={step.key}
                                                    type="button"
                                                    onClick={() => updateField("estadoEmergencia", step.key)}
                                                    disabled={isReferido && !isActive}
                                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold border transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                                                        isActive
                                                            ? "bg-red-500/90 text-white border-red-400/50 shadow-[0_4px_12px_rgba(239,68,68,0.25)] scale-[1.02]"
                                                            : "bg-white/60 border-white/70 text-gray-500 hover:bg-white/80 hover:text-gray-800"
                                                    }`}
                                                >
                                                    <StepIcon size={14} /> {step.label}
                                                </button>
                                            );
                                        })}

                                        {/* Referido */}
                                        <button
                                            type="button"
                                            onClick={() => updateField("estadoEmergencia", "REFERIDO")}
                                            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold border transition-all ${
                                                isReferido
                                                    ? "bg-gray-700/90 text-white border-gray-500/50 shadow-sm scale-[1.02]"
                                                    : "bg-white/60 border-white/70 text-gray-400 hover:bg-white/80 hover:text-gray-600"
                                            }`}
                                        >
                                            <Ban size={14} /> Referido
                                        </button>
                                    </div>
                                </section>

                                {/* ── Payment + Insurance ──────────────────────────── */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                    {/* Payment */}
                                    <section className="bg-white/50 backdrop-blur-md border border-white/60 rounded-3xl p-6 shadow-sm">
                                        <h3 className="text-xs font-black text-gray-400/80 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Verificación de Pago
                                        </h3>

                                        <div className="space-y-3">
                                            {/* Verificación */}
                                            <div className="flex flex-wrap gap-2">
                                                {(["PENDIENTE", "CONFIRMADO", "SIN_COBERTURA"] as const).map(v => (
                                                    <button
                                                        key={v}
                                                        onClick={() => updateField("verificacionPago", v)}
                                                        className={`px-3.5 py-2 rounded-2xl text-xs font-bold border transition-all ${
                                                            formData.verificacionPago === v
                                                                ? payBadge[v] + " scale-[1.02] shadow-sm"
                                                                : "bg-white/60 border-white/70 text-gray-400 hover:bg-white/80"
                                                        }`}
                                                    >
                                                        {v === "CONFIRMADO" ? "✓ Confirmado" : v === "SIN_COBERTURA" ? "✗ Sin Cobertura" : "⏳ Pendiente"}
                                                    </button>
                                                ))}
                                            </div>

                                            {/* Tipo Pago */}
                                            <div className="flex items-center gap-2 pt-1">
                                                <span className="text-xs font-bold text-gray-400/80 uppercase tracking-wider">Tipo:</span>
                                                {(["PARTICULAR", "ASEGURADO"] as const).map(t => (
                                                    <button
                                                        key={t}
                                                        onClick={() => updateField("tipoPago", t)}
                                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                                                            formData.tipoPago === t
                                                                ? (t === "ASEGURADO"
                                                                    ? "bg-blue-100/70 text-blue-800 border-blue-300/40 shadow-sm scale-[1.02]"
                                                                    : "bg-lime-100/70 text-lime-700 border-lime-300/40 shadow-sm scale-[1.02]")
                                                                : "bg-white/60 border-white/70 text-gray-400 hover:bg-white/80"
                                                        }`}
                                                    >
                                                        {t === "ASEGURADO" ? "🛡️ Asegurado" : "💵 Particular"}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </section>

                                    {/* Insurance */}
                                    <section className="bg-white/50 backdrop-blur-md border border-white/60 rounded-3xl p-6 shadow-sm">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-xs font-black text-gray-400/80 uppercase tracking-[0.2em] flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Seguro Médico
                                            </h3>
                                            {polizas.length > 0 && (
                                                <button
                                                    onClick={() => {
                                                        const currentAval = formData.cartaAval;
                                                        if (currentAval) {
                                                            setCartaForm({
                                                                cartaAvalId: currentAval.cartaAvalId || "",
                                                                polizaId: currentAval.polizaId,
                                                                codigoAval: currentAval.codigoAval || "",
                                                                estado: currentAval.estado || "SOLICITADA",
                                                                observaciones: currentAval.observaciones || ""
                                                            });
                                                        } else {
                                                            setCartaForm({
                                                                cartaAvalId: "",
                                                                polizaId: polizas[0].polizaId,
                                                                codigoAval: "",
                                                                estado: "SOLICITADA",
                                                                observaciones: ""
                                                            });
                                                        }
                                                        setShowCartaModal(true);
                                                    }}
                                                    className={`flex items-center gap-1.5 text-xs font-bold ${formData.cartaAval ? 'bg-amber-500/90 hover:bg-amber-600 border-amber-400/40 text-white' : 'bg-blue-500/90 text-white border-blue-400/40 hover:bg-blue-600'} px-3 py-1.5 rounded-xl transition-all shadow-sm border`}
                                                >
                                                    {formData.cartaAval ? <FileText size={12} /> : <Plus size={12} />} 
                                                    {formData.cartaAval ? "Editar Aval" : "Carta Aval"}
                                                </button>
                                            )}
                                        </div>

                                        {polizas.length === 0 ? (
                                            <div className="bg-white/60 border-2 border-dashed border-white/80 rounded-2xl p-5 text-center">
                                                <AlertTriangle size={22} className="mx-auto mb-1.5 text-amber-400" />
                                                <p className="text-sm font-bold text-gray-400">Sin póliza de seguro activa</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {polizas.map((p: any) => (
                                                    <div key={p.polizaId} className="bg-blue-50/50 border border-blue-200/50 rounded-2xl p-4">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <Building2 size={14} className="text-blue-600" />
                                                            <p className="font-bold text-blue-900 text-sm">{p.aseguradora.nombre}</p>
                                                        </div>
                                                        <p className="text-xs text-blue-700 font-mono">
                                                            <Hash size={10} className="inline mr-0.5" />{p.numeroPoliza}
                                                        </p>
                                                        {p.tipoCobertura && (
                                                            <p className="text-xs text-blue-600/80 mt-0.5">
                                                                <Tag size={10} className="inline mr-1" />{p.tipoCobertura}
                                                            </p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </section>
                                </div>

                                {/* ── Cartas Aval ──────────────────────────────────── */}
                                {cartasAval.length > 0 && (
                                    <section className="bg-white/50 backdrop-blur-md border border-white/60 rounded-3xl p-6 shadow-sm">
                                        <h3 className="text-xs font-black text-gray-400/80 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                            <FileText size={14} className="text-gray-400" /> Cartas Aval / Claves de Atención
                                        </h3>
                                        <div className="space-y-3">
                                            {cartasAval.map((c: any, index: number) => {
                                                const EstIcon = cartaEstadoIcon[c.estado] ?? Clock;
                                                const asegInfo = polizas.find((p:any) => p.polizaId.toString() === c.polizaId?.toString())?.aseguradora?.nombre || c.aseguradora || "Aseguradora";
                                                return (
                                                    <div key={c.cartaAvalId || index} className={`border rounded-2xl p-4 flex items-center justify-between gap-4 ${cartaEstadoBadge[c.estado] ?? cartaEstadoBadge.SOLICITADA}`}>
                                                        <div className="min-w-0">
                                                            <p className="font-bold text-sm truncate">
                                                                {asegInfo} {c.codigoAval ? `— ${c.codigoAval}` : ""}
                                                            </p>
                                                            {c.observaciones && <p className="text-xs text-gray-500 mt-1 truncate">{c.observaciones}</p>}
                                                        </div>
                                                        <span className="inline-flex items-center gap-1.5 text-xs font-black rounded-full px-3 py-1 bg-white/60 border border-white/80 shrink-0">
                                                            <EstIcon size={11} /> {c.estado}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </section>
                                )}
                            </>
                        );
                    })()}
                </div>

                {/* Footer CTA */}
                {!isLoading && emergencia && (
                    <div className="px-6 py-3.5 border-t border-white/40 bg-white/30 backdrop-blur-md flex justify-end gap-3 shrink-0 shadow-[0_-4px_16px_rgba(0,0,0,0.02)]">
                        <button
                            onClick={onClose}
                            className="px-5 py-2 rounded-xl bg-white/60 border border-white/80 text-gray-700 font-bold hover:bg-white/90 transition-all text-sm shadow-sm"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={saveChanges}
                            disabled={isUpdating}
                            className="px-6 py-2 bg-red-500/95 hover:bg-red-600 text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(239,68,68,0.25)] disabled:opacity-60 disabled:cursor-not-allowed border border-red-400/40"
                        >
                            {isUpdating ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            Guardar Cambios
                        </button>
                    </div>
                )}

                {/* ── Carta Aval Modal (Nested Portal) ─────────────────────── */}
                {showCartaModal && typeof document !== "undefined" && createPortal(
                    <div className="fixed inset-0 bg-slate-900/30 z-[200] flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-200">
                        <div className="bg-white/70 backdrop-blur-2xl backdrop-saturate-[1.2] w-full max-w-md rounded-[2.5rem] shadow-[0_8px_32px_0_rgba(0,0,0,0.12)] border border-white/60 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">

                            {/* Header */}
                            <div className="px-6 py-5 border-b border-white/40 bg-white/30 flex items-center justify-between shrink-0">
                                <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                                    <FileText size={18} className="text-blue-500" /> Registrar Carta Aval
                                </h3>
                                <button
                                    onClick={() => setShowCartaModal(false)}
                                    className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-white/60 rounded-full transition-all"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="p-6 space-y-4 overflow-y-auto">
                                {/* Póliza selector */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-gray-500/80 uppercase tracking-wider">Póliza *</label>
                                    <select
                                        value={cartaForm.polizaId?.toString() || ""}
                                        onChange={e => setCartaForm((f: any) => ({ ...f, polizaId: e.target.value }))}
                                        className="w-full px-4 py-3 rounded-2xl bg-white/60 border border-white/80 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all shadow-sm"
                                    >
                                        <option value="">Seleccionar póliza...</option>
                                        {emergencia?.paciente?.polizas?.map((p: any) => (
                                            <option key={p.polizaId?.toString()} value={p.polizaId?.toString()}>
                                                {p.aseguradora.nombre} — {p.numeroPoliza}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Código */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-gray-500/80 uppercase tracking-wider">Código Aval / Clave (recibida por teléfono)</label>
                                    <input
                                        type="text"
                                        value={cartaForm.codigoAval}
                                        onChange={e => setCartaForm((f: any) => ({ ...f, codigoAval: e.target.value }))}
                                        placeholder="CLV-0001234"
                                        className="w-full px-4 py-3 rounded-2xl bg-white/60 border border-white/80 text-sm font-medium text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all font-mono shadow-sm"
                                    />
                                </div>

                                {/* Estado */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-gray-500/80 uppercase tracking-wider">Estado</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {(["SOLICITADA", "APROBADA", "RECHAZADA"] as const).map(st => {
                                            const Icon = cartaEstadoIcon[st];
                                            return (
                                                <button
                                                    key={st}
                                                    type="button"
                                                    onClick={() => setCartaForm((f: any) => ({ ...f, estado: st }))}
                                                    className={`py-2.5 rounded-2xl text-xs font-bold border flex flex-col items-center gap-1 transition-all ${
                                                        cartaForm.estado === st
                                                            ? cartaEstadoBadge[st]
                                                            : "bg-white/50 border-white/70 text-gray-400 hover:bg-white/80"
                                                    }`}
                                                >
                                                    <Icon size={14} /> {st.charAt(0) + st.slice(1).toLowerCase()}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Observaciones */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-gray-500/80 uppercase tracking-wider">Observaciones</label>
                                    <input
                                        type="text"
                                        value={cartaForm.observaciones}
                                        onChange={e => setCartaForm((f: any) => ({ ...f, observaciones: e.target.value }))}
                                        placeholder="Notas adicionales..."
                                        className="w-full px-4 py-3 rounded-2xl bg-white/60 border border-white/80 text-sm font-medium text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all shadow-sm"
                                    />
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-6 py-4 border-t border-white/40 bg-white/30 flex gap-3 shrink-0">
                                <button
                                    onClick={() => setShowCartaModal(false)}
                                    className="flex-1 py-3 rounded-2xl bg-white/60 border border-white/80 text-gray-700 font-bold hover:bg-white/90 transition-all text-sm shadow-sm"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={submitCartaAval}
                                    disabled={isSavingCarta || !cartaForm.polizaId}
                                    className="flex-[2] py-3 bg-blue-500/90 hover:bg-blue-600 text-white font-bold text-sm rounded-2xl transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed border border-blue-400/40"
                                >
                                    {isSavingCarta ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                    Guardar Carta Aval
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}
            </div>
        </div>
    );
}
