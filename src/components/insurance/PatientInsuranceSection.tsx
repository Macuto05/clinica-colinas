"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
    Shield, Plus, Loader2, Edit2, Trash2, AlertTriangle,
    Calendar, Tag, Building2, X, Save, Hash, DollarSign
} from "lucide-react";

interface Poliza {
    polizaId: string;
    aseguradoraId: string;
    aseguradora: string;
    aseguradoraRif: string | null;
    aseguradoraTelefono: string | null;
    numeroPoliza: string;
    tipoCobertura: string | null;
    montoCobertura: number | null;
    fechaInicio: string | null;
    fechaVence: string | null;
    estado: "ACTIVA" | "VENCIDA" | "SUSPENDIDA";
    observaciones: string | null;
    totalCartasAval: number;
}

interface PlanCobertura {
    nombre: string;
    montoMaximo: number;
}

interface Aseguradora {
    aseguradoraId: string;
    nombre: string;
    activa: boolean;
    planesCobertura: PlanCobertura[];
}

interface PolicyForm {
    aseguradoraId: string;
    numeroPoliza: string;
    tipoCobertura: string;
    montoCobertura: string;
    fechaInicio: string;
    fechaVence: string;
    observaciones: string;
}

const emptyForm: PolicyForm = {
    aseguradoraId: "", numeroPoliza: "", tipoCobertura: "",
    montoCobertura: "", fechaInicio: "", fechaVence: "", observaciones: ""
};

const estadoBadge: Record<string, string> = {
    ACTIVA: "bg-lime-500/15 text-lime-800 border-lime-400/30",
    VENCIDA: "bg-red-100/60 text-red-700 border-red-300/40",
    SUSPENDIDA: "bg-amber-100/60 text-amber-700 border-amber-300/40",
};
const estadoDot: Record<string, string> = {
    ACTIVA: "bg-lime-500",
    VENCIDA: "bg-red-500",
    SUSPENDIDA: "bg-amber-500",
};

