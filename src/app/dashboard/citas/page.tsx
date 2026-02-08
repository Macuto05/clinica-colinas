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
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-5xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Mis Citas</h1>
                        <p className="text-gray-600">Gestiona tus consultas médicas</p>
                    </div>
                    <Button
                        onClick={() => router.push("/dashboard/citas/nueva")}
                        leftIcon={<Plus size={20} />}
                    >
                        Nueva Cita
                    </Button>
                </div>

                {isLoadingAppointments ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lime-600 mx-auto"></div>
                        <p className="mt-2 text-gray-500">Cargando citas...</p>
                    </div>
                ) : appointments.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
                        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <Calendar size={32} className="text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">No tienes citas programadas</h3>
                        <p className="text-gray-500 mt-1 mb-6">Agenda tu primera consulta con nuestros especialistas.</p>
                        <Button
                            onClick={() => router.push("/dashboard/citas/nueva")}
                        >
                            Agendar Cita
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {appointments.map((apt) => {
                            const isCompleted = ['ATENDIDA', 'COMPLETADA', 'FINALIZADA'].includes(apt.status);
                            return (
                                <div key={apt.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:shadow-md">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-lime-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <Calendar className="text-lime-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 text-lg uppercase">
                                                {apt.type}
                                            </h3>
                                            <p className="text-gray-600 text-sm">
                                                Dr. {apt.doctorName || 'No asignado'}
                                            </p>
                                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <Calendar size={14} />
                                                    {/* Parsing ISO string manually to avoid timezone shift, Format: DD/MM/YYYY */}
                                                    {String(new Date(apt.date).getUTCDate()).padStart(2, '0')}/{String(new Date(apt.date).getUTCMonth() + 1).padStart(2, '0')}/{new Date(apt.date).getUTCFullYear()}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock size={14} />
                                                    {apt.startTime} - {apt.endTime}
                                                </span>
                                            </div>
                                            {/* Reason with Icon */}
                                            {apt.reason && (
                                                <div className="mt-2">
                                                    <button
                                                        onClick={() => setReasonModal({ isOpen: true, text: apt.reason! })}
                                                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-lime-600 transition-colors group"
                                                        title="Ver motivo de consulta"
                                                    >
                                                        <span className="italic">Motivo:</span>
                                                        <FileText size={14} className="group-hover:scale-110 transition-transform" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-3">
                                        <StatusBadge status={apt.status} />

                                        {/* Action for Completed Appointments */}
                                        {isCompleted && (
                                            <button
                                                onClick={() => handleOpenDetails(apt.id)}
                                                className="text-xs font-bold text-lime-600 bg-lime-50 hover:bg-lime-100 px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors"
                                            >
                                                Ver Resultados <ArrowRight size={12} />
                                            </button>
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
                <div className="p-4">
                    <p className="text-gray-700 dark:text-gray-300 text-lg italic bg-gray-50 dark:bg-zinc-800 p-6 rounded-xl border border-gray-100 dark:border-zinc-700 text-center">
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
