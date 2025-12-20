"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Clock, User as UserIcon, Plus } from "lucide-react";
import Link from "next/link";

interface Appointment {
    id: number;
    date: string;
    startTime: string;
    endTime: string;
    type: string;
    status: string;
    doctor: {
        firstName: string;
        lastName: string;
        specialty: string;
    };
}

export default function AppointmentsPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [isLoadingAppointments, setIsLoadingAppointments] = useState(true);

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
            // Determine query param based on role
            // For now assuming Patient dashboard, so patientId is relevant.
            // Ideally backend handles "me" or we use the profile ID from user context.
            // If user.patientId is present we use it. 
            // NOTE: RegisterUser ensures patientId is not null for PATIENT role.

            // Using a safe cast or check would be better, but assuming user context has profile IDs if mapped.
            const patientId = (user as any).patientId;

            if (!patientId && user.role === 'PACIENTE') {
                // Fallback or retry? 
                // If no patientId, maybe user is not fully set up?
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

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
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
                    <Link
                        href="/dashboard/citas/nueva"
                        className="inline-flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                    >
                        <Plus size={20} />
                        Nueva Cita
                    </Link>
                </div>

                {isLoadingAppointments ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                        <p className="mt-2 text-gray-500">Cargando citas...</p>
                    </div>
                ) : appointments.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
                        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <Calendar size={32} className="text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">No tienes citas programadas</h3>
                        <p className="text-gray-500 mt-1 mb-6">Agenda tu primera consulta con nuestros especialistas.</p>
                        <Link
                            href="/dashboard/citas/nueva"
                            className="inline-block bg-primary-600 text-white px-6 py-2.5 rounded-lg hover:bg-primary-700 transition-colors"
                        >
                            Agendar Cita
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {appointments.map((apt) => (
                            <div key={apt.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <Calendar className="text-primary-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">
                                            {apt.type} - {apt.doctor?.specialty || 'Consulta General'}
                                        </h3>
                                        <p className="text-gray-600 text-sm">
                                            Dr. {apt.doctor?.firstName} {apt.doctor?.lastName}
                                        </p>
                                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <Calendar size={14} />
                                                {new Date(apt.date).toLocaleDateString()}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock size={14} />
                                                {apt.startTime} - {apt.endTime}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium 
                                        ${apt.status === 'PROGRAMADA' ? 'bg-blue-100 text-blue-700' :
                                            apt.status === 'COMPLETADA' ? 'bg-green-100 text-green-700' :
                                                'bg-gray-100 text-gray-700'}`}>
                                        {apt.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
