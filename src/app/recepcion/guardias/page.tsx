"use client";

import { useEffect, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, Loader2, ShieldCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

/* ─── Helpers ───────────────────────────────────────────── */

function getLunes(date: Date): Date {
    const d = new Date(date);
    const day = d.getUTCDay(); // 0=Dom, 1=Lun...
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

const TURNO_LABEL: Record<Turno, string> = {
    "MAÑANA": "☀️ Mañana  07:00–19:00",
    "NOCHE":  "🌙 Noche   19:00–07:00",
};

/* ─── Types ─────────────────────────────────────────────── */
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

/* ─── Page ──────────────────────────────────────────────── */
export default function GuardiasPage() {
    const { user } = useAuth();
    const [lunes, setLunes] = useState<Date>(() => getLunes(new Date()));
    const [medicos, setMedicos] = useState<Medico[]>([]);
    const [guardias, setGuardias] = useState<Guardia[]>([]);
    const [loadingGuardias, setLoadingGuardias] = useState(false);
    const [savingCell, setSavingCell] = useState<string | null>(null); // "fecha|turno"

    // Días de la semana actual
    const dias = Array.from({ length: 7 }, (_, i) => addDays(lunes, i));

    // Cargar médicos activos una sola vez
    useEffect(() => {
        fetch("/api/emergency/doctors")
            .then(r => r.json())
            .then((data: any[]) =>
                setMedicos(data.map(d => ({
                    empleadoId: d.empleadoId,
                    nombre: d.nombre,
                    especialidad: d.especialidad,
                })))
            )
            .catch(() => {});
    }, []);

    // Cargar guardias de la semana
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

    // Obtener médico asignado a un slot
    const getMedicoId = (fecha: string, turno: Turno): string => {
        const g = guardias.find(g => g.fecha === fecha && g.turno === turno);
        return g?.medicoId ?? "";
    };

    // Guardar cambio de un slot
    const handleChange = async (fecha: string, turno: Turno, medicoId: string) => {
        const cellKey = `${fecha}|${turno}`;
        setSavingCell(cellKey);
        try {
            await fetch("/api/recepcion/guardias", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    fecha,
                    turno,
                    medicoId: medicoId || null,
                    creadoPor: (user as any)?.id ?? 1,
                }),
            });
            await fetchGuardias();
        } catch { } finally {
            setSavingCell(null);
        }
    };

    // Navegar semanas
    const semanaAnterior = () => setLunes(prev => addDays(prev, -7));
    const semanaSiguiente = () => setLunes(prev => addDays(prev, 7));

    const formatRangoSemana = () => {
        const dom = addDays(lunes, 6);
        const mesesES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
        const lL = `${lunes.getUTCDate()} ${mesesES[lunes.getUTCMonth()]}`;
        const dL = `${dom.getUTCDate()} ${mesesES[dom.getUTCMonth()]} ${dom.getUTCFullYear()}`;
        return `${lL} – ${dL}`;
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
                        <p className="text-sm text-gray-400/80 font-medium">Asigna médicos de guardia por turno y día</p>
                    </div>
                </div>
            </div>

            {/* Navegación semanal */}
            <div className="flex items-center justify-between bg-white/40 backdrop-blur-md border border-white/50 rounded-2xl px-5 py-3 shadow-sm">
                <button
                    onClick={semanaAnterior}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-gray-600 hover:bg-white/70 border border-transparent hover:border-white/60 transition-all"
                >
                    <ChevronLeft size={18} /> Anterior
                </button>

                <div className="flex items-center gap-2">
                    {loadingGuardias && <Loader2 size={16} className="animate-spin text-lime-500" />}
                    <span className="text-sm font-black text-gray-800 tracking-tight">{formatRangoSemana()}</span>
                </div>

                <button
                    onClick={semanaSiguiente}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-gray-600 hover:bg-white/70 border border-transparent hover:border-white/60 transition-all"
                >
                    Siguiente <ChevronRight size={18} />
                </button>
            </div>

            {/* Grilla */}
            <div className="bg-white/40 backdrop-blur-md border border-white/50 rounded-3xl shadow-[0_4px_16px_0_rgba(0,0,0,0.03)] overflow-hidden">

                {/* Cabecera de días */}
                <div className="grid grid-cols-[140px_repeat(7,1fr)] border-b border-white/50">
                    <div className="px-4 py-3" />
                    {dias.map((dia, i) => {
                        const iso = toISO(dia);
                        const esHoy = iso === hoyISO;
                        return (
                            <div key={i} className={`px-2 py-3 text-center border-l border-white/40 ${esHoy ? "bg-lime-50/60" : ""}`}>
                                <p className={`text-[11px] font-black uppercase tracking-widest ${esHoy ? "text-lime-600" : "text-gray-400"}`}>
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
                {TURNOS.map(turno => (
                    <div key={turno} className="grid grid-cols-[140px_repeat(7,1fr)] border-b border-white/40 last:border-0">
                        {/* Etiqueta del turno */}
                        <div className={`px-4 py-4 flex items-center border-r border-white/40 ${turno === "MAÑANA" ? "bg-amber-50/40" : "bg-indigo-50/40"}`}>
                            <span className="text-xs font-black text-gray-600 leading-tight whitespace-pre-line">
                                {TURNO_LABEL[turno]}
                            </span>
                        </div>

                        {/* Celdas */}
                        {dias.map((dia, i) => {
                            const iso = toISO(dia);
                            const cellKey = `${iso}|${turno}`;
                            const isSaving = savingCell === cellKey;
                            const medicoId = getMedicoId(iso, turno);
                            const esHoy = iso === hoyISO;

                            return (
                                <div key={i} className={`px-2 py-3 border-l border-white/40 ${esHoy ? "bg-lime-50/40" : ""}`}>
                                    <div className="relative">
                                        <select
                                            value={medicoId}
                                            disabled={isSaving}
                                            onChange={e => handleChange(iso, turno, e.target.value)}
                                            className={`w-full text-xs font-bold rounded-xl px-2.5 py-2 border outline-none transition-all appearance-none pr-6 ${
                                                medicoId
                                                    ? "bg-white/80 border-lime-300/60 text-gray-800 shadow-sm"
                                                    : "bg-white/40 border-white/60 text-gray-400"
                                            } ${isSaving ? "opacity-50 cursor-wait" : "hover:bg-white/90 cursor-pointer"}`}
                                        >
                                            <option value="">— Sin guardia —</option>
                                            {medicos.map(m => (
                                                <option key={m.empleadoId} value={m.empleadoId}>
                                                    {m.nombre}
                                                </option>
                                            ))}
                                        </select>
                                        {isSaving && (
                                            <Loader2 size={12} className="animate-spin absolute right-2 top-2.5 text-lime-500 pointer-events-none" />
                                        )}
                                    </div>
                                    {medicoId && (
                                        <p className="text-[10px] text-gray-400 font-medium mt-1 px-1 truncate">
                                            {medicos.find(m => m.empleadoId === medicoId)?.especialidad}
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>

            <p className="text-xs text-gray-400 font-medium text-center">
                Los cambios se guardan automáticamente al seleccionar un médico.
            </p>
        </div>
    );
}