"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Calendar, AlertCircle, CheckCircle, Ban, ArrowRight, Loader2 } from "lucide-react";
import { format, parse } from "date-fns";
import { Calendar as CustomCalendar } from "@/components/ui/Calendar"; // Reuse calendar

interface Appointment {
    id: string;
    patientName: string;
    doctorName: string;
    date: string;
    startTime: string;
    status: string;
    reason: string;
    doctorId: string; // Needed for rescheduling to fetch slots
    isPaid: boolean;
}

interface AppointmentActionModalProps {
    isOpen: boolean;
    onClose: () => void;
    appointment: Appointment | null;
    action: 'CONFIRM' | 'CANCEL' | 'RESCHEDULE' | 'NO_SHOW' | null;
    onSuccess: () => void;
}

interface TimeSlot {
    start: string;
    end: string;
    available: boolean;
}

export function AppointmentActionModal({ isOpen, onClose, appointment, action, onSuccess }: AppointmentActionModalProps) {
    const [loading, setLoading] = useState(false);
    const [cancellationReason, setCancellationReason] = useState("");

    // Reschedule State
    const [newDate, setNewDate] = useState("");
    const [newTime, setNewTime] = useState("");
    const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
    const [isFetchingSlots, setIsFetchingSlots] = useState(false);
    const [rescheduleError, setRescheduleError] = useState<string | null>(null);

    // Reset states when opening
    useEffect(() => {
        if (isOpen) {
            setCancellationReason("");
            setNewDate("");
            setNewTime("");
            setAvailableSlots([]);
            setRescheduleError(null);
        }
    }, [isOpen]);

    const fetchSlots = async (date: string) => {
        if (!appointment) return;
        setIsFetchingSlots(true);
        try {
            const res = await fetch(`/api/appointments/slots?doctorId=${appointment.doctorId}&date=${date}`);
            if (res.ok) {
                const data = await res.json();
                setAvailableSlots(data.slots || []);
            }
        } catch (error) {
            console.error("Error fetching slots", error);
        } finally {
            setIsFetchingSlots(false);
        }
    };

    const handleConfirm = async () => {
        if (!appointment) return;

        // Strict Payment Check
        if (!appointment.isPaid) {
            // This case should be handled by UI disabling button, but safety check here
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`/api/appointments/${appointment.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'CONFIRMADA' })
            });

            if (!res.ok) throw new Error("Error al confirmar cita");
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleNoShow = async () => {
        if (!appointment) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/appointments/${appointment.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'NO_ASISTIO' })
            });

            if (!res.ok) throw new Error("Error al marcar como No Asistió");
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async () => {
        if (!appointment) return;
        if (!cancellationReason) return; // Force reason
        setLoading(true);
        try {
            // We can use the dedicated cancel API or the PATCH one created.
            // Let's use PATCH for consistency if we added logic, but typically Cancel has dedicated endpoint logic for notifying etc.
            // Actually, `AppointmentController` had a `cancel` method but route might be specific.
            // Let's use the updating PATCH we just made which handles status update.
            // Wait, does PATCH handle 'CANCELADA'? Yes.

            const res = await fetch(`/api/appointments/${appointment.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: 'CANCELADA',
                    reason: cancellationReason // We might want to append this to existing reason or logs? PATCH route handles 'reason' field update.
                })
            });

            if (!res.ok) throw new Error("Error al cancelar cita");
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleReschedule = async () => {
        if (!appointment || !newDate || !newTime) return;
        setLoading(true);
        setRescheduleError(null);
        try {
            // Calculate end time (30 mins default)
            const [hours, minutes] = newTime.split(':').map(Number);
            const endObj = new Date();
            endObj.setHours(hours, minutes + 30);
            const endTimeStr = `${endObj.getHours().toString().padStart(2, '0')}:${endObj.getMinutes().toString().padStart(2, '0')}`;

            const res = await fetch(`/api/appointments/${appointment.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: newDate,
                    startTime: newTime,
                    endTime: endTimeStr,
                    status: 'PROGRAMADA' // Reset status if it was missed/cancelled? Usually keep PROGRAMADA.
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.details || data.error || "Error al reprogramar");
            }

            onSuccess();
            onClose();
        } catch (error: any) {
            setRescheduleError(error.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !appointment) return null;

    return createPortal(
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className={`bg-white dark:bg-zinc-900 w-full ${action === 'RESCHEDULE' ? 'max-w-2xl' : 'max-w-md'} rounded-2xl shadow-xl border border-gray-200 dark:border-zinc-800 overflow-hidden animate-in zoom-in-95 duration-200`}>

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        {action === 'CONFIRM' && <><CheckCircle className="text-lime-600" size={20} /> Confirmar Asistencia</>}
                        {action === 'CANCEL' && <><Ban className="text-red-500" size={20} /> Cancelar Cita</>}
                        {action === 'RESCHEDULE' && <><Calendar className="text-lime-600" size={20} /> Reprogramar Cita</>}
                    </h3>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    <div className="mb-6 p-4 bg-gray-50 dark:bg-zinc-800 rounded-xl border border-gray-100 dark:border-zinc-700">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Paciente</p>
                                <p className="font-semibold text-gray-900 dark:text-white">{appointment.patientName}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Cita Actual</p>
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {/* Fix: Adjust for timezone offset to display correct date */
                                        format(new Date(new Date(appointment.date).getTime() + new Date(appointment.date).getTimezoneOffset() * 60000), "dd/MM/yyyy")} • {appointment.startTime}
                                </p>
                            </div>
                        </div>
                    </div>

                    {action === 'CONFIRM' && (
                        <div className="text-center space-y-4">
                            {!appointment.isPaid ? (
                                <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2 justify-center">
                                    <AlertCircle size={16} />
                                    <span>Esta cita no ha sido pagada. No se puede confirmar.</span>
                                </div>
                            ) : (
                                <p className="text-gray-600 dark:text-gray-400">
                                    ¿Confirmas que el paciente ha llegado o confirmado su asistencia para esta cita?
                                </p>
                            )}

                            <div className="flex justify-center gap-3 pt-2">
                                <button onClick={onClose} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg font-medium">Cancelar</button>
                                <button
                                    onClick={handleConfirm}
                                    disabled={loading || !appointment.isPaid}
                                    className="px-6 py-2 bg-lime-600 hover:bg-lime-700 text-white rounded-lg font-bold shadow-lg shadow-lime-600/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={18} />}
                                    Confirmar
                                </button>
                            </div>
                        </div>
                    )}

                    {action === 'NO_SHOW' && (
                        <div className="text-center space-y-4">
                            <p className="text-gray-600 dark:text-gray-400">
                                ¿Estás seguro de marcar que el paciente <strong>{appointment?.patientName}</strong> no asistió a su cita?
                            </p>
                            <div className="flex justify-center gap-3 pt-2">
                                <button onClick={onClose} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg font-medium">Cancelar</button>
                                <button
                                    onClick={handleNoShow}
                                    disabled={loading}
                                    className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold shadow-lg shadow-orange-600/20 flex items-center gap-2"
                                >
                                    {loading ? <Loader2 className="animate-spin" size={18} /> : <Ban size={18} />}
                                    Marcar No Asistió
                                </button>
                            </div>
                        </div>
                    )}

                    {action === 'CANCEL' && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Motivo de cancelación</label>
                                <textarea
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-red-500 outline-none resize-none"
                                    rows={3}
                                    placeholder="Indica por qué se cancela la cita..."
                                    value={cancellationReason}
                                    onChange={(e) => setCancellationReason(e.target.value)}
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button onClick={onClose} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg font-medium">Volver</button>
                                <button
                                    onClick={handleCancel}
                                    disabled={loading || !cancellationReason}
                                    className="px-6 py-2 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-lg font-bold flex items-center gap-2 disabled:opacity-50"
                                >
                                    {loading ? <Loader2 className="animate-spin" size={18} /> : <Ban size={18} />}
                                    Cancelar Cita
                                </button>
                            </div>
                        </div>
                    )}

                    {action === 'RESCHEDULE' && (
                        <div className="space-y-6">
                            {rescheduleError && (
                                <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2">
                                    <AlertCircle size={16} /> {rescheduleError}
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Nueva Fecha</label>
                                    <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                                        <CustomCalendar
                                            value={newDate ? parse(newDate, 'yyyy-MM-dd', new Date()) : null}
                                            onChange={(d) => {
                                                const dateStr = format(d, 'yyyy-MM-dd');
                                                setNewDate(dateStr);
                                                setNewTime("");
                                                fetchSlots(dateStr);
                                            }}
                                            doctorId={appointment.doctorId.toString()}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Horarios Disponibles {newDate && <span className="text-gray-400 font-normal">({format(parse(newDate, 'yyyy-MM-dd', new Date()), 'dd/MM')})</span>}
                                    </label>

                                    {!newDate ? (
                                        <div className="text-center py-10 text-gray-400 text-sm bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                            Selecciona una fecha primero
                                        </div>
                                    ) : isFetchingSlots ? (
                                        <div className="py-10 text-center">
                                            <Loader2 className="animate-spin mx-auto text-lime-600" />
                                        </div>
                                    ) : availableSlots.length === 0 ? (
                                        <div className="p-4 bg-yellow-50 text-yellow-700 rounded-xl text-sm">No hay horarios.</div>
                                    ) : (
                                        <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
                                            {availableSlots.map((slot, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => setNewTime(slot.start)}
                                                    disabled={!slot.available}
                                                    className={`px-2 py-2 text-sm font-medium rounded-lg border transition-all ${newTime === slot.start
                                                        ? 'bg-lime-600 text-white border-lime-600 shadow-md'
                                                        : 'bg-white text-gray-600 border-gray-200 hover:border-lime-400 hover:text-lime-600'
                                                        } ${!slot.available && 'opacity-50 cursor-not-allowed bg-gray-50'}`}
                                                >
                                                    {slot.start}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                                <div className="text-sm">
                                    {newDate && newTime && (
                                        <span className="flex items-center gap-2 text-lime-700 font-medium bg-lime-50 px-3 py-1 rounded-full border border-lime-100">
                                            <ArrowRight size={14} />
                                            {format(new Date(new Date(newDate).getTime() + new Date(newDate).getTimezoneOffset() * 60000), "dd MMM")} a las {newTime}
                                        </span>
                                    )}
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={onClose} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg font-medium">Cancelar</button>
                                    <button
                                        onClick={handleReschedule}
                                        disabled={loading || !newDate || !newTime}
                                        className="px-6 py-2 bg-lime-600 hover:bg-lime-700 text-white rounded-lg font-bold shadow-lg shadow-lime-600/20 flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {loading ? <Loader2 className="animate-spin" size={18} /> : <Calendar size={18} />}
                                        Reprogramar
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>,
        document.body
    );
}
