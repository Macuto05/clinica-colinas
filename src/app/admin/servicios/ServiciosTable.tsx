"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Plus, Pencil, Search, X, Loader2,
    FlaskConical, ScanLine,
} from "lucide-react";
import type { Servicio } from "./page";

/* ─── tipos ─────────────────────────────────────────── */
type Tipo   = "todos" | "laboratorio" | "imagenologia";
type Estado = "todos" | "activo" | "inactivo";

/* ─── helpers ────────────────────────────────────────── */
const TIPO_LABEL: Record<"laboratorio" | "imagenologia", string> = {
    laboratorio:  "Laboratorio",
    imagenologia: "Imagenología",
};

/* ════════════════════════════════════════════════════════
   MODAL (crear / editar)
════════════════════════════════════════════════════════ */
interface ModalProps {
    isOpen:   boolean;
    onClose:  () => void;
    onSaved:  () => void;
    servicio?: Servicio;       // si viene → modo edición
}

function ServicioModal({ isOpen, onClose, onSaved, servicio }: ModalProps) {
    const isEditing = !!servicio;

    const [nombre,      setNombre]      = useState(servicio?.nombre      ?? "");
    const [descripcion, setDescripcion] = useState(servicio?.descripcion ?? "");
    const [precio,      setPrecio]      = useState(servicio?.precio?.toString() ?? "0");
    const [activo,      setActivo]      = useState(servicio?.activo      ?? true);
    const [tipo,        setTipo]        = useState<"laboratorio" | "imagenologia">(
        servicio?.tipo ?? "laboratorio"
    );
    const [error,   setError]   = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        }
        return () => { document.body.style.overflow = ""; };
    }, [isOpen]);

    if (!isOpen) return null;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        const precioNum = parseFloat(precio);
        if (isNaN(precioNum) || precioNum < 0) {
            setError("El precio debe ser un número válido mayor o igual a 0.");
            return;
        }

        setLoading(true);
        try {
            const apiBase = `/api/${tipo}/examenes`;
            const url     = isEditing ? `${apiBase}/${servicio!.examenId}` : apiBase;
            const method  = isEditing ? "PATCH" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    nombre:      nombre.trim(),
                    descripcion: descripcion.trim() || null,
                    precio:      precioNum,
                    activo,
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                setError(data.error ?? "Error desconocido.");
                return;
            }

            onSaved();
            onClose();
        } catch {
            setError("Error de conexión. Inténtalo de nuevo.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* overlay */}
            <div
                className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* panel */}
            <div className="relative z-10 w-full max-w-md bg-white/70 backdrop-blur-xl border border-white/60 rounded-[2rem] shadow-[0_24px_64px_0_rgba(0,0,0,0.14)] overflow-hidden">

                {/* header */}
                <div className="flex items-center justify-between px-8 pt-8 pb-5 border-b border-white/50">
                    <div>
                        <h2 className="text-xl font-black text-gray-900 tracking-tight">
                            {isEditing ? "Editar servicio" : "Nuevo servicio"}
                        </h2>
                        <p className="text-xs font-medium text-gray-400 mt-0.5 uppercase tracking-widest">
                            Catálogo de servicios clínicos
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl bg-white/50 border border-white/60 hover:bg-white/80 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* body */}
                <form onSubmit={handleSubmit} className="px-8 py-6 space-y-5">
                    {error && (
                        <div className="px-4 py-3 rounded-xl bg-red-50/80 border border-red-200/60 text-sm font-bold text-red-600">
                            {error}
                        </div>
                    )}

                    {/* Tipo — solo editable en creación */}
                    <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                            Tipo de servicio
                        </p>
                        <div className="flex gap-2">
                            {(["laboratorio", "imagenologia"] as const).map(t => (
                                <button
                                    key={t}
                                    type="button"
                                    disabled={isEditing}
                                    onClick={() => setTipo(t)}
                                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-bold transition-all ${
                                        tipo === t
                                            ? "bg-lime-500 text-white border-lime-500 shadow-[0_4px_12px_rgba(132,204,22,0.35)]"
                                            : "bg-white/50 border-white/60 text-gray-500 hover:bg-white/80 disabled:opacity-60 disabled:cursor-not-allowed"
                                    }`}
                                >
                                    {t === "laboratorio"
                                        ? <FlaskConical size={15} />
                                        : <ScanLine size={15} />}
                                    {TIPO_LABEL[t]}
                                </button>
                            ))}
                        </div>
                        {isEditing && (
                            <p className="text-[10px] text-gray-400 font-medium">
                                El tipo no puede cambiarse al editar.
                            </p>
                        )}
                    </div>

                    {/* Nombre */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                            Nombre
                        </label>
                        <input
                            type="text"
                            value={nombre}
                            onChange={e => setNombre(e.target.value)}
                            required
                            minLength={2}
                            placeholder="Ej. Hemograma completo"
                            className="w-full px-4 py-3 rounded-xl bg-white/60 border border-white/70 focus:border-lime-400/60 focus:ring-2 focus:ring-lime-400/20 outline-none text-sm font-medium text-gray-900 placeholder:text-gray-400 transition-all"
                        />
                    </div>

                    {/* Descripción */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                            Descripción <span className="text-gray-300 font-medium normal-case">(opcional)</span>
                        </label>
                        <textarea
                            value={descripcion}
                            onChange={e => setDescripcion(e.target.value)}
                            rows={3}
                            placeholder="Descripción breve del servicio"
                            className="w-full px-4 py-3 rounded-xl bg-white/60 border border-white/70 focus:border-lime-400/60 focus:ring-2 focus:ring-lime-400/20 outline-none text-sm font-medium text-gray-900 placeholder:text-gray-400 transition-all resize-none"
                        />
                    </div>

                    {/* Precio */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                            Precio ($)
                        </label>
                        <input
                            type="number"
                            value={precio}
                            onChange={e => setPrecio(e.target.value)}
                            required
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            className="w-full px-4 py-3 rounded-xl bg-white/60 border border-white/70 focus:border-lime-400/60 focus:ring-2 focus:ring-lime-400/20 outline-none text-sm font-medium text-gray-900 placeholder:text-gray-400 transition-all"
                        />
                    </div>

                    {/* Estado */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-white/50 border border-white/60">
                        <div>
                            <p className="text-sm font-black text-gray-700">Estado del servicio</p>
                            <p className="text-xs text-gray-400 font-medium mt-0.5">
                                {activo ? "Disponible para solicitudes" : "No disponible"}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setActivo(v => !v)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                activo ? "bg-lime-500" : "bg-gray-300"
                            }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                                    activo ? "translate-x-6" : "translate-x-1"
                                }`}
                            />
                        </button>
                    </div>

                    {/* footer */}
                    <div className="flex gap-3 pt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 rounded-xl bg-white/50 border border-white/60 hover:bg-white/80 text-sm font-bold text-gray-600 transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-3 rounded-xl bg-lime-500 hover:bg-lime-600 disabled:opacity-50 text-sm font-black text-white shadow-[0_4px_12px_rgba(132,204,22,0.4)] transition-all flex items-center justify-center gap-2"
                        >
                            {loading && <Loader2 size={16} className="animate-spin" />}
                            {isEditing ? "Guardar cambios" : "Crear servicio"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ════════════════════════════════════════════════════════
   TABLA PRINCIPAL
════════════════════════════════════════════════════════ */
interface ServiciosTableProps {
    servicios: Servicio[];
}

export function ServiciosTable({ servicios }: ServiciosTableProps) {
    const router = useRouter();

    /* filtros */
    const [busqueda, setBusqueda] = useState("");
    const [filtroTipo,   setFiltroTipo]   = useState<Tipo>("todos");
    const [filtroEstado, setFiltroEstado] = useState<Estado>("todos");

    /* modal */
    const [modalOpen,   setModalOpen]   = useState(false);
    const [editTarget,  setEditTarget]  = useState<Servicio | undefined>(undefined);

    /* datos filtrados */
    const filtrados = useMemo(() => {
        return servicios.filter(s => {
            const matchNombre = s.nombre.toLowerCase().includes(busqueda.toLowerCase());
            const matchTipo   = filtroTipo   === "todos" || s.tipo  === filtroTipo;
            const matchEstado = filtroEstado === "todos"
                || (filtroEstado === "activo"   &&  s.activo)
                || (filtroEstado === "inactivo" && !s.activo);
            return matchNombre && matchTipo && matchEstado;
        });
    }, [servicios, busqueda, filtroTipo, filtroEstado]);

    function openCreate() {
        setEditTarget(undefined);
        setModalOpen(true);
    }
    function openEdit(s: Servicio) {
        setEditTarget(s);
        setModalOpen(true);
    }
    function handleSaved() {
        router.refresh();
    }

    return (
        <>
            <div className="space-y-6">

                {/* ── Header ── */}
                <div className="flex items-center justify-between bg-white/40 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/50 shadow-sm">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                            Gestión de Servicios
                        </h1>
                        <p className="text-gray-500 font-medium mt-1">
                            Administra los servicios de laboratorio e imagenología.
                        </p>
                    </div>
                    <button
                        onClick={openCreate}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-lime-500 hover:bg-lime-600 text-white text-sm font-black shadow-[0_4px_12px_rgba(132,204,22,0.4)] hover:scale-[1.02] transition-all duration-200"
                    >
                        <Plus size={18} />
                        Nuevo Servicio
                    </button>
                </div>

                {/* ── Filtros ── */}
                <div className="bg-white/40 backdrop-blur-md border border-white/50 rounded-[2rem] p-6 shadow-sm">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

                        {/* Nombre */}
                        <div className="space-y-1.5">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                                Nombre
                            </p>
                            <div className="relative">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    value={busqueda}
                                    onChange={e => setBusqueda(e.target.value)}
                                    placeholder="Buscar..."
                                    className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-white/60 border border-white/70 focus:border-lime-400/60 focus:ring-2 focus:ring-lime-400/20 outline-none text-sm font-medium text-gray-700 placeholder:text-gray-400 transition-all"
                                />
                            </div>
                        </div>

                        {/* Tipo */}
                        <div className="space-y-1.5">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                                Tipo
                            </p>
                            <select
                                value={filtroTipo}
                                onChange={e => setFiltroTipo(e.target.value as Tipo)}
                                className="w-full px-4 py-2.5 rounded-xl bg-white/60 border border-white/70 focus:border-lime-400/60 focus:ring-2 focus:ring-lime-400/20 outline-none text-sm font-bold text-gray-700 transition-all appearance-none cursor-pointer"
                            >
                                <option value="todos">Todos los tipos</option>
                                <option value="laboratorio">Laboratorio</option>
                                <option value="imagenologia">Imagenología</option>
                            </select>
                        </div>

                        {/* Estado */}
                        <div className="space-y-1.5">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                                Estado
                            </p>
                            <select
                                value={filtroEstado}
                                onChange={e => setFiltroEstado(e.target.value as Estado)}
                                className="w-full px-4 py-2.5 rounded-xl bg-white/60 border border-white/70 focus:border-lime-400/60 focus:ring-2 focus:ring-lime-400/20 outline-none text-sm font-bold text-gray-700 transition-all appearance-none cursor-pointer"
                            >
                                <option value="todos">Cualquier estado</option>
                                <option value="activo">Activo</option>
                                <option value="inactivo">Inactivo</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* ── Tabla ── */}
                <div className="bg-white/40 backdrop-blur-md border border-white/50 rounded-[2.5rem] overflow-hidden shadow-[0_8px_32px_0_rgba(0,0,0,0.04)]">
                    <table className="min-w-full">
                        <thead>
                            <tr className="bg-white/30 border-b border-white/40">
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-gray-500/80">ID</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-gray-500/80">Nombre</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-gray-500/80">Descripción</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-gray-500/80">Precio</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-gray-500/80">Tipo</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-gray-500/80">Estado</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-[0.2em] text-gray-500/80">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/40">
                            {filtrados.map(s => (
                                <tr key={`${s.tipo}-${s.examenId}`} className="hover:bg-white/60 transition-colors group">

                                    <td className="px-6 py-5 whitespace-nowrap text-sm font-bold text-gray-400">
                                        #{s.examenId.padStart(4, "0")}
                                    </td>

                                    <td className="px-6 py-5 whitespace-nowrap">
                                        <span className="text-sm font-black text-gray-900 tracking-tight">
                                            {s.nombre}
                                        </span>
                                    </td>

                                    <td className="px-6 py-5 max-w-xs">
                                        <span className="text-sm text-gray-500 line-clamp-2">
                                            {s.descripcion ?? (
                                                <span className="text-gray-300 italic text-xs">Sin descripción</span>
                                            )}
                                        </span>
                                    </td>

                                    <td className="px-6 py-5 whitespace-nowrap">
                                        <span className="text-sm font-black text-gray-900">
                                            $ {s.precio.toFixed(2)}
                                        </span>
                                    </td>

                                    <td className="px-6 py-5 whitespace-nowrap">
                                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border shadow-sm ${
                                            s.tipo === "laboratorio"
                                                ? "bg-blue-50/60 text-blue-700 border-blue-200/50"
                                                : "bg-purple-50/60 text-purple-700 border-purple-200/50"
                                        }`}>
                                            {s.tipo === "laboratorio"
                                                ? <FlaskConical size={11} />
                                                : <ScanLine size={11} />}
                                            {TIPO_LABEL[s.tipo]}
                                        </span>
                                    </td>

                                    <td className="px-6 py-5 whitespace-nowrap">
                                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border shadow-sm ${
                                            s.activo
                                                ? "bg-green-50/50 text-green-700 border-green-200/50"
                                                : "bg-red-50/50 text-red-700 border-red-200/50"
                                        }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${s.activo ? "bg-green-500" : "bg-red-500"}`} />
                                            {s.activo ? "ACTIVO" : "INACTIVO"}
                                        </span>
                                    </td>

                                    <td className="px-6 py-5 whitespace-nowrap text-right">
                                        <button
                                            onClick={() => openEdit(s)}
                                            title="Editar servicio"
                                            className="p-2 rounded-xl bg-white/50 border border-white/60 hover:bg-white/80 hover:border-blue-200 text-gray-400 hover:text-blue-600 transition-all"
                                        >
                                            <Pencil size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}

                            {filtrados.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="py-20 text-center">
                                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                                            No se encontraron servicios con esos filtros.
                                        </p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {/* footer conteo */}
                    <div className="bg-white/20 px-6 py-4 border-t border-white/40">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                            {filtrados.length} de {servicios.length} servicios
                        </p>
                    </div>
                </div>
            </div>

            {/* Modal — key fuerza remount al cambiar el servicio seleccionado */}
            <ServicioModal
                key={editTarget ? `edit-${editTarget.tipo}-${editTarget.examenId}` : "create"}
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onSaved={handleSaved}
                servicio={editTarget}
            />
        </>
    );
}
