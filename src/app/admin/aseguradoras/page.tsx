"use client";

import { useEffect, useRef, useState } from "react";
import { Shield, Plus, Search, Loader2, Edit2, ToggleLeft, ToggleRight, Phone, Mail, Building2, Hash, Save, X, Tag, DollarSign } from "lucide-react";
import { FormInput } from "@/components/auth/FormInput";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

interface PlanCobertura {
    nombre: string;
    montoMaximo: number;
}

interface Aseguradora {
    aseguradoraId: string;
    nombre: string;
    rifNif: string | null;
    telefono: string | null;
    correo: string | null;
    direccion: string | null;
    activa: boolean;
    planesCobertura: PlanCobertura[];
    totalPolizas: number;
}

interface FormData {
    nombre: string;
    rifNif: string;
    telefono: string;
    correo: string;
    direccion: string;
    activa: boolean;
    planesCobertura: PlanCobertura[];
}

const emptyForm: FormData = { nombre: "", rifNif: "", telefono: "", correo: "", direccion: "", activa: true, planesCobertura: [] };

export default function AseguradorasPage() {
    const [aseguradoras, setAseguradoras] = useState<Aseguradora[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(1);
    const pageSize = 10;

    // Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<FormData>(emptyForm);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const clearFieldError = (field: string) =>
        setFieldErrors(prev => { const n = { ...prev }; delete n[field]; return n; });

    // RIF state
    const [rifNumero, setRifNumero] = useState("");

    // Plan input
    const [planNombreInput, setPlanNombreInput] = useState("");
    const [planMontoInput, setPlanMontoInput] = useState("");

    const addPlan = () => {
        const nombre = planNombreInput.trim();
        const monto = parseFloat(planMontoInput);
        if (!nombre) return;
        if (isNaN(monto) || monto < 0) return;
        if (form.planesCobertura.some(p => p.nombre === nombre)) {
            setPlanNombreInput(""); setPlanMontoInput(""); return;
        }
        setForm(prev => ({ ...prev, planesCobertura: [...prev.planesCobertura, { nombre, montoMaximo: monto }] }));
        setPlanNombreInput("");
        setPlanMontoInput("");
    };

    const removePlan = (nombre: string) => {
        setForm(prev => ({ ...prev, planesCobertura: prev.planesCobertura.filter(p => p.nombre !== nombre) }));
    };

    const fetchData = async () => {
        try {
            const res = await fetch("/api/admin/insurers");
            if (res.ok) setAseguradoras(await res.json());
        } catch (e) { console.error(e); }
        finally { setIsLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const filtered = aseguradoras.filter(a =>
        a.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.rifNif && a.rifNif.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const totalPages = Math.ceil(filtered.length / pageSize);
    const paginatedData = filtered.slice((page - 1) * pageSize, page * pageSize);

    const openCreate = () => {
        setEditingId(null);
        setForm(emptyForm);
        setRifNumero("");
        setPlanNombreInput("");
        setPlanMontoInput("");
        setError(null);
        setFieldErrors({});
        setIsModalOpen(true);
    };

    const openEdit = (a: Aseguradora) => {
        setEditingId(a.aseguradoraId);
        const rifRaw = a.rifNif || "";
        setRifNumero(rifRaw.startsWith("J-") ? rifRaw.slice(2) : rifRaw);
        setForm({
            nombre: a.nombre,
            rifNif: a.rifNif || "",
            telefono: a.telefono || "",
            correo: a.correo || "",
            direccion: a.direccion || "",
            activa: a.activa,
            planesCobertura: Array.isArray(a.planesCobertura) ? a.planesCobertura : [],
        });
        setPlanNombreInput("");
        setPlanMontoInput("");
        setError(null);
        setFieldErrors({});
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        const errs: Record<string, string> = {};
        if (!form.nombre.trim()) errs.nombre = "El nombre es obligatorio.";
        if (!rifNumero.trim()) errs.rifNumero = "El RIF/NIF es obligatorio.";
        if (!form.telefono.trim()) errs.telefono = "El teléfono es obligatorio.";
        if (!form.correo.trim()) errs.correo = "El correo electrónico es obligatorio.";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo)) errs.correo = "El correo no tiene un formato válido.";
        if (!form.direccion.trim()) errs.direccion = "La dirección fiscal es obligatoria.";
        if (Object.keys(errs).length > 0) { setFieldErrors(errs); return; }
        setFieldErrors({});
        setIsSaving(true);
        setError(null);

        try {
            const url = editingId ? `/api/admin/insurers/${editingId}` : "/api/admin/insurers";
            const method = editingId ? "PUT" : "POST";
            const rifNifCombinado = `J-${rifNumero}`;

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...form,
                    rifNif: rifNifCombinado,
                    telefono: form.telefono,
                    correo: form.correo,
                    direccion: form.direccion,
                    planesCobertura: form.planesCobertura,
                })
            });

            if (!res.ok) {
                const data = await res.json();
                setError(data.error || "Error al guardar.");
                return;
            }

            setIsModalOpen(false);
            fetchData();
        } catch (e) {
            setError("Error de conexión.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleToggle = async (id: string) => {
        try {
            await fetch(`/api/admin/insurers/${id}`, { method: "DELETE" });
            fetchData();
        } catch (e) { console.error(e); }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Shield className="text-lime-600" />
                        Gestión de Aseguradoras
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Administra el catálogo de compañías de seguros médicos.</p>
                </div>
                <button
                    onClick={openCreate}
                    className="bg-lime-600 hover:bg-lime-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm font-medium"
                >
                    <Plus size={18} />
                    Nueva Aseguradora
                </button>
            </div>

            {/* Search */}
            <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o RIF..."
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 focus:ring-2 focus:ring-lime-500 outline-none transition-all"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900 min-h-[400px]">
                {isLoading ? (
                    <div className="p-12 flex justify-center items-center h-[400px]">
                        <Loader2 className="animate-spin text-lime-600" size={32} />
                    </div>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-800">
                        <thead className="bg-gray-50 dark:bg-zinc-800">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Nombre</th>
                                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">RIF/NIF</th>
                                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Contacto</th>
                                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Pólizas</th>
                                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Estado</th>
                                <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-zinc-800">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-gray-400">
                                        {searchTerm ? "No se encontraron aseguradoras con ese criterio." : "No hay aseguradoras registradas."}
                                    </td>
                                </tr>
                            ) : paginatedData.map(a => (
                                <tr key={a.aseguradoraId} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-lime-100 dark:bg-lime-900/30 p-2 rounded-lg">
                                                <Building2 size={18} className="text-lime-700 dark:text-lime-400" />
                                            </div>
                                            <span className="font-semibold text-gray-900 dark:text-white">{a.nombre}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 font-mono">
                                        {a.rifNif || "—"}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="space-y-1 text-sm text-gray-500 dark:text-gray-400">
                                            {a.telefono && <div className="flex items-center gap-1"><Phone size={12} /> {a.telefono}</div>}
                                            {a.correo && <div className="flex items-center gap-1"><Mail size={12} /> {a.correo}</div>}
                                            {!a.telefono && !a.correo && "—"}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full text-xs font-semibold">
                                            <Hash size={12} /> {a.totalPolizas}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${a.activa
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'}`}>
                                            {a.activa ? 'ACTIVA' : 'INACTIVA'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => openEdit(a)}
                                                className="p-2 text-gray-500 hover:text-lime-600 hover:bg-lime-50 dark:hover:bg-lime-900/20 rounded-lg transition-colors"
                                                title="Editar"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleToggle(a.aseguradoraId)}
                                                className={`p-2 rounded-lg transition-colors ${a.activa
                                                    ? 'text-green-600 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20'
                                                    : 'text-red-500 hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-900/20'}`}
                                                title={a.activa ? 'Desactivar' : 'Activar'}
                                            >
                                                {a.activa ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination */}
            {filtered.length > 0 && (
                <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-4 flex items-center justify-between shadow-sm">
                    <p className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest">
                        Página {page} de {totalPages} ({filtered.length} total)
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(Math.max(1, page - 1))}
                            disabled={page === 1}
                            className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 hover:bg-gray-200 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-bold"
                        >
                            ← Anterior
                        </button>
                        <button
                            onClick={() => setPage(Math.min(totalPages, page + 1))}
                            disabled={page === totalPages}
                            className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 hover:bg-gray-200 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-bold"
                        >
                            Siguiente →
                        </button>
                    </div>
                </div>
            )}

            {/* Create/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingId ? "Editar Aseguradora" : "Nueva Aseguradora"}
                className="max-w-5xl"
                bodyClassName="p-0"
            >
                <div className="flex flex-col">
                    {error && (
                        <div className="mx-6 mt-6 p-3 bg-red-50/50 backdrop-blur-md border border-red-200/50 text-red-700 rounded-2xl text-sm font-bold flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    <div className="flex p-6 gap-0">
                        {/* ─── Left panel: Datos Principales ─── */}
                        <div className="flex-1 pr-8 space-y-5 min-w-0">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-lime-500" />
                                Datos Principales
                            </h3>

                            <FormInput
                                label="Nombre de la Aseguradora"
                                value={form.nombre}
                                onChange={e => { setForm({ ...form, nombre: e.target.value }); clearFieldError("nombre"); }}
                                placeholder="Ej: Mercantil Seguros"
                                error={fieldErrors.nombre}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-xs font-bold text-gray-500/80 uppercase tracking-wider ml-1">
                                        RIF / NIF
                                    </label>
                                    <div className="flex gap-2">
                                        <div className="flex-shrink-0 px-4 py-3 rounded-2xl border border-white/60 bg-white/50 backdrop-blur-md text-sm font-medium text-gray-700 shadow-inner">
                                            J-
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <FormInput
                                                value={rifNumero}
                                                onChange={e => { setRifNumero(e.target.value.replace(/[^0-9-]/g, "")); clearFieldError("rifNumero"); }}
                                                placeholder="12345678-9"
                                                error={fieldErrors.rifNumero}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <FormInput
                                    label="Teléfono"
                                    value={form.telefono}
                                    onChange={e => { setForm({ ...form, telefono: e.target.value.replace(/[^0-9-]/g, "") }); clearFieldError("telefono"); }}
                                    placeholder="0212-1234567"
                                    error={fieldErrors.telefono}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <FormInput
                                    label="Correo Electrónico"
                                    type="email"
                                    value={form.correo}
                                    onChange={e => { setForm({ ...form, correo: e.target.value }); clearFieldError("correo"); }}
                                    placeholder="contacto@aseguradora.com"
                                    error={fieldErrors.correo}
                                />
                                <FormInput
                                    label="Dirección Fiscal"
                                    value={form.direccion}
                                    onChange={e => { setForm({ ...form, direccion: e.target.value }); clearFieldError("direccion"); }}
                                    placeholder="Av. Principal, Caracas"
                                    error={fieldErrors.direccion}
                                />
                            </div>

                            <div className="flex items-center justify-between p-4 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/60">
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-gray-700 uppercase tracking-tight">Estado Operativo</span>
                                    <span className="text-xs text-gray-400">{form.activa ? "La aseguradora está activa" : "La aseguradora está inactiva"}</span>
                                </div>
                                <div
                                    className={`w-12 h-7 rounded-full p-1 cursor-pointer transition-all duration-300 ${form.activa ? 'bg-lime-500 shadow-[0_0_12px_rgba(132,204,22,0.4)]' : 'bg-gray-200'}`}
                                    onClick={() => setForm({ ...form, activa: !form.activa })}
                                >
                                    <div className={`w-5 h-5 rounded-full bg-white shadow-lg transform transition-transform duration-300 ${form.activa ? 'translate-x-5' : 'translate-x-0'}`} />
                                </div>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="w-px bg-white/40 self-stretch" />

                        {/* ─── Right panel: Planes de Cobertura ─── */}
                        <div className="flex-1 pl-8 space-y-4 min-w-0">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-lime-500" />
                                Planes de Cobertura
                            </h3>
                            <p className="text-xs text-gray-400">
                                Define los planes disponibles. Cada plan tiene un nombre y una <strong>suma asegurada máxima</strong> en USD.
                            </p>

                            {/* Plans list */}
                            {form.planesCobertura.length > 0 && (
                                <div className="space-y-2">
                                    {form.planesCobertura.map(plan => (
                                        <div
                                            key={plan.nombre}
                                            className="flex items-center justify-between bg-lime-50/60 border border-lime-300/40 rounded-2xl px-4 py-3"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <Tag size={14} className="text-lime-600 flex-shrink-0" />
                                                <span className="font-bold text-gray-800 text-sm truncate">{plan.nombre}</span>
                                            </div>
                                            <div className="flex items-center gap-3 flex-shrink-0">
                                                <span className="flex items-center gap-1 text-sm font-black text-lime-700 bg-lime-100/60 border border-lime-300/40 rounded-full px-3 py-0.5">
                                                    <DollarSign size={12} />
                                                    {Number(plan.montoMaximo).toLocaleString("es-VE")}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => removePlan(plan.nombre)}
                                                    className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {form.planesCobertura.length === 0 && (
                                <p className="text-xs text-gray-500 italic">Aún no hay planes definidos.</p>
                            )}

                            {/* Add plan inputs */}
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={planNombreInput}
                                    onChange={e => setPlanNombreInput(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addPlan(); } }}
                                    placeholder="Nombre del plan"
                                    className="flex-[2] min-w-0 px-4 py-2.5 rounded-2xl border border-white/60 bg-white/50 backdrop-blur-sm text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-lime-400/50 transition-all"
                                />
                                <div className="relative flex-1 min-w-0">
                                    <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
                                    <input
                                        type="number"
                                        min="0"
                                        step="1000"
                                        value={planMontoInput}
                                        onChange={e => setPlanMontoInput(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addPlan(); } }}
                                        placeholder="Monto"
                                        className="w-full pl-8 pr-4 py-2.5 rounded-2xl border border-white/60 bg-white/50 backdrop-blur-sm text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-lime-400/50 transition-all"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={addPlan}
                                    className="px-4 py-2.5 bg-lime-500 hover:bg-lime-600 text-white text-sm font-bold rounded-2xl transition-all flex items-center gap-1.5 shadow-sm shrink-0"
                                >
                                    <Plus size={14} /> Agregar
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="border-t border-white/40 bg-white/20 backdrop-blur-md px-6 py-4 flex items-center justify-end gap-3">
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSave}
                            isLoading={isSaving}
                            disabled={isSaving}
                            leftIcon={<Save className="w-5 h-5" />}
                        >
                            {editingId ? "Guardar Cambios" : "Crear Aseguradora"}
                        </Button>
                    </div>
                </div>
            </Modal>        </div>
    );
}
