"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, Search, Loader2, Plus, ChevronLeft, ChevronRight } from "lucide-react";
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

interface PaginationData {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    appointments: AppointmentWithDetails[];
}


export default function AdminAppointmentsPage() {
    const router = useRouter();
    const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchAppointments();
    }, [page, searchTerm]);

    const fetchAppointments = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                pageSize: pageSize.toString(),
            });
            if (searchTerm) params.append("search", searchTerm);

            const res = await fetch(`/api/admin/citas?${params}`);
            if (res.ok) {
                const data: PaginationData = await res.json();
                setAppointments(data.appointments);
                setTotalPages(data.totalPages);
            }
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setIsLoading(false);
        }
    };


    // The DB stores Venezuela local time as a UTC-naive timestamp.
    // Prisma tags it with Z (UTC), so new Date() would subtract 4h for VEN browsers.
    // We read the UTC components directly (they represent VEN local time) and
    // rebuild a local Date so format() shows the correct stored time.
    const parseApptDate = (isoStr: string): Date => {
        const d = new Date(isoStr);
        return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes());
    };

    const StatusBadge = ({ status }: { status: string }) => {
        const styles: Record<string, string> = {
            PROGRAMADA: "bg-amber-50/50 text-amber-700 border-amber-200/50",
            CONFIRMADA: "bg-blue-50/50 text-blue-700 border-blue-200/50",
            CANCELADA: "bg-red-50/50 text-red-700 border-red-200/50",
            ATENDIDA: "bg-green-50/50 text-green-700 border-green-200/50",
            NO_ASISTIO: "bg-gray-50/50 text-gray-700 border-gray-200/50",
        };

        const dots: Record<string, string> = {
            PROGRAMADA: "bg-amber-500",
            CONFIRMADA: "bg-blue-500",
            CANCELADA: "bg-red-500",
            ATENDIDA: "bg-green-500",
            NO_ASISTIO: "bg-gray-400",
        };

        return (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm ${styles[status] || styles.PROGRAMADA}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${dots[status] || "bg-gray-400"}`} />
                {status}
            </span>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white/40 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/50 shadow-sm">
                <div className="flex items-center gap-6">
                    <div className="p-4 bg-lime-500 text-white rounded-3xl shadow-lg shadow-lime-200/50 -rotate-3 transition-transform hover:rotate-0 duration-500">
                        <Calendar size={28} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Gestión de Citas</h1>
                        <p className="text-gray-500 font-medium mt-1">Monitoreo y administración global de la agenda clínica.</p>
                    </div>
                </div>
                <button
                    onClick={() => router.push("/admin/citas/nueva")}
                    className="flex items-center gap-2 px-6 py-3 bg-lime-500 text-white rounded-2xl font-bold shadow-lg hover:bg-lime-600 transition-colors"
                >
                    <Plus size={20} />
                    Nueva Cita
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white/40 backdrop-blur-md p-6 rounded-[2rem] border border-white/50 shadow-sm">
                <div className="relative max-w-md group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-lime-500 transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por paciente o doctor..."
                        className="w-full pl-11 pr-4 py-3 rounded-2xl border border-white/60 bg-white/50 focus:bg-white/80 focus:ring-4 focus:ring-lime-500/10 outline-none transition-all placeholder:text-gray-400/60 shadow-inner text-sm font-medium"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setPage(1);
                        }}
                    />
                </div>
            </div>

            {/* Table Container */}
            <div className="bg-white/40 backdrop-blur-md border border-white/50 rounded-[2.5rem] overflow-hidden shadow-[0_8px_32px_0_rgba(0,0,0,0.04)]">
                {isLoading ? (
                    <div className="p-40 flex flex-col items-center justify-center gap-4">
                        <Loader2 className="animate-spin text-lime-500" size={40} strokeWidth={2.5} />
                        <p className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Cargando agenda...</p>
                    </div>
                ) : appointments.length === 0 ? (
                    <div className="py-32 text-center">
                        <div className="bg-gray-50/50 border border-gray-100/50 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4">
                            <Calendar className="text-gray-300" size={24} />
                        </div>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                            No se encontraron citas registradas
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead>
                                    <tr className="bg-white/30 border-b border-white/40">
                                        <th scope="col" className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-gray-500/80 cursor-default">Fecha y Hora</th>
                                        <th scope="col" className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-gray-500/80 cursor-default">Paciente</th>
                                        <th scope="col" className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-gray-500/80 cursor-default">Doctor</th>
                                        <th scope="col" className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-gray-500/80 cursor-default">Tipo</th>
                                        <th scope="col" className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-gray-500/80 cursor-default">Motivo</th>
                                        <th scope="col" className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-gray-500/80 cursor-default">Estado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/40">
                                    {appointments.map((appointment) => (
                                        <tr key={appointment.id} className="hover:bg-white/60 transition-colors group">
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-gray-900 tracking-tight">
                                                        {format(parseApptDate(appointment.datetime), "dd 'de' MMMM", { locale: es })}
                                                    </span>
                                                    <span className="text-[10px] font-black text-lime-600 uppercase tracking-widest mt-0.5">
                                                        {format(parseApptDate(appointment.datetime), "h:mm a")}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                <span className="text-sm font-black text-gray-900 tracking-tight">{appointment.patientName}</span>
                                            </td>
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                <span className="text-sm font-black text-gray-900 tracking-tight">Dr. {appointment.doctorName}</span>
                                            </td>
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-purple-50/50 text-purple-700 border border-purple-200/50 shadow-sm">
                                                    {appointment.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-gray-500 font-bold text-sm truncate max-w-[200px]">
                                                {appointment.reason || "Sin motivo especificado"}
                                            </td>
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                <StatusBadge status={appointment.status} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="bg-white/20 px-6 py-4 flex items-center justify-between border-t border-white/40">
                            <p className="text-xs font-bold text-gray-600 uppercase tracking-widest">
                                Página {page} de {totalPages}
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPage(Math.max(1, page - 1))}
                                    disabled={page === 1}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/50 border border-white/60 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/70 transition-colors"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <button
                                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                                    disabled={page === totalPages}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/50 border border-white/60 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/70 transition-colors"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

        </div>
    );
}

