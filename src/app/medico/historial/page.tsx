"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Search, Calendar, FileText, ArrowRight, ScanLine } from "lucide-react";
import { toast } from "sonner";

export default function DoctorHistoryPage() {
    const { user } = useAuth();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [appointments, setAppointments] = useState<any[]>([]);

    // Filters
    const [search, setSearch] = useState("");
    const [date, setDate] = useState("");

    const fetchHistory = async () => {
        if (!(user as any)?.id) return;

        setLoading(true);
        try {
            const queryParams = new URLSearchParams({
                userId: (user as any).id.toString(),
            });

            if (search) queryParams.append("search", search);
            if (date) queryParams.append("date", date);

            const res = await fetch(`/api/doctor/history?${queryParams.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setAppointments(data);
            } else {
                toast.error("Error al cargar historial");
            }
        } catch (error) {
            console.error("Error fetching history:", error);
            toast.error("Error de conexión");
        } finally {
            setLoading(false);
        }
    };

    // Initial load and filter changes
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchHistory();
        }, 500); // Debounce search
        return () => clearTimeout(timeoutId);
    }, [search, date, user]);

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <FileText className="text-lime-500" />
                    Historial de Citas
                </h1>
                <p className="text-gray-500 dark:text-gray-400">Consulta los pacientes atendidos anteriormente.</p>
            </header>

            {/* Filters */}
            <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, apellido o cédula..."
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 focus:ring-2 focus:ring-lime-500 outline-none transition-all"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="date"
                        className="pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 focus:ring-2 focus:ring-lime-500 outline-none transition-all"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                    />
                </div>
            </div>

            {/* List */}
            {loading ? (
                <div className="text-center py-12 text-gray-500">Cargando historial...</div>
            ) : appointments.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-xl border border-dashed border-gray-200 dark:border-zinc-800">
                    <FileText className="mx-auto text-gray-300 mb-2" size={32} />
                    <p className="text-gray-500">No se encontraron citas con estos criterios.</p>
                </div>
            ) : (
                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-zinc-800/50 text-gray-500 font-medium border-b border-gray-200 dark:border-zinc-800">
                            <tr>
                                <th className="px-6 py-4">Fecha / Hora</th>
                                <th className="px-6 py-4">Paciente</th>
                                <th className="px-6 py-4">Diagnóstico</th>
                                <th className="px-6 py-4 text-right">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                            {appointments.map((appt) => (
                                <tr key={appt.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-900 dark:text-white">
                                            {new Date(appt.fecha).toLocaleDateString('es-VE', { timeZone: 'UTC' })}
                                        </div>
                                        <div className="text-xs text-gray-500">{appt.hora}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-900 dark:text-white">
                                            {appt.paciente.nombre}
                                        </div>
                                        <div className="text-xs text-gray-500 flex items-center gap-1">
                                            <ScanLine size={12} /> {appt.paciente.documento}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="truncate max-w-[200px] block text-gray-600 dark:text-gray-300" title={appt.diagnostico}>
                                            {appt.diagnostico}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => router.push(`/medico/citas/${appt.id}`)}
                                            className="inline-flex items-center gap-1 text-lime-600 font-bold hover:text-lime-700 transition-colors text-xs bg-lime-50 dark:bg-lime-900/20 px-3 py-1.5 rounded-full"
                                        >
                                            Ver Historia <ArrowRight size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
