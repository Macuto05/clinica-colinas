"use client";

import { useEffect, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, Loader2, ShieldCheck, X, Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

/* ─── Helpers ─────────────────────────────────────── */
function getLunes(date: Date): Date {
    const d = new Date(date);
    const day = d.getUTCDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setUTCDate(d.getUTCDate() + diff);
    d.setUTCHours(0, 0, 0, 0);
    return d;
}

function addDays(date: Date, n: number): Date {
    const d = new Date(date);
    d.setUTCDate(d.getUTCDate() + n);
    return d;
}

function toISO(date: Date): string {
    return date.toISOString().split("T")[0];
}

const DIA_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const TURNOS = ["MAÑANA", "NOCHE"] as const;
type Turno = typeof TURNOS[number];

const TURNO_META: Record<Turno, { label: string; horario: string; bg: string }> = {
    MAÑANA: { label: "☀️ Mañana", horario: "07:00 – 19:00", bg: "bg-amber-50/50" },
    NOCHE:  { label: "🌙 Noche",  horario: "19:00 – 07:00", bg: "bg-indigo-50/50" },
};

/* ─── Types ────────────────────────────────────────── */
interface Medico {
    empleadoId: string;
    nombre: string;
    especialidad: string;
}

interface Guardia {
    guardiaId: string;
    medicoId: string;
    fecha: string;
    turno: Turno;
    medico: { nombre: string; especialidad: string };
}

/* ─── Cell component ───────────────────────────────── */
function GuardiaCell({
    fecha, turno, guardias, medicos, creadoPor, onRefresh,
}: {
    fecha: string;
    turno: Turno;
    guardias: Guardia[];
    medicos: Medico[];
    creadoPor: string;
    onRefresh: () => void;
}) {
    const asignados = guardias.filter(g => g.fecha === fecha && g.turno === turno);
    const asignadosIds = new Set(asignados.map(g => g.medicoId));
    const disponibles = medicos.filter(m => !asignadosIds.has(m.empleadoId));

    const [selectedId, setSelectedId] = useState("");
    const [addingId, setAddingId] = useState<string | null>(null); // medicoId siendo agregado
    const [removingId, setRemovingId] = useState<string | null>(null); // guardiaId siendo eliminado

    const handleAdd = async () => {
        if (!selectedId) return;
        setAddingId(selectedId);
        try {
            await fetch("/api/recepcion/guardias", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fecha, turno, medicoId: selectedId, creadoPor }),
            });
            setSelectedId("");
            onRefresh();
        } catch { } finally {
            setAddingId(null);
        }
    };

    const handleRemove = async (guardiaId: string) => {
        setRemovingId(guardiaId);
        try {
            await fetch(`/api/recepcion/guardias?id=${guardiaId}`, { method: "DELETE" });
            onRefresh();
        } catch { } finally {
            setRemovingId(null);
        }
    };

    return (
        <div className="p-2 flex flex-col gap-1.5 min-h-[80px] min-w-0">
            {/* Médicos asignados */}
            {asignados.map(g => (
                <div
                    key={g.guardiaId}
                    className="flex items-center justify-between gap-1 bg-white/80 border border-lime-200/60 rounded-lg px-2 py-1.5 shadow-sm min-w-0"
                >
                    <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-bold text-gray-800 truncate leading-tight">{g.medico.nombre}</p>
                        <p className="text-[10px] text-gray-400 truncate">{g.medico.especialidad}</p>
                    </div>
                    <button
                        onClick={() => handleRemove(g.guardiaId)}
                        disabled={removingId === g.guardiaId}
                        className="shrink-0 p-0.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                        {removingId === g.guardiaId
                            ? <Loader2 size={12} className="animate-spin" />
                            : <X size={12} />
                        }
                    </button>
                </div>
            ))}

            {/* Selector para agregar */}
            {disponibles.length > 0 && (
                <div className="flex items-center gap-1 mt-auto">
                    <select
                        value={selectedId}
                        onChange={e => setSelectedId(e.target.value)}
                        className="flex-1 min-w-0 text-[11px] font-medium rounded-lg px-2 py-1.5 border border-white/60 bg-white/50 text-gray-600 outline-none hover:bg-white/80 transition-colors appearance-none cursor-pointer"
                    >
                        <option value="">+ Agregar...</option>
                        {disponibles.map(m => (
                            <option key={m.empleadoId} value={m.empleadoId}>{m.nombre}</option>
                        ))}
                    </select>
                    {selectedId && (
                        <button
                            onClick={handleAdd}
                            disabled={!!addingId}
                            className="shrink-0 p-1.5 rounded-lg bg-lime-500 text-white hover:bg-lime-600 transition-colors shadow-sm disabled:opacity-50"
                        >
                            {addingId ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

/* ─── Page ─────────────────────────────────────────── */
export default function GuardiasPage() {
    const { user } = useAuth();
    const [lunes, setLunes] = useState<Date>(() => getLunes(new Date()));
    const [medicos, setMedicos] = useState<Medico[]>([]);
    const [guardias, setGuardias] = useState<Guardia[]>([]);
    const [loadingGuardias, setLoadingGuardias] = useState(false);

    const dias = Array.from({ length: 7 }, (_, i) => addDays(lunes, i));
    const creadoPor = (user as any)?.id?.toString() ?? "1";

    useEffect(() => {
        fetch("/api/emergency/doctors?todos=true")
            .then(r => r.json())
            .then((data: any[]) =>
                setMedicos(
                    data
                        .map(d => ({ empleadoId: d.empleadoId, nombre: d.nombre, especialidad: d.especialidad }))
                        .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))
                )
            )
            .catch(() => {});
    }, []);

    const fetchGuardias = useCallback(async () => {
        setLoadingGuardias(true);
        try {
            const res = await fetch(`/api/recepcion/guardias?semana=${toISO(lunes)}`);
            if (res.ok) setGuardias(await res.json());
        } catch { } finally {
            setLoadingGuardias(false);
        }
    }, [lunes]);

    useEffect(() => { fetchGuardias(); }, [fetchGuardias]);

    const formatRangoSemana = () => {
        const dom = addDays(lunes, 6);
        const meses = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
        return `${lunes.getUTCDate()} ${meses[lunes.getUTCMonth()]} – ${dom.getUTCDate()} ${meses[dom.getUTCMonth()]} ${dom.getUTCFullYear()}`;
    };

    const hoyISO = toISO(new Date());

    return (
        <div className="space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between bg-white/40 backdrop-blur-md border border-white/50 rounded-3xl px-6 py-5 shadow-[0_4px_16px_0_rgba(0,0,0,0.03)]">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-lime-500/10 border border-lime-400/20 flex items-center justify-center">
                        <ShieldCheck size={20} className="text-lime-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-gray-900 tracking-tight">Guardias de Emergencia</h2>
                        <p className="text-sm text-gray-400/80 font-medium">Asigna uno o más médicos por turno y día</p>
                    </div>
                </div>
            </div>

            {/* Navegación semanal */}
            <div className="flex items-center justify-between bg-white/40 backdrop-blur-md border border-white/50 rounded-2xl px-5 py-3 shadow-sm">
                <button
                    onClick={() => setLunes(prev => addDays(prev, -7))}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-gray-600 hover:bg-white/70 border border-transparent hover:border-white/60 transition-all"
                >
                    <ChevronLeft size={18} /> Anterior
                </button>

                <div className="flex items-center gap-2">
                    {loadingGuardias && <Loader2 size={16} className="animate-spin text-lime-500" />}
                    <span className="text-sm font-black text-gray-800 tracking-tight">{formatRangoSemana()}</span>
                </div>

                <button
                    onClick={() => setLunes(prev => addDays(prev, 7))}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-gray-600 hover:bg-white/70 border border-transparent hover:border-white/60 transition-all"
                >
                    Siguiente <ChevronRight size={18} />
                </button>
            </div>

            {/* Grilla */}
            <div className="bg-white/40 backdrop-blur-md border border-white/50 rounded-3xl shadow-[0_4px_16px_0_rgba(0,0,0,0.03)] overflow-hidden">

                {/* Cabecera días */}
                <div className="grid grid-cols-[120px_repeat(7,1fr)] border-b border-white/50">
                    <div className="px-3 py-3" />
                    {dias.map((dia, i) => {
                        const esHoy = toISO(dia) === hoyISO;
                        return (
                            <div key={i} className={`min-w-0 px-2 py-3 text-center border-l border-white/40 ${esHoy ? "bg-lime-50/60" : ""}`}>
                                <p className={`text-[10px] font-black uppercase tracking-widest ${esHoy ? "text-lime-600" : "text-gray-400"}`}>
                                    {DIA_LABELS[i]}
                                </p>
                                <p className={`text-base font-black mt-0.5 ${esHoy ? "text-lime-700" : "text-gray-700"}`}>
                                    {dia.getUTCDate()}
                                </p>
                            </div>
                        );
                    })}
                </div>

                {/* Filas de turnos */}
                {TURNOS.map(turno => {
                    const meta = TURNO_META[turno];
                    return (
                        <div key={turno} className="grid grid-cols-[120px_repeat(7,1fr)] border-b border-white/40 last:border-0">
                            {/* Etiqueta turno */}
                            <div className={`px-3 py-4 flex flex-col justify-center border-r border-white/40 ${meta.bg}`}>
                                <span className="text-xs font-black text-gray-700">{meta.label}</span>
                                <span className="text-[10px] text-gray-400 font-medium mt-0.5">{meta.horario}</span>
                            </div>

                            {/* Celdas */}
                            {dias.map((dia, i) => {
                                const iso = toISO(dia);
                                const esHoy = iso === hoyISO;
                                return (
                                    <div key={i} className={`min-w-0 overflow-hidden border-l border-white/40 ${esHoy ? "bg-lime-50/30" : ""}`}>
                                        <GuardiaCell
                                            fecha={iso}
                                            turno={turno}
                                            guardias={guardias}
                                            medicos={medicos}
                                            creadoPor={creadoPor}
                                            onRefresh={fetchGuardias}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    );
                })}
            </div>

            <p className="text-xs text-gray-400 font-medium text-center">
                Los cambios se guardan automáticamente.
            </p>
        </div>
    );
}