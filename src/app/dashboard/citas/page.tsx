"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Clock, User as UserIcon, Plus, FileText, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/ui/Modal";
import { AppointmentDetailsModal } from "./components/AppointmentDetailsModal";
import { toast } from "sonner";

interface Appointment {
    id: number;
    date: string;
    startTime: string;
    endTime: string;
    type: string;
    status: string;
    doctorName?: string;
    reason?: string;
    doctorSpecialty?: string; // If available or we assume General
}

export default function AppointmentsPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [isLoadingAppointments, setIsLoadingAppointments] = useState(true);

    // Modals State
    const [reasonModal, setReasonModal] = useState<{ isOpen: boolean; text: string }>({ isOpen: false, text: "" });

    // Details Modal
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [selectedAppointmentDetails, setSelectedAppointmentDetails] = useState<any>(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login?redirect=/dashboard/citas");
            return;
        }

        if (user) {
            fetchAppointments();
        }
    }, [user, loading, router]);

    const fetchAppointments = async () => {
        if (!user) return;
        try {
            const patientId = (user as any).patientId;

            if (!patientId && user.role === 'PACIENTE') {
                console.error("User has no patientId");
                setIsLoadingAppointments(false);
                return;
            }

            const queryParam = user.role === 'MEDICO'
                ? `doctorId=${(user as any).employeeId}`
                : `patientId=${patientId}`;

            const response = await fetch(`/api/appointments?${queryParam}`);
            if (response.ok) {
                const data = await response.json();
                setAppointments(data);
            }
        } catch (error) {
            console.error("Error fetching appointments:", error);
        } finally {
            setIsLoadingAppointments(false);
        }
    };

    const handleOpenDetails = async (appointmentId: number) => {
        setDetailsModalOpen(true);
        setLoadingDetails(true);
        setSelectedAppointmentDetails(null);

        try {
            const res = await fetch(`/api/patient/appointments/${appointmentId}`);
            if (res.ok) {
                const data = await res.json();
                setSelectedAppointmentDetails(data);
            } else {
                toast.error("Error al cargar detalles");
                setDetailsModalOpen(false);
            }
        } catch (error) {
            console.error(error);
            toast.error("Error de conexión");
            setDetailsModalOpen(false);
        } finally {
            setLoadingDetails(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-600"></div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 md:p-8 animate-in fade-in duration-500">
            <div className="max-w-5xl mx-auto space-y-8">
                {/* Header section with refined typography */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Mis Citas</h1>
                        <p className="text-gray-500 font-medium mt-1">Gestiona tus consultas médicas programadas</p>
                    </div>
                    <div>
                        <button
                            onClick={() => router.push("/dashboard/citas/nueva")}
                            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-lime-500/95 backdrop-blur-md text-white font-bold shadow-[0_8px_20px_rgba(132,204,22,0.3)] border border-lime-400/50 hover:bg-lime-600 hover:scale-[1.02] transition-all focus:ring-2 focus:ring-lime-300"
                        >
                            <Plus size={20} />
                            Nueva Cita
                        </button>
                    </div>
                </div>

                {isLoadingAppointments ? (
                    <div className="text-center py-20 bg-white/40 backdrop-blur-md rounded-[2.5rem] border border-white/50">
                        <div className="w-10 h-10 border-4 border-lime-500/30 border-t-lime-500 rounded-full animate-spin mx-auto"></div>
                        <p className="mt-4 text-gray-500 font-bold uppercase tracking-widest text-[10px]">Cargando tu historial...</p>
                    </div>
                ) : appointments.length === 0 ? (
                    <div className="bg-white/40 backdrop-blur-md rounded-[2.5rem] p-12 sm:p-20 text-center border border-white/50 shadow-[0_8px_32px_0_rgba(0,0,0,0.06)]">
                        <div className="mx-auto w-20 h-20 bg-white/60 backdrop-blur-sm rounded-full flex items-center justify-center mb-6 border border-white/80 shadow-inner">
                            <Calendar size={36} className="text-lime-600 opacity-60" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 tracking-tight">No tienes citas programadas</h3>
                        <p className="text-gray-500 mt-2 mb-8 max-w-sm mx-auto font-medium">Agenda tu primera consulta con nuestros especialistas hoy mismo.</p>
                        <button
                            onClick={() => router.push("/dashboard/citas/nueva")}
                            className="px-8 py-4 bg-lime-500 hover:bg-lime-600 text-white font-black rounded-2xl shadow-[0_8px_20px_rgba(132,204,22,0.3)] transition-all hover:scale-[1.05]"
                        >
                            Agendar Cita
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-5">
                        {appointments.map((apt) => {
                            const isCompleted = ['ATENDIDA', 'COMPLETADA', 'FINALIZADA'].includes(apt.status);
                            return (
                                <div key={apt.id} className="group bg-white/40 backdrop-blur-md p-6 rounded-[2rem] shadow-[0_4px_16px_0_rgba(0,0,0,0.02)] border border-white/50 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all hover:bg-white/70 hover:border-white/80 hover:shadow-lg hover:scale-[1.01]">
                                    <div className="flex items-start gap-5">
                                        <div className="w-14 h-14 bg-white/80 backdrop-blur-xl rounded-2xl border border-white shadow-sm flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                            <Calendar className="text-lime-600" size={28} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <h3 className="font-black text-gray-900 text-lg uppercase tracking-tight">
                                                    {apt.type}
                                                </h3>
                                                <div className="md:hidden">
                                                    <StatusBadge status={apt.status} />
                                                </div>
                                            </div>
                                            <p className="text-gray-500 font-bold text-sm mt-0.5">
                                                Dr. {apt.doctorName || 'No asignado'}
                                            </p>
                                            
                                            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-4">
                                                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/50 rounded-xl border border-white/60 text-xs font-bold text-gray-600">
                                                    <Calendar size={14} className="text-lime-600" />
                                                    {String(new Date(apt.date).getUTCDate()).padStart(2, '0')}/{String(new Date(apt.date).getUTCMonth() + 1).padStart(2, '0')}/{new Date(apt.date).getUTCFullYear()}
                                                </div>
                                                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/50 rounded-xl border border-white/60 text-xs font-bold text-gray-600">
                                                    <Clock size={14} className="text-lime-600" />
                                                    {apt.startTime} - {apt.endTime}
                                                </div>
                                            </div>

                                            {apt.reason && (
                                                <button
                                                    onClick={() => setReasonModal({ isOpen: true, text: apt.reason! })}
                                                    className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-lime-600 transition-colors"
                                                >
                                                    <FileText size={14} />
                                                    Ver motivo de consulta
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-4">
                                        <div className="hidden md:block">
                                            <StatusBadge status={apt.status} />
                                        </div>

                                        {isCompleted ? (
                                            <button
                                                onClick={() => handleOpenDetails(apt.id)}
                                                className="w-full md:w-auto text-[11px] font-black uppercase tracking-widest text-lime-700 bg-lime-500/10 backdrop-blur-sm hover:bg-lime-500/20 border border-lime-500/20 shadow-sm px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                                            >
                                                Ver Resultados <ArrowRight size={14} />
                                            </button>
                                        ) : (
                                            <div className="h-10 hidden md:block" /> // Spacer
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Reason Modal */}
            <Modal
                isOpen={reasonModal.isOpen}
                onClose={() => setReasonModal({ ...reasonModal, isOpen: false })}
                title="Motivo de Consulta"
            >
                <div className="p-6">
                    <p className="text-gray-800 text-lg sm:text-xl font-medium italic bg-white/50 backdrop-blur-sm p-6 sm:p-8 rounded-[2rem] border border-white/60 shadow-inner text-center leading-relaxed">
                        "{reasonModal.text}"
                    </p>
                </div>
            </Modal>

            {/* Details Modal */}
            <AppointmentDetailsModal
                isOpen={detailsModalOpen}
                onClose={() => setDetailsModalOpen(false)}
                appointment={selectedAppointmentDetails}
                loading={loadingDetails}
            />
        </div>
    );
}
