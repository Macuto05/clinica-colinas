"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, PlusCircle, User as UserIcon, CreditCard } from "lucide-react";

export default function DashboardPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [nextAppointment, setNextAppointment] = useState<any>(null);
    const [isLoadingNextAppt, setIsLoadingNextAppt] = useState(true);

    useEffect(() => {
        const fetchNextAppointment = async () => {
            if (!user || user.role !== 'PACIENTE') {
                setIsLoadingNextAppt(false);
                return;
            }
            try {
                // Fetch appointments for patient
                // Note: We're reusing the endpoint which returns all appointments ordered by date descending.
                // ideally we'd want ascending for "next" appointment, but we can filter on client for now or grab the first pending one.
                // Actually, the repo orders by date DESC. The "next" appointment is usually the LAST one if filtering by future date, or the FIRST one if we sort differently.
                // Let's fetch all and find the first future one.
                const patientId = (user as any).patientId;
                if (!patientId) { setIsLoadingNextAppt(false); return; }

                const response = await fetch(`/api/appointments?patientId=${patientId}`);
                if (response.ok) {
                    const data = await response.json();

                    // Filter for future appointments and sort by date ASC (closest first)
                    const now = new Date();
                    const futureAppointments = data.filter((apt: any) => {
                        const aptDate = new Date(apt.date);
                        // Simple check: is date >= today? (ignoring time for simplicity in this check or handling time carefully)
                        // Since apt.date is YYYY-MM-DD from API (but actually ISO string), let's just check if it's not "COMPLETADA" or "CANCELADA" mainly.
                        // Or better, check status 'PROGRAMADA'
                        return apt.status === 'PROGRAMADA' || apt.status === 'PENDING';
                    }).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

                    if (futureAppointments.length > 0) {
                        setNextAppointment(futureAppointments[0]);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch next appointment", error);
            } finally {
                setIsLoadingNextAppt(false);
            }
        };

        if (user) {
            fetchNextAppointment();
        }
    }, [user]);

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push("/login");
            } else if (user.role === 'ADMIN') {
                router.push("/admin");
            } else if (user.role === 'DOCTOR') {
                router.push("/dashboard/doctor");
            } else if (user.role === 'ALMACEN') {
                router.push("/almacen");
            }
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    const firstName = user?.firstName?.split(" ")[0] || "";
    const lastName = user?.lastName?.split(" ")[0] || "";
    const displayName = `${firstName} ${lastName}`.trim() || user?.firstName || "Usuario";

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h1 className="text-2xl font-bold text-gray-900">
                    Hola, {displayName} 👋
                </h1>
                <p className="text-gray-600 mt-1">
                    Bienvenido a tu panel de salud. ¿Qué te gustaría hacer hoy?
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Quick Action: New Appointment */}
                <div className="bg-gradient-to-br from-lime-500 to-lime-600 rounded-2xl p-6 text-white shadow-lg shadow-lime-600/20 relative overflow-hidden group cursor-pointer transition-transform hover:scale-[1.02]" onClick={() => router.push("/dashboard/citas/nueva")}>
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Calendar size={100} />
                    </div>
                    <div className="relative z-10">
                        <div className="bg-white/20 w-12 h-12 rounded-xl flex items-center justify-center mb-4 backdrop-blur-sm">
                            <PlusCircle size={24} className="text-white" />
                        </div>
                        <h3 className="text-xl font-bold mb-1">Nueva Cita</h3>
                        <p className="text-lime-100 text-sm mb-4">Agenda una consulta con nuestros especialistas.</p>
                        <button className="bg-white text-lime-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-lime-50 transition-colors w-full sm:w-auto">
                            Reservar Ahora
                        </button>
                    </div>
                </div>

                {/* Quick Action: My Appointments */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:border-lime-200 transition-colors cursor-pointer group" onClick={() => router.push("/dashboard/citas")}>
                    <div className="bg-lime-50 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:bg-lime-100 transition-colors">
                        <Calendar size={24} className="text-lime-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">Mis Citas</h3>
                    <p className="text-gray-500 text-sm">Revisa tus próximas consultas y el historial de atenciones.</p>
                </div>

                {/* Quick Action: Profile */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:border-lime-200 transition-colors cursor-pointer group" onClick={() => router.push("/dashboard/perfil")}>
                    <div className="bg-lime-50 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:bg-lime-100 transition-colors">
                        <UserIcon size={24} className="text-lime-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">Mi Perfil</h3>
                    <p className="text-gray-500 text-sm">Actualiza tus datos personales y de contacto.</p>
                </div>
            </div>

            {/* Recent Activity / Next Appointment */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Próxima Cita</h2>
                {isLoadingNextAppt ? (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lime-600 mx-auto"></div>
                    </div>
                ) : nextAppointment ? (
                    <div className="bg-lime-50 border border-lime-100 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                            <div className="bg-white p-3 rounded-lg shadow-sm">
                                <Calendar className="text-lime-600" size={24} />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-bold text-gray-900">{nextAppointment.type}</h3>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase
                                        ${nextAppointment.status === 'PROGRAMADA' ? 'bg-blue-100 text-blue-700' :
                                            nextAppointment.status === 'COMPLETADA' ? 'bg-green-100 text-green-700' :
                                                nextAppointment.status === 'CONFIRMADA' ? 'bg-emerald-100 text-emerald-700' :
                                                    'bg-gray-100 text-gray-700'}`}>
                                        {nextAppointment.status}
                                    </span>
                                </div>
                                <p className="text-gray-600 text-sm">Dr. {nextAppointment.doctorName || 'No asignado'}</p>
                                <div className="flex gap-4 mt-2 text-sm text-gray-500">
                                    <span>{String(new Date(nextAppointment.date).getUTCDate()).padStart(2, '0')}/{String(new Date(nextAppointment.date).getUTCMonth() + 1).padStart(2, '0')}/{new Date(nextAppointment.date).getUTCFullYear()}</span>
                                    <span>{nextAppointment.startTime} - {nextAppointment.endTime}</span>
                                </div>
                                {nextAppointment.reason && <p className="text-xs text-gray-500 mt-1 italic">Motivo: {nextAppointment.reason}</p>}
                            </div>
                        </div>
                        <button
                            onClick={() => router.push(`/dashboard/pagos/registrar?citaId=${nextAppointment.id}`)}
                            className="bg-lime-600 text-white font-semibold text-sm px-6 py-2 rounded-lg hover:bg-lime-700 transition-colors shadow-sm flex items-center gap-2"
                        >
                            <CreditCard size={16} />
                            Pagar
                        </button>
                    </div>
                ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <Calendar size={48} className="mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-500 font-medium">No tienes citas programadas próximamente</p>
                        <button
                            onClick={() => router.push("/dashboard/citas/nueva")}
                            className="text-lime-600 text-sm font-semibold hover:underline mt-2"
                        >
                            Agendar una cita
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
