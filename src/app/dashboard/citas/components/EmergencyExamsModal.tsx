"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
    X, FlaskConical, ScanLine, Download,
    AlertCircle, CheckCircle2, Clock, PackageOpen
} from "lucide-react";
import { PageLoader } from "@/components/ui/PageLoader";

interface Examen {
    nombre: string;
    rutaArchivo: string | null;
    nombreArchivo: string | null;
}

interface SolicitudLab {
    solicitudLabId: string;
    estado: string;
    fechaSolicitud: string;
    observaciones: string | null;
    examenes: Examen[];
}

interface SolicitudImg {
    solicitudImgId: string;
    estado: string;
    fechaSolicitud: string;
    observaciones: string | null;
    examenes: Examen[];
}

interface ExamsData {
    citaId: string | null;
    hasExams: boolean;
    solicitudesLab: SolicitudLab[];
    solicitudesImg: SolicitudImg[];
}

interface Props {
    emergenciaId: string | null;
    onClose: () => void;
}

const estadoConfig: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    PENDIENTE:  { label: "Pendiente",  className: "bg-amber-50 text-amber-700 border-amber-200", icon: <Clock size={11} /> },
    APROBADA:   { label: "Aprobada",   className: "bg-blue-50  text-blue-700  border-blue-200",  icon: <CheckCircle2 size={11} /> },
    RECHAZADA:  { label: "Rechazada",  className: "bg-red-50   text-red-600   border-red-200",   icon: <AlertCircle size={11} /> },
    ATENDIDA:   { label: "Atendida",   className: "bg-lime-50  text-lime-700  border-lime-200",  icon: <CheckCircle2 size={11} /> },
    COMPLETADA: { label: "Completada", className: "bg-lime-50  text-lime-700  border-lime-200",  icon: <CheckCircle2 size={11} /> },
    CANCELADA:  { label: "Cancelada",  className: "bg-red-50   text-red-600   border-red-200",   icon: <AlertCircle size={11} /> },
};

