"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, User, Stethoscope, Search, Loader2 } from "lucide-react";
import { AppointmentStatus } from "@/domain/entities/Appointment";

interface AppointmentWithDetails {
    id: number;
    datetime: string; // JSON date
    status: AppointmentStatus;
    type: string;
    reason?: string;
    patientName?: string;
    doctorName?: string;
}

export default function AdminAppointmentsPage() {
    const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchAppointments();
    }, []);

    const fetchAppointments = async () => {
        try {
            const res = await fetch("/api/admin/appointments");
            if (res.ok) {
                const data = await res.json();
                setAppointments(data.appointments);
            } else {
                console.error("Failed to fetch");
            }
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const StatusBadge = ({ status }: { status: string }) => {
        const styles: Record<string, string> = {
            PROGRAMADA: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800",
            CONFIRMADA: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
            CANCELADA: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
            ATENDIDA: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
            NO_ASISTIO: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-zinc-800 dark:text-gray-400 dark:border-zinc-700",
        };

        return (
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status] || styles.PROGRAMADA}`}>
                {status}
            </span>
        );
    };

    const filtered = appointments.filter(apt =>
        apt.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.doctorName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Calendar className="text-lime-600" />
                        Gestión de Citas
                    </h1>
                    <p className="text-gray-500 text-sm">Visualiza y gestiona todas las citas de la clínica.</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por paciente o doctor..."
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 focus:ring-2 focus:ring-lime-500 outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900 min-h-[400px]">
                {isLoading ? (
                    <div className="p-12 flex justify-center">
                        <Loader2 className="animate-spin text-lime-600" size={32} />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        No se encontraron citas.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-800 text-sm">
                            <thead className="bg-gray-50 dark:bg-zinc-800">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Fecha y Hora</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Paciente</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Doctor</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Tipo</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Motivo</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white dark:divide-zinc-800 dark:bg-zinc-900">
                                {filtered.map((appointment) => (
                                    <tr key={appointment.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-gray-900 dark:text-white">
                                                    {format(new Date(appointment.datetime), "dd 'de' MMMM", { locale: es })}
                                                </span>
                                                <span className="text-gray-500 dark:text-gray-400 text-xs">
                                                    {format(new Date(appointment.datetime), "h:mm a")}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="font-medium text-gray-900 dark:text-white">{appointment.patientName}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="font-medium text-gray-900 dark:text-white">Dr. {appointment.doctorName}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800">
                                                {appointment.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                                            {appointment.reason || "Sin motivo"}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <StatusBadge status={appointment.status} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );

}