export default function PatientInsuranceSection({ pacienteId }: { pacienteId: string }) {
    const [polizas, setPolizas] = useState<Poliza[]>([]);
    const [aseguradoras, setAseguradoras] = useState<Aseguradora[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<PolicyForm>(emptyForm);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Plans for the selected aseguradora
    const selectedAseg = aseguradoras.find(a => a.aseguradoraId === form.aseguradoraId);
    const availablePlans: PlanCobertura[] = selectedAseg?.planesCobertura ?? [];
    const selectedPlan = availablePlans.find(p => p.nombre === form.tipoCobertura);

    const handleAsegChange = (id: string) => {
        setForm(prev => ({ ...prev, aseguradoraId: id, tipoCobertura: "", montoCobertura: "" }));
    };

    const handlePlanChange = (nombre: string) => {
        const plan = availablePlans.find(p => p.nombre === nombre);
        setForm(prev => ({
            ...prev,
            tipoCobertura: nombre,
            montoCobertura: plan ? String(plan.montoMaximo) : ""
        }));
    };

    const fetchPolizas = async () => {
        try {
            const res = await fetch(`/api/patients/${pacienteId}/policies`);
            if (res.ok) setPolizas(await res.json());
        } catch (e) { console.error(e); }
        finally { setIsLoading(false); }
    };

    const fetchAseguradoras = async () => {
        try {
            const res = await fetch("/api/admin/insurers");
            if (res.ok) {
                const data = await res.json();
                setAseguradoras(data.filter((a: Aseguradora) => a.activa));
            }
        } catch (e) { console.error(e); }
    };

    useEffect(() => { fetchPolizas(); fetchAseguradoras(); }, [pacienteId]);


    const openCreate = () => {
        setEditingId(null);
        setForm(emptyForm);
        setError(null);
        setIsModalOpen(true);
    };

    const openEdit = (p: Poliza) => {
        setEditingId(p.polizaId);
        setForm({
            aseguradoraId: p.aseguradoraId,
            numeroPoliza: p.numeroPoliza,
            tipoCobertura: p.tipoCobertura || "",
            montoCobertura: p.montoCobertura ? String(p.montoCobertura) : "",
            fechaInicio: p.fechaInicio ? new Date(p.fechaInicio).toISOString().split('T')[0] : "",
            fechaVence: p.fechaVence ? new Date(p.fechaVence).toISOString().split('T')[0] : "",
            observaciones: p.observaciones || "",
        });
        setError(null);
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!form.aseguradoraId || !form.numeroPoliza.trim()) {
            setError("Aseguradora y número de póliza son obligatorios.");
            return;
        }
        setIsSaving(true);
        setError(null);

        try {
            const url = editingId
                ? `/api/patients/${pacienteId}/policies/${editingId}`
                : `/api/patients/${pacienteId}/policies`;
            const method = editingId ? "PUT" : "POST";

            const montoNum = parseFloat(form.montoCobertura);

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...form,
                    tipoCobertura: form.tipoCobertura || null,
                    montoCobertura: !isNaN(montoNum) && montoNum > 0 ? montoNum : null,
                    fechaInicio: form.fechaInicio || null,
                    fechaVence: form.fechaVence || null,
                    observaciones: form.observaciones || null,
                })
            });

            if (!res.ok) {
                const data = await res.json();
                setError(data.error || "Error al guardar.");
                return;
            }

            setIsModalOpen(false);
            fetchPolizas();
        } catch (e) { setError("Error de conexión."); }
        finally { setIsSaving(false); }
    };

    const handleDelete = async (polizaId: string) => {
        if (!confirm("¿Está seguro de eliminar esta póliza? Si tiene cartas aval asociadas, quedará suspendida.")) return;
        try {
            const res = await fetch(`/api/patients/${pacienteId}/policies/${polizaId}`, { method: "DELETE" });
            if (res.ok) fetchPolizas();
        } catch (e) { console.error(e); }
    };

    const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' }) : "—";

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-lime-500" />
                    Seguros Médicos
                </h3>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 bg-lime-500 hover:bg-lime-600 text-white rounded-xl transition-all shadow-sm"
                >
                    <Plus size={13} /> Agregar Póliza
                </button>
            </div>

            {/* List */}
            {isLoading ? (
                <div className="flex justify-center py-8">
                    <Loader2 className="animate-spin text-lime-500" size={22} />
                </div>
            ) : polizas.length === 0 ? (
                <div className="border-2 border-dashed border-white/60 rounded-2xl p-8 text-center">
                    <Shield size={28} className="mx-auto mb-2 text-gray-300" />
                    <p className="text-sm font-medium text-gray-400">No hay pólizas registradas.</p>
                    <p className="text-xs text-gray-300 mt-1">Agrega una póliza para vincular un seguro médico al paciente.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {polizas.map(p => {
                        const isExpired = p.fechaVence && new Date(p.fechaVence) < new Date() && p.estado === "ACTIVA";
                        return (
                            <div key={p.polizaId} className="bg-white/50 backdrop-blur-sm border border-white/60 rounded-2xl p-4 shadow-sm hover:bg-white/70 transition-all">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="bg-lime-500/10 w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-lime-400/20">
                                            <Building2 size={16} className="text-lime-700" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-gray-900 text-sm truncate">{p.aseguradora}</p>
                                            <p className="text-xs text-gray-500 font-mono">
                                                <Hash size={10} className="inline mr-0.5" />{p.numeroPoliza}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide border ${estadoBadge[p.estado]}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${estadoDot[p.estado]}`} />
                                            {p.estado}
                                        </span>
                                        <button
                                            onClick={() => openEdit(p)}
                                            className="p-1.5 text-gray-400 hover:text-lime-600 rounded-lg hover:bg-lime-50 transition-colors"
                                            title="Editar"
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(p.polizaId)}
                                            className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                                            title="Eliminar"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-500">
                                    {p.tipoCobertura && (
                                        <span className="flex items-center gap-1 bg-white/60 border border-white/70 px-2.5 py-1 rounded-full">
                                            <Tag size={10} /> {p.tipoCobertura}
                                        </span>
                                    )}
                                    {p.montoCobertura && (
                                        <span className="flex items-center gap-1 bg-lime-50/60 border border-lime-300/40 text-lime-700 font-black px-2.5 py-1 rounded-full">
                                            <DollarSign size={10} /> {Number(p.montoCobertura).toLocaleString('es-VE')} máx.
                                        </span>
                                    )}
                                    <span className="flex items-center gap-1 bg-white/60 border border-white/70 px-2.5 py-1 rounded-full">
                                        <Calendar size={10} /> Desde {formatDate(p.fechaInicio)}
                                    </span>
                                    <span className="flex items-center gap-1 bg-white/60 border border-white/70 px-2.5 py-1 rounded-full">
                                        <Calendar size={10} /> Vence {formatDate(p.fechaVence)}
                                    </span>
                                </div>

                                {isExpired && (
                                    <div className="mt-2 flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50/60 border border-amber-200/40 rounded-xl px-3 py-1.5">
                                        <AlertTriangle size={12} /> Esta póliza podría estar vencida
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Create/Edit Inner Modal */}
            {isModalOpen && typeof document !== "undefined" && createPortal(
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in duration-150">
                    <div className="bg-white/75 backdrop-blur-2xl backdrop-saturate-[1.2] rounded-[2rem] w-full max-w-lg shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-white/60 overflow-hidden animate-in zoom-in-95 duration-200">

                        {/* Modal Header */}
                        <div className="px-6 py-5 border-b border-white/40 bg-white/30 flex items-center justify-between">
                            <h4 className="font-bold text-gray-900 text-base flex items-center gap-2">
                                <Shield size={18} className="text-lime-600" />
                                {editingId ? "Editar Póliza" : "Nueva Póliza"}
                            </h4>
                            <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-white/60 rounded-full transition-all">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                            {error && (
                                <div className="p-3 bg-red-50/70 border border-red-200/50 text-red-700 rounded-2xl text-sm font-bold flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> {error}
                                </div>
                            )}

                            {/* Aseguradora */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-black text-gray-500 uppercase tracking-wider">Aseguradora *</label>
                                <select
                                    value={form.aseguradoraId}
                                    onChange={e => handleAsegChange(e.target.value)}
                                    className="w-full px-4 py-3 rounded-2xl border border-white/60 bg-white/50 backdrop-blur-sm text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-lime-400/50 transition-all"
                                >
                                    <option value="">Seleccionar aseguradora...</option>
                                    {aseguradoras.map(a => (
                                        <option key={a.aseguradoraId} value={a.aseguradoraId}>{a.nombre}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Plan de Cobertura */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-black text-gray-500 uppercase tracking-wider">Plan de Cobertura</label>
                                {availablePlans.length > 0 ? (
                                    <>
                                        <select
                                            value={form.tipoCobertura}
                                            onChange={e => handlePlanChange(e.target.value)}
                                            className="w-full px-4 py-3 rounded-2xl border border-white/60 bg-white/50 backdrop-blur-sm text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-lime-400/50 transition-all"
                                        >
                                            <option value="">Seleccionar plan...</option>
                                            {availablePlans.map(plan => (
                                                <option key={plan.nombre} value={plan.nombre}>
                                                    {plan.nombre} — USD {Number(plan.montoMaximo).toLocaleString('es-VE')}
                                                </option>
                                            ))}
                                        </select>
                                        {selectedPlan && (
                                            <div className="flex items-center gap-2 text-xs font-bold text-lime-700 bg-lime-50/60 border border-lime-300/40 rounded-2xl px-4 py-2.5">
                                                <DollarSign size={13} />
                                                Suma asegurada máxima: <span className="text-base font-black">${Number(selectedPlan.montoMaximo).toLocaleString('es-VE')}</span>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="px-4 py-3 rounded-2xl border border-white/60 bg-white/30 text-sm text-gray-400 italic">
                                        {form.aseguradoraId
                                            ? "Esta aseguradora no tiene planes definidos. Contáctese con el administrador."
                                            : "Seleccione una aseguradora primero."}
                                    </div>
                                )}
                            </div>

                            {/* N° Póliza */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-black text-gray-500 uppercase tracking-wider">N° de Póliza *</label>
                                <input
                                    type="text"
                                    value={form.numeroPoliza}
                                    onChange={e => setForm({ ...form, numeroPoliza: e.target.value })}
                                    placeholder="Ej: MER-2024-0089123"
                                    className="w-full px-4 py-3 rounded-2xl border border-white/60 bg-white/50 backdrop-blur-sm text-sm font-medium text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-lime-400/50 transition-all font-mono"
                                />
                            </div>

                            {/* Fechas */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-gray-500 uppercase tracking-wider">Fecha Inicio</label>
                                    <input
                                        type="date"
                                        value={form.fechaInicio}
                                        onChange={e => setForm({ ...form, fechaInicio: e.target.value })}
                                        className="w-full px-4 py-3 rounded-2xl border border-white/60 bg-white/50 backdrop-blur-sm text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-lime-400/50 transition-all"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-gray-500 uppercase tracking-wider">Fecha Vencimiento</label>
                                    <input
                                        type="date"
                                        value={form.fechaVence}
                                        onChange={e => setForm({ ...form, fechaVence: e.target.value })}
                                        className="w-full px-4 py-3 rounded-2xl border border-white/60 bg-white/50 backdrop-blur-sm text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-lime-400/50 transition-all"
                                    />
                                </div>
                            </div>

                            {/* Observaciones */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-black text-gray-500 uppercase tracking-wider">Observaciones</label>
                                <textarea
                                    value={form.observaciones}
                                    onChange={e => setForm({ ...form, observaciones: e.target.value })}
                                    rows={2}
                                    placeholder="Notas adicionales sobre la póliza..."
                                    className="w-full px-4 py-3 rounded-2xl border border-white/60 bg-white/50 backdrop-blur-sm text-sm font-medium text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-lime-400/50 transition-all resize-none"
                                />
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 border-t border-white/40 bg-white/30 flex justify-end gap-3">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-5 py-2.5 rounded-2xl bg-white/50 border border-white/60 text-gray-700 font-bold text-sm hover:bg-white/80 transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="px-5 py-2.5 bg-lime-500 hover:bg-lime-600 text-white font-bold text-sm rounded-2xl transition-all flex items-center gap-2 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {isSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                                {editingId ? "Guardar Cambios" : "Agregar Póliza"}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