function EstadoBadge({ estado }: { estado: string }) {
    const cfg = estadoConfig[estado] ?? { label: estado, className: "bg-gray-50 text-gray-600 border-gray-200", icon: null };
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide border ${cfg.className}`}>
            {cfg.icon} {cfg.label}
        </span>
    );
}

function ExamenRow({ examen, colorClass }: { examen: Examen; colorClass: string }) {
    return (
        <div className="flex items-center justify-between gap-3">
            <span className={`text-xs font-bold rounded-xl px-3 py-1 ${colorClass}`}>
                {examen.nombre}
            </span>
            {examen.rutaArchivo ? (
                <a
                    href={examen.rutaArchivo}
                    download={examen.nombreArchivo ?? examen.nombre}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-lime-500/95 hover:bg-lime-600 text-white text-[10px] font-black rounded-xl transition-all shadow-[0_2px_8px_rgba(132,204,22,0.2)] border border-lime-400/50"
                >
                    <Download size={11} /> Descargar
                </a>
            ) : (
                <span className="text-[10px] text-gray-300 font-medium">Sin resultado</span>
            )}
        </div>
    );
}

export function EmergencyExamsModal({ emergenciaId, onClose }: Props) {
    const [data, setData] = useState<ExamsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!emergenciaId) return;
        setIsLoading(true);
        setError(null);
        fetch(`/api/patient/emergency/${emergenciaId}/exams`)
            .then(res => res.ok ? res.json() : res.json().then(d => Promise.reject(d.error)))
            .then(setData)
            .catch(err => setError(typeof err === "string" ? err : "Error al cargar los exámenes"))
            .finally(() => setIsLoading(false));
    }, [emergenciaId]);

    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = ""; };
    }, []);

    if (!emergenciaId || typeof document === "undefined") return null;

    return createPortal(
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4 sm:p-6 md:p-8 animate-in fade-in duration-200">
            <div className="bg-white/70 backdrop-blur-2xl rounded-[2.5rem] w-full max-w-3xl max-h-[90vh] flex flex-col shadow-[0_8px_32px_0_rgba(0,0,0,0.12)] border border-white/60 overflow-hidden">

                {/* Header */}
                <div className="px-6 py-4 border-b border-white/40 bg-white/30 backdrop-blur-md flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 tracking-tight">Exámenes de Emergencia</h2>
                        <p className="text-xs font-medium text-gray-500 mt-0.5">Solicitudes de laboratorio e imagenología</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 bg-white/50 hover:bg-white rounded-full flex items-center justify-center border border-white/60 shadow-sm transition-all text-gray-500 hover:text-gray-800"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 space-y-5 custom-scrollbar">
                    {isLoading ? (
                        <PageLoader message="Cargando exámenes..." minHeight="min-h-[200px]" />
                    ) : error ? (
                        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200/50 rounded-2xl text-red-700">
                            <AlertCircle size={20} className="shrink-0" />
                            <p className="text-sm font-bold">{error}</p>
                        </div>
                    ) : !data?.hasExams ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center">
                                <PackageOpen size={28} className="text-gray-300" />
                            </div>
                            <p className="font-bold text-gray-500">Sin exámenes registrados</p>
                            <p className="text-sm text-gray-400 max-w-xs">
                                {!data?.citaId
                                    ? "Esta emergencia no tiene una cita médica vinculada."
                                    : "No se ordenaron exámenes para esta emergencia."}
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Laboratorio */}
                            {data.solicitudesLab.length > 0 && (
                                <section className="bg-white/40 backdrop-blur-md border border-white/50 rounded-3xl p-5 shadow-[0_4px_16px_0_rgba(0,0,0,0.02)] space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-400/20 flex items-center justify-center">
                                            <FlaskConical size={16} className="text-blue-600" />
                                        </div>
                                        <h4 className="font-bold text-gray-800 text-base">Laboratorio</h4>
                                        <span className="ml-auto text-xs font-black text-gray-400 bg-white/60 border border-white/70 rounded-full px-2.5 py-0.5">
                                            {data.solicitudesLab.length} orden{data.solicitudesLab.length !== 1 ? "es" : ""}
                                        </span>
                                    </div>
                                    <div className="space-y-3">
                                        {data.solicitudesLab.map((sol) => (
                                            <div key={sol.solicitudLabId} className="bg-white/50 border border-white/60 rounded-2xl p-4 space-y-3">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-xs font-bold text-gray-500">
                                                        {new Date(sol.fechaSolicitud).toLocaleDateString("es-VE")}
                                                    </span>
                                                    <EstadoBadge estado={sol.estado} />
                                                </div>
                                                <div className="space-y-2">
                                                    {sol.examenes.map((e, i) => (
                                                        <ExamenRow
                                                            key={i}
                                                            examen={e}
                                                            colorClass="text-blue-800 bg-blue-50 border border-blue-200/50"
                                                        />
                                                    ))}
                                                </div>
                                                {sol.observaciones && (
                                                    <p className="text-xs text-gray-400 italic">{sol.observaciones}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Imagenología */}
                            {data.solicitudesImg.length > 0 && (
                                <section className="bg-white/40 backdrop-blur-md border border-white/50 rounded-3xl p-5 shadow-[0_4px_16px_0_rgba(0,0,0,0.02)] space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-400/20 flex items-center justify-center">
                                            <ScanLine size={16} className="text-purple-600" />
                                        </div>
                                        <h4 className="font-bold text-gray-800 text-base">Imagenología</h4>
                                        <span className="ml-auto text-xs font-black text-gray-400 bg-white/60 border border-white/70 rounded-full px-2.5 py-0.5">
                                            {data.solicitudesImg.length} orden{data.solicitudesImg.length !== 1 ? "es" : ""}
                                        </span>
                                    </div>
                                    <div className="space-y-3">
                                        {data.solicitudesImg.map((sol) => (
                                            <div key={sol.solicitudImgId} className="bg-white/50 border border-white/60 rounded-2xl p-4 space-y-3">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-xs font-bold text-gray-500">
                                                        {new Date(sol.fechaSolicitud).toLocaleDateString("es-VE")}
                                                    </span>
                                                    <EstadoBadge estado={sol.estado} />
                                                </div>
                                                <div className="space-y-2">
                                                    {sol.examenes.map((e, i) => (
                                                        <ExamenRow
                                                            key={i}
                                                            examen={e}
                                                            colorClass="text-purple-800 bg-purple-50 border border-purple-200/50"
                                                        />
                                                    ))}
                                                </div>
                                                {sol.observaciones && (
                                                    <p className="text-xs text-gray-400 italic">{sol.observaciones}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-white/40 shrink-0 bg-white/30 backdrop-blur-md flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-3.5 rounded-2xl bg-white/50 border border-white/60 text-gray-700 font-bold hover:bg-white transition-colors text-sm shadow-sm backdrop-blur-sm outline-none focus:ring-2 focus:ring-gray-300"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
