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
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-md animate-in fade-in duration-200">
            <div className={`bg-white/70 backdrop-blur-2xl backdrop-saturate-[1.2] w-full ${action === 'RESCHEDULE' ? 'max-w-5xl' : 'max-w-md'} rounded-[2.5rem] shadow-[0_8px_32px_0_rgba(0,0,0,0.12)] border border-white/60 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200`}>

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/40 bg-white/30 shrink-0">
                    <h3 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
                        {action === 'CONFIRM' && <><CheckCircle className="text-lime-600" size={20} /> Confirmar Asistencia</>}
                        {action === 'CANCEL' && <><Ban className="text-red-500" size={20} /> Cancelar Cita</>}
                        {action === 'RESCHEDULE' && <><Calendar className="text-lime-600" size={20} /> Reprogramar Cita</>}
                    </h3>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-red-500 hover:bg-white/60 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-4 overflow-y-auto flex-1 space-y-4">
                    <div className="mb-3 px-4 py-3 bg-white/40 backdrop-blur-md rounded-2xl border border-white/50 shadow-[0_4px_16px_0_rgba(0,0,0,0.02)]">
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
                                <div className="p-4 bg-red-50/70 border border-red-200/50 text-red-700 rounded-2xl text-sm flex items-center gap-2 justify-center backdrop-blur-sm shadow-sm">
                                    <AlertCircle size={16} />
                                    <span className="font-bold">Esta cita no ha sido pagada. No se puede confirmar.</span>
                                </div>
                            ) : (
                                <p className="text-gray-600 text-sm">
                                    ¿Confirmas que el paciente ha llegado o confirmado su asistencia para esta cita?
                                </p>
                            )}

                            <div className="flex justify-center gap-3 pt-4 border-t border-white/40">
                                <button onClick={onClose} className="flex-1 py-3.5 rounded-2xl bg-white/50 border border-white/60 text-gray-700 font-bold hover:bg-white/80 transition-colors text-sm shadow-sm backdrop-blur-sm outline-none focus:ring-2 focus:ring-gray-300">
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    disabled={loading || !appointment.isPaid}
                                    className="flex-1 py-3.5 rounded-2xl bg-lime-500/95 hover:bg-lime-500 text-white font-bold shadow-[0_8px_20px_rgba(132,204,22,0.3)] backdrop-blur-md border border-lime-400/50 outline-none focus:ring-2 focus:ring-lime-300 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                >
                                    {loading ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={18} />}
                                    Confirmar
                                </button>
                            </div>
                        </div>
                    )}

                    {action === 'NO_SHOW' && (
                        <div className="text-center space-y-4">
                            <p className="text-gray-600 text-sm">
                                ¿Estás seguro de marcar que el paciente <strong>{appointment?.patientName}</strong> no asistió a su cita?
                            </p>
                            <div className="flex justify-center gap-3 pt-4 border-t border-white/40">
                                <button onClick={onClose} className="flex-1 py-3.5 rounded-2xl bg-white/50 border border-white/60 text-gray-700 font-bold hover:bg-white/80 transition-colors text-sm shadow-sm backdrop-blur-sm outline-none focus:ring-2 focus:ring-gray-300">
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleNoShow}
                                    disabled={loading}
                                    className="flex-1 py-3.5 rounded-2xl bg-orange-500/95 hover:bg-orange-500 text-white font-bold shadow-[0_8px_20px_rgba(249,115,22,0.3)] backdrop-blur-md border border-orange-400/50 outline-none focus:ring-2 focus:ring-orange-300 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
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
                                <label className="block text-xs font-bold text-gray-500/80 uppercase tracking-wider mb-2">Motivo de cancelación</label>
                                <textarea
                                    className="w-full px-5 py-3.5 rounded-2xl bg-white/50 border border-white/60 focus:bg-white/80 focus:ring-2 focus:ring-red-500/50 outline-none text-sm font-medium shadow-inner transition-all placeholder:text-gray-400 resize-none"
                                    rows={3}
                                    placeholder="Indica por qué se cancela la cita..."
                                    value={cancellationReason}
                                    onChange={(e) => setCancellationReason(e.target.value)}
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-white/40">
                                <button onClick={onClose} className="flex-1 py-3.5 rounded-2xl bg-white/50 border border-white/60 text-gray-700 font-bold hover:bg-white/80 transition-colors text-sm shadow-sm backdrop-blur-sm outline-none focus:ring-2 focus:ring-gray-300">
                                    Volver
                                </button>
                                <button
                                    onClick={handleCancel}
                                    disabled={loading || !cancellationReason}
                                    className="flex-1 py-3.5 rounded-2xl bg-red-500/95 hover:bg-red-500 text-white font-bold shadow-[0_8px_20px_rgba(239,68,68,0.3)] backdrop-blur-md border border-red-400/50 outline-none focus:ring-2 focus:ring-red-300 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
                                >
                                    {loading ? <Loader2 className="animate-spin" size={18} /> : <Ban size={18} />}
                                    Cancelar Cita
                                </button>
                            </div>
                        </div>
                    )}

                    {action === 'RESCHEDULE' && (
                        <div className="space-y-4">
                            {rescheduleError && (
                                <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2">
                                    <AlertCircle size={16} /> {rescheduleError}
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500/80 uppercase tracking-wider mb-2">Nueva Fecha</label>
                                    <div className="bg-white/50 border border-white/60 rounded-3xl overflow-hidden p-2 shadow-inner backdrop-blur-sm">
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
                                    <label className="block text-xs font-bold text-gray-500/80 uppercase tracking-wider mb-2">
                                        Horarios Disponibles {newDate && <span className="text-gray-400 font-normal normal-case">({format(parse(newDate, 'yyyy-MM-dd', new Date()), 'dd/MM')})</span>}
                                    </label>

                                    {!newDate ? (
                                        <div className="text-center py-10 text-gray-500 text-sm bg-white/40 rounded-3xl border border-dashed border-white/60 backdrop-blur-sm font-medium">
                                            Selecciona una fecha primero
                                        </div>
                                    ) : isFetchingSlots ? (
                                        <div className="py-10 text-center">
                                            <Loader2 className="animate-spin mx-auto text-lime-600" />
                                        </div>
                                    ) : availableSlots.length === 0 ? (
                                        <div className="p-4 bg-yellow-50 text-yellow-700 rounded-2xl text-sm border border-yellow-200/50">No hay horarios.</div>
                                    ) : (
                                        <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
                                            {availableSlots.map((slot, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => setNewTime(slot.start)}
                                                    disabled={!slot.available}
                                                    className={`px-2 py-3 text-sm font-bold rounded-2xl border transition-all ${newTime === slot.start
                                                        ? 'border-lime-500/80 bg-lime-50 text-lime-700 shadow-[0_4px_12px_rgba(132,204,22,0.2)] ring-2 ring-lime-400/20 scale-[1.02]'
                                                        : 'bg-white/40 text-gray-600 border-white/60 hover:bg-white/60 hover:shadow-sm'
                                                        } ${!slot.available && 'opacity-50 cursor-not-allowed bg-white/20 border-white/30 text-gray-400'}`}
                                                >
                                                    {slot.start}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-4 border-t border-white/40 mt-2 bg-white/30 backdrop-blur-sm -mx-6 -mb-4 px-6 py-4">
                                <div className="text-sm">
                                    {newDate && newTime && (
                                        <span className="flex items-center gap-2 text-lime-700 font-bold bg-lime-50/70 px-4 py-2 rounded-full border border-lime-200/50 shadow-sm backdrop-blur-md">
                                            <ArrowRight size={14} />
                                            {format(new Date(new Date(newDate).getTime() + new Date(newDate).getTimezoneOffset() * 60000), "dd MMM")} a las {newTime}
                                        </span>
                                    )}
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={onClose} className="px-6 py-3.5 rounded-2xl bg-white/50 border border-white/60 text-gray-700 font-bold hover:bg-white/80 transition-colors text-sm shadow-sm backdrop-blur-sm outline-none focus:ring-2 focus:ring-gray-300">
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleReschedule}
                                        disabled={loading || !newDate || !newTime}
                                        className="px-6 py-3.5 rounded-2xl bg-lime-500/95 hover:bg-lime-500 text-white font-bold shadow-[0_8px_20px_rgba(132,204,22,0.3)] backdrop-blur-md border border-lime-400/50 outline-none focus:ring-2 focus:ring-lime-300 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
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
