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
        const styles = {
            PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
            CONFIRMED: "bg-blue-100 text-blue-800 border-blue-200",
            CANCELLED: "bg-red-100 text-red-800 border-red-200",
            COMPLETED: "bg-green-100 text-green-800 border-green-200",
        };
        const label = {
            PENDING: "Pendiente",
            CONFIRMED: "Confirmada",
            CANCELLED: "Cancelada",
            COMPLETED: "Completada",
        };
        // @ts-ignore
        return <span className={`px-2 py-1 rounded-full text-xs font-medium border ${styles[status]}`}>{label[status]}</span>;
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
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800 overflow-hidden">
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
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-zinc-800 dark:text-gray-300">
                                <tr>
                                    <th className="px-6 py-3">Fecha y Hora</th>
                                    <th className="px-6 py-3">Paciente</th>
                                    <th className="px-6 py-3">Doctor</th>
                                    <th className="px-6 py-3">Motivo</th>
                                    <th className="px-6 py-3">Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((appointment) => (
                                    <tr key={appointment.id} className="border-b dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800/50">
                                        <td className="px-6 py-4 font-medium">
                                            <div className="flex flex-col">
                                                <span className="text-gray-900 dark:text-white">
                                                    {format(new Date(appointment.datetime), "dd 'de' MMMM", { locale: es })}
                                                </span>
                                                <span className="text-gray-500 text-xs">
                                                    {format(new Date(appointment.datetime), "h:mm a")}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="bg-blue-100 p-1 rounded-full text-blue-600">
                                                    <User size={14} />
                                                </div>
                                                <span className="font-medium">{appointment.patientName}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="bg-purple-100 p-1 rounded-full text-purple-600">
                                                    <Stethoscope size={14} />
                                                </div>
                                                <span className="font-medium">Dr. {appointment.doctorName}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 truncate max-w-[200px]">
                                            {appointment.reason || "Sin motivo"}
                                        </td>
                                        <td className="px-6 py-4">
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
