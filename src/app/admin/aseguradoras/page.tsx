"use client";

import { useEffect, useState } from "react";
import { Shield, Plus, Search, Loader2, Edit2, ToggleLeft, ToggleRight, Phone, Mail, MapPin, Building2, Hash } from "lucide-react";

interface Aseguradora {
    aseguradoraId: string;
    nombre: string;
    rifNif: string | null;
    telefono: string | null;
    correo: string | null;
    direccion: string | null;
    activa: boolean;
    totalPolizas: number;
}

interface FormData {
    nombre: string;
    rifNif: string;
    telefono: string;
    correo: string;
    direccion: string;
    activa: boolean;
}

const emptyForm: FormData = { nombre: "", rifNif: "", telefono: "", correo: "", direccion: "", activa: true };

export default function AseguradorasPage() {
    const [aseguradoras, setAseguradoras] = useState<Aseguradora[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<FormData>(emptyForm);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

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

    const openCreate = () => {
        setEditingId(null);
        setForm(emptyForm);
        setError(null);
        setIsModalOpen(true);
    };

    const openEdit = (a: Aseguradora) => {
        setEditingId(a.aseguradoraId);
        setForm({
            nombre: a.nombre,
            rifNif: a.rifNif || "",
            telefono: a.telefono || "",
            correo: a.correo || "",
            direccion: a.direccion || "",
            activa: a.activa
        });
        setError(null);
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!form.nombre.trim()) { setError("El nombre es obligatorio."); return; }
        setIsSaving(true);
        setError(null);

        try {
            const url = editingId ? `/api/admin/insurers/${editingId}` : "/api/admin/insurers";
            const method = editingId ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...form,
                    rifNif: form.rifNif || null,
                    telefono: form.telefono || null,
                    correo: form.correo || null,
                    direccion: form.direccion || null,
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
                            ) : filtered.map(a => (
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

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-lg border border-gray-200 dark:border-zinc-800">
                        <div className="p-6 border-b border-gray-200 dark:border-zinc-800 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                {editingId ? "Editar Aseguradora" : "Nueva Aseguradora"}
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
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre *</label>
                                <input
                                    type="text"
                                    value={form.nombre}
                                    onChange={e => setForm({ ...form, nombre: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-lime-500 outline-none"
                                    placeholder="Ej: Mercantil Seguros"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">RIF/NIF</label>
                                    <input
                                        type="text"
                                        value={form.rifNif}
                                        onChange={e => setForm({ ...form, rifNif: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-lime-500 outline-none"
                                        placeholder="J-12345678-9"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Teléfono</label>
                                    <input
                                        type="text"
                                        value={form.telefono}
                                        onChange={e => setForm({ ...form, telefono: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-lime-500 outline-none"
                                        placeholder="0212-1234567"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Correo</label>
                                <input
                                    type="email"
                                    value={form.correo}
                                    onChange={e => setForm({ ...form, correo: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-lime-500 outline-none"
                                    placeholder="contacto@aseguradora.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dirección</label>
                                <input
                                    type="text"
                                    value={form.direccion}
                                    onChange={e => setForm({ ...form, direccion: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-lime-500 outline-none"
                                    placeholder="Av. Principal, Caracas"
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
                                {editingId ? "Guardar Cambios" : "Crear Aseguradora"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
