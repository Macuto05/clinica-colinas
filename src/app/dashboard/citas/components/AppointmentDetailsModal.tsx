import { Modal } from "@/components/ui/Modal";
import { PageLoader } from "@/components/ui/PageLoader";
import { Clock, Calendar } from "lucide-react";

interface AppointmentDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    appointment: any; // Ideally typed
    loading?: boolean;
}

export function AppointmentDetailsModal({ isOpen, onClose, appointment, loading }: AppointmentDetailsModalProps) {
    if (!isOpen) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={loading ? "Cargando..." : `Detalles de la Cita`}
            className="max-w-4xl"
        >
            {loading ? (
                <PageLoader message="Cargando detalles..." minHeight="min-h-[180px]" />
            ) : !appointment ? (
                <div className="text-center py-8 text-red-500">
                    No se pudo cargar la información.
                </div>
            ) : (
                <div className="space-y-8 p-4" style={{ contain: "layout style paint" }}>
                    {/* Header Info Card */}
                    <div className="bg-white/60 p-6 rounded-3xl border border-white/50">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <p className="text-gray-400 text-[10px] uppercase font-black tracking-widest">Atendido por</p>
                                <p className="font-bold text-gray-900 text-lg leading-tight">Dr. {appointment.doctor.nombre}</p>
                                <p className="text-sm font-bold text-lime-600/80 bg-lime-500/5 px-2 py-0.5 rounded-lg inline-block border border-lime-500/10">
                                    {appointment.doctor.especialidad}
                                </p>
                            </div>
                            <div className="space-y-1 sm:text-right">
                                <p className="text-gray-400 text-[10px] uppercase font-black tracking-widest">Cita realizada el</p>
                                <p className="font-bold text-gray-900 text-lg leading-tight">
                                    {new Date(appointment.fecha).toLocaleDateString('es-VE', { timeZone: 'UTC' })}
                                </p>
                                <p className="text-sm font-bold text-gray-500 italic">{appointment.hora}</p>
                            </div>
                        </div>
                    </div>

                    {/* Diagnosis Section */}
                    <div className="space-y-4">
                        <h4 className="font-black text-gray-900 uppercase tracking-widest text-[11px] flex items-center gap-2 px-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-lime-500" />
                            Diagnóstico y Conclusiones
                        </h4>
                        <div className="bg-white/40 p-6 rounded-3xl border border-white/50">
                            <p className="text-gray-800 font-semibold text-base leading-relaxed whitespace-pre-wrap">
                                {appointment.diagnostico?.descripcion || "Sin diagnóstico registrado."}
                            </p>
                            {appointment.diagnostico?.notas && (
                                <div className="mt-6 pt-5 border-t border-white/40">
                                    <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-2">Plan de Tratamiento / Observaciones</p>
                                    <p className="text-sm text-gray-600 font-medium whitespace-pre-wrap leading-relaxed">
                                        {appointment.diagnostico.notas}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Prescription Section */}
                    {appointment.receta && appointment.receta.detalles.length > 0 && (
                        <div className="space-y-4">
                            <h4 className="font-black text-gray-900 uppercase tracking-widest text-[11px] flex items-center gap-2 px-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Receta Médica Detallada
                            </h4>
                            <div className="grid gap-3">
                                {appointment.receta.detalles.map((med: any, idx: number) => (
                                    <div key={idx} className="bg-white/50 p-4 rounded-2xl border border-white/60 hover:bg-white/60 transition-colors">
                                        <div className="flex justify-between items-center">
                                            <span className="font-black text-gray-900 text-base">{med.medicamento}</span>
                                            <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-700 px-3 py-1 rounded-full border border-emerald-500/20">{med.dosis}</span>
                                        </div>
                                        <div className="flex gap-4 mt-3">
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 bg-white/40 px-3 py-1 rounded-lg border border-white/60">
                                                <Clock size={12} className="text-emerald-500" />
                                                {med.frecuencia}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 bg-white/40 px-3 py-1 rounded-lg border border-white/60">
                                                <Calendar size={12} className="text-emerald-500" />
                                                {med.duracion}
                                            </div>
                                        </div>
                                        {med.instrucciones && (
                                            <div className="mt-3 p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10 italic text-xs text-gray-600 leading-relaxed font-medium">
                                                "{med.instrucciones}"
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Orders Section */}
                    {appointment.ordenes && appointment.ordenes.length > 0 && (
                        <div className="space-y-4">
                            <h4 className="font-black text-gray-900 uppercase tracking-widest text-[11px] flex items-center gap-2 px-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                Estudios y Órdenes Médicas
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {appointment.ordenes.map((ord: any, idx: number) => (
                                    <div key={idx} className="bg-white/50 p-4 rounded-2xl border border-white/60 flex justify-between items-center hover:bg-white/60 transition-colors">
                                        <span className="font-bold text-sm text-gray-800">{ord.estudio}</span>
                                        <span className="text-[9px] font-black uppercase tracking-widest bg-blue-500/10 text-blue-700 px-2 py-1 rounded-lg border border-blue-500/10">
                                            {ord.tipo}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </Modal>
    );
}
