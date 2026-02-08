import { Modal } from "@/components/ui/Modal";
import { FileText, Pill, ClipboardList, Activity } from "lucide-react";

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
        >
            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lime-600"></div>
                </div>
            ) : !appointment ? (
                <div className="text-center py-8 text-red-500">
                    No se pudo cargar la información.
                </div>
            ) : (
                <div className="space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar p-1">
                    {/* Header Info */}
                    <div className="bg-gray-50 dark:bg-zinc-800 p-4 rounded-xl border border-gray-100 dark:border-zinc-700">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-gray-500 text-xs uppercase font-bold">Médico</p>
                                <p className="font-semibold text-gray-900 dark:text-white">Dr. {appointment.doctor.nombre}</p>
                                <p className="text-xs text-lime-600">{appointment.doctor.especialidad}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 text-xs uppercase font-bold">Fecha</p>
                                <p className="font-semibold text-gray-900 dark:text-white">
                                    {new Date(appointment.fecha).toLocaleDateString('es-VE', { timeZone: 'UTC' })}
                                </p>
                                <p className="text-xs text-gray-500">{appointment.hora}</p>
                            </div>
                        </div>
                    </div>

                    {/* Diagnosis */}
                    <div className="space-y-2">
                        <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Activity size={18} className="text-lime-500" />
                            Diagnóstico
                        </h4>
                        <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-gray-200 dark:border-zinc-700 shadow-sm">
                            <p className="text-gray-800 dark:text-gray-200 font-medium whitespace-pre-wrap">
                                {appointment.diagnostico?.descripcion || "Sin diagnóstico registrado."}
                            </p>
                            {appointment.diagnostico?.notas && (
                                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-zinc-800">
                                    <p className="text-xs text-gray-500 uppercase font-bold mb-1">Notas / Tratamiento</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                                        {appointment.diagnostico.notas}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Prescription */}
                    {appointment.receta && appointment.receta.detalles.length > 0 && (
                        <div className="space-y-2">
                            <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Pill size={18} className="text-green-500" />
                                Receta Médica
                            </h4>
                            <div className="space-y-2">
                                {appointment.receta.detalles.map((med: any, idx: number) => (
                                    <div key={idx} className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-gray-200 dark:border-zinc-700 shadow-sm">
                                        <div className="flex justify-between items-start">
                                            <span className="font-bold text-gray-900 dark:text-white">{med.medicamento}</span>
                                            <span className="text-xs bg-lime-100 text-lime-700 px-2 py-0.5 rounded-full font-bold">{med.dosis}</span>
                                        </div>
                                        <div className="text-sm text-gray-500 mt-1 flex gap-3">
                                            <span>⏱ {med.frecuencia}</span>
                                            <span>📅 {med.duracion}</span>
                                        </div>
                                        {med.instrucciones && (
                                            <p className="text-xs text-gray-500 mt-2 italic border-l-2 border-gray-200 pl-2">
                                                "{med.instrucciones}"
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Orders */}
                    {appointment.ordenes && appointment.ordenes.length > 0 && (
                        <div className="space-y-2">
                            <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <ClipboardList size={18} className="text-blue-500" />
                                Estudios y Órdenes
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {appointment.ordenes.map((ord: any, idx: number) => (
                                    <div key={idx} className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-gray-200 dark:border-zinc-700 shadow-sm flex justify-between items-center">
                                        <span className="font-medium text-sm text-gray-800 dark:text-gray-200">{ord.estudio}</span>
                                        <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-100 uppercase font-bold">{ord.tipo}</span>
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
