"use client";

import { useEffect, useState } from "react";
import { Shield, Plus, Loader2, Edit2, Trash2, AlertTriangle, Calendar, FileText, Building2 } from "lucide-react";

interface Poliza {
    polizaId: string;
    aseguradoraId: string;
    aseguradora: string;
    aseguradoraRif: string | null;
    aseguradoraTelefono: string | null;
    numeroPoliza: string;
    tipoCobertura: string | null;
    fechaInicio: string | null;
    fechaVence: string | null;
    estado: "ACTIVA" | "VENCIDA" | "SUSPENDIDA";
    observaciones: string | null;
    totalCartasAval: number;
}

interface Aseguradora {
    aseguradoraId: string;
    nombre: string;
    activa: boolean;
}

interface PolicyForm {
    aseguradoraId: string;
    numeroPoliza: string;
    tipoCobertura: string;
    fechaInicio: string;
    fechaVence: string;
    observaciones: string;
}

const emptyForm: PolicyForm = {
    aseguradoraId: "", numeroPoliza: "", tipoCobertura: "",
    fechaInicio: "", fechaVence: "", observaciones: ""
};

const estadoColors: Record<string, string> = {
    ACTIVA: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    VENCIDA: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    SUSPENDIDA: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
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

    const fetchPolizas = async () => {
        try {
            const res = await fetch(`/api/patients/${pacienteId}/policies`);
            if (res.ok) setPolizas(await res.json());
        } catch (e) { console.error(e); }
        finally { setIsLoading(false); }
    };

    const fetchAseguradoras = async () => {
        const res = await fetch("/api/admin/insurers");
        if (res.ok) {
            const data = await res.json();
            setAseguradoras(data.filter((a: Aseguradora) => a.activa));
        }
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

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...form,
                    tipoCobertura: form.tipoCobertura || null,
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
        if (!confirm("¿Está seguro de eliminar esta póliza?")) return;
        try {
            await fetch(`/api/patients/${pacienteId}/policies/${polizaId}`, { method: "DELETE" });
            fetchPolizas();
        } catch (e) { console.error(e); }
    };

    const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString('es-VE') : "—";

    return (
        <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Shield size={20} className="text-lime-600" />
                    Seguros Médicos
                </h3>
                <button
                    onClick={openCreate}
                    className="text-sm bg-lime-600 hover:bg-lime-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                >
                    <Plus size={14} /> Agregar Póliza
                </button>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-8">
                    <Loader2 className="animate-spin text-lime-600" size={24} />
                </div>
            ) : polizas.length === 0 ? (
                <div className="border border-dashed border-gray-300 dark:border-zinc-700 rounded-xl p-8 text-center text-gray-400">
                    <Shield size={32} className="mx-auto mb-2 opacity-50" />
                    <p>Este paciente no tiene pólizas registradas.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {polizas.map(p => (
                        <div key={p.polizaId} className="border border-gray-200 dark:border-zinc-800 rounded-xl p-4 bg-white dark:bg-zinc-900 hover:shadow-sm transition-shadow">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                                        <Building2 size={18} className="text-blue-700 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900 dark:text-white">{p.aseguradora}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Póliza: <span className="font-mono">{p.numeroPoliza}</span></p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${estadoColors[p.estado]}`}>
                                        {p.estado}
                                    </span>
                                    <button onClick={() => openEdit(p)} className="p-1.5 text-gray-400 hover:text-lime-600 rounded-lg hover:bg-lime-50 dark:hover:bg-lime-900/20 transition-colors">
                                        <Edit2 size={14} />
                                    </button>
                                    <button onClick={() => handleDelete(p.polizaId)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                            <div className="mt-3 grid grid-cols-3 gap-4 text-sm text-gray-500 dark:text-gray-400">
                                {p.tipoCobertura && (
                                    <div className="flex items-center gap-1">
                                        <FileText size={12} /> {p.tipoCobertura}
                                    </div>
                                )}
                                <div className="flex items-center gap-1">
                                    <Calendar size={12} /> Desde: {formatDate(p.fechaInicio)}
                                </div>
                                <div className="flex items-center gap-1">
                                    <Calendar size={12} /> Vence: {formatDate(p.fechaVence)}
                                </div>
                            </div>
                            {p.fechaVence && new Date(p.fechaVence) < new Date() && p.estado === "ACTIVA" && (
                                <div className="mt-2 flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                                    <AlertTriangle size={12} /> Póliza posiblemente vencida
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-lg border border-gray-200 dark:border-zinc-800">
                        <div className="p-6 border-b border-gray-200 dark:border-zinc-800 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                {editingId ? "Editar Póliza" : "Agregar Póliza"}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>
                        <div className="p-6 space-y-4">
                            {error && (
                                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Aseguradora *</label>
                                <select
                                    value={form.aseguradoraId}
                                    onChange={e => setForm({ ...form, aseguradoraId: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-lime-500 outline-none"
                                >
                                    <option value="">Seleccionar aseguradora...</option>
                                    {aseguradoras.map(a => (
                                        <option key={a.aseguradoraId} value={a.aseguradoraId}>{a.nombre}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nro. Póliza *</label>
                                    <input
                                        type="text"
                                        value={form.numeroPoliza}
                                        onChange={e => setForm({ ...form, numeroPoliza: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-lime-500 outline-none"
                                        placeholder="POL-000123"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo Cobertura</label>
                                    <select
                                        value={form.tipoCobertura}
                                        onChange={e => setForm({ ...form, tipoCobertura: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-lime-500 outline-none"
                                    >
                                        <option value="">Seleccionar...</option>
                                        <option value="Total">Total</option>
                                        <option value="Hospitalización">Hospitalización</option>
                                        <option value="Ambulatorio">Ambulatorio</option>
                                        <option value="Emergencia">Emergencia</option>
                                        <option value="Cirugía">Cirugía</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha Inicio</label>
                                    <input
                                        type="date"
                                        value={form.fechaInicio}
                                        onChange={e => setForm({ ...form, fechaInicio: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-lime-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha Vencimiento</label>
                                    <input
                                        type="date"
                                        value={form.fechaVence}
                                        onChange={e => setForm({ ...form, fechaVence: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-lime-500 outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observaciones</label>
                                <textarea
                                    value={form.observaciones}
                                    onChange={e => setForm({ ...form, observaciones: e.target.value })}
                                    rows={2}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-lime-500 outline-none resize-none"
                                    placeholder="Notas adicionales..."
                                />
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-200 dark:border-zinc-800 flex justify-end gap-3">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="px-4 py-2 bg-lime-600 text-white rounded-lg hover:bg-lime-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                            >
                                {isSaving && <Loader2 size={16} className="animate-spin" />}
                                {editingId ? "Guardar Cambios" : "Agregar Póliza"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
