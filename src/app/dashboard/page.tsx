"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Calendar, PlusCircle, User as UserIcon } from "lucide-react";

export default function DashboardPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push("/login");
            } else if (user.role === 'ADMIN') {
                router.push("/admin");
            } else if (user.role === 'DOCTOR') {
                router.push("/dashboard/doctor");
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

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h1 className="text-2xl font-bold text-gray-900">
                    Hola, {user?.firstName} 👋
                </h1>
                <p className="text-gray-600 mt-1">
                    Bienvenido a tu panel de salud. ¿Qué te gustaría hacer hoy?
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Quick Action: New Appointment */}
                <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl p-6 text-white shadow-lg shadow-primary-600/20 relative overflow-hidden group cursor-pointer transition-transform hover:scale-[1.02]" onClick={() => router.push("/dashboard/citas/nueva")}>
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Calendar size={100} />
                    </div>
                    <div className="relative z-10">
                        <div className="bg-white/20 w-12 h-12 rounded-xl flex items-center justify-center mb-4 backdrop-blur-sm">
                            <PlusCircle size={24} className="text-white" />
                        </div>
                        <h3 className="text-xl font-bold mb-1">Nueva Cita</h3>
                        <p className="text-primary-100 text-sm mb-4">Agenda una consulta con nuestros especialistas.</p>
                        <button className="bg-white text-primary-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary-50 transition-colors w-full sm:w-auto">
                            Reservar Ahora
                        </button>
                    </div>
                </div>

                {/* Quick Action: My Appointments */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:border-primary-200 transition-colors cursor-pointer group" onClick={() => router.push("/dashboard/citas")}>
                    <div className="bg-primary-50 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary-100 transition-colors">
                        <Calendar size={24} className="text-primary-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">Mis Citas</h3>
                    <p className="text-gray-500 text-sm">Revisa tus próximas consultas y el historial de atenciones.</p>
                </div>

                {/* Quick Action: Profile */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:border-primary-200 transition-colors cursor-pointer group" onClick={() => router.push("/dashboard/perfil")}>
                    <div className="bg-primary-50 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary-100 transition-colors">
                        <UserIcon size={24} className="text-primary-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">Mi Perfil</h3>
                    <p className="text-gray-500 text-sm">Actualiza tus datos personales y de contacto.</p>
                </div>
            </div>

            {/* Recent Activity / Next Appointment Placeholder */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Próxima Cita</h2>
                <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <Calendar size={48} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500 font-medium">No tienes citas programadas próximamente</p>
                    <button
                        onClick={() => router.push("/dashboard/citas/nueva")}
                        className="text-primary-600 text-sm font-semibold hover:underline mt-2"
                    >
                        Agendar una cita
                    </button>
                </div>
            </div>
        </div>
    );
}
