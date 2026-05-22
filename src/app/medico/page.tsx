
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, Clock, User, ArrowRight, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import Link from 'next/link';
import { Modal } from '@/components/ui/Modal';

interface Appointment {
    id: string;
    paciente: {
        id: string;
        nombre: string;
        documento: string;
        edad: number;
    };
    hora: string;
    motivo: string;
    estado: string;
    tipo: string;
    yaAtendida: boolean;
}

export default function DoctorDashboard() {
    const { user } = useAuth();
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);

    const [infoModal, setInfoModal] = useState<{
        isOpen: boolean;
        title: string;
        content: React.ReactNode;
    }>({ isOpen: false, title: "", content: null });

    const openInfoModal = (title: string, content: React.ReactNode) => {
        setInfoModal({ isOpen: true, title, content });
    };

    useEffect(() => {
        if (user) {
            // Depuración del objeto usuario
            console.log("Contexto de Usuario Actual:", user); // VERIFICACIÓN DE DEPURACIÓN
            const userId = (user as any).id || (user as any).userId;

            if (!userId) {
                console.error("User object missing ID:", user);
                setLoading(false);
                return;
            }

            fetch(`/api/doctor/appointments?userId=${userId}&date=${selectedDate}`, { cache: 'no-store' })
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) {
                        setAppointments(data);
                    } else if (data.error) {
                        console.error("API Error:", data.error);
                    } else {
                        console.error("Unexpected API Format:", data);
                    }
                })
                .catch(err => {
                    console.error("Fetch failed:", err);
                })
                .finally(() => setLoading(false));
        }
    }, [user, selectedDate]);

    // Calcular estadísticas de citas
    const stats = {
        total: appointments.length,
        pending: appointments.filter(a => !a.yaAtendida && a.estado !== 'CANCELADA').length,
        done: appointments.filter(a => a.yaAtendida).length
    };

    return (
        <div className="space-y-8">
            {/* Encabezado */}
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Agenda del Día</h2>
                    <div className="flex items-center gap-2 mt-1">
                        <Calendar size={16} className="text-gray-500" />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="bg-transparent text-gray-500 dark:text-gray-400 font-medium hover:bg-gray-100 dark:hover:bg-zinc-800 rounded px-2 py-1 transition-colors outline-none cursor-pointer"
                        />
                    </div>
                </div>

                <div className="flex gap-4">
                    <div className="bg-white dark:bg-zinc-900 p-3 px-5 rounded-xl border border-gray-100 dark:border-zinc-800 shadow-sm text-center">
                        <p className="text-xs text-gray-500 uppercase font-bold">Total</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                    </div>
                    <div className="bg-lime-50 dark:bg-lime-900/20 p-3 px-5 rounded-xl border border-lime-100 dark:border-lime-900/50 shadow-sm text-center">
                        <p className="text-xs text-lime-600 dark:text-lime-400 uppercase font-bold">Pendientes</p>
                        <p className="text-2xl font-bold text-lime-700 dark:text-lime-300">{stats.pending}</p>
                    </div>
                </div>
            </div>

            {/* Agenda List */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-gray-200 dark:border-zinc-800 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Cargando agenda...</div>
                ) : appointments.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        <p>No tienes citas programadas para hoy.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-zinc-800">
                        {appointments.map((app) => (
                            <div key={app.id} className="p-6 flex items-center gap-6 hover:bg-gray-50 dark:hover:bg-zinc-800/30 transition-colors group">
                                {/* Time */}
                                <div className="text-center min-w-[80px]">
                                    <p className="text-lg font-bold text-gray-900 dark:text-white">{app.hora}</p>
                                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase
                                        ${app.yaAtendida ? 'bg-lime-100 text-lime-700' : 'bg-gray-100 text-gray-600'}
                                    `}>
                                        {app.yaAtendida ? 'ATENDIDA' : 'PENDIENTE'}
                                    </span>
                                </div>

                                {/* Patient Info */}
                                <div className="flex-1">
                                    <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                                        {app.paciente.nombre}
                                        <span className="text-xs font-normal text-gray-500 bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                                            {app.paciente.edad} años
                                        </span>
                                    </h3>
                                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                                        <span className="flex items-center gap-1"><User size={14} /> {app.paciente.documento}</span>
                                        <div className="flex items-center gap-1">
                                            <span className="font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[10px] uppercase border border-blue-100">
                                                {app.tipo}
                                            </span>
                                            {app.motivo && (
                                                <button
                                                    onClick={() => openInfoModal("Motivo de Consulta", (
                                                        <div className="space-y-1">
                                                            <p className="text-base text-gray-800 dark:text-gray-200 first-letter:uppercase">
                                                                {app.motivo}
                                                            </p>
                                                        </div>
                                                    ))}
                                                    className="group/btn relative"
                                                >
                                                    <FileText size={14} className="text-gray-400 cursor-pointer hover:text-lime-500 transition-colors" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Action */}
                                <div>
                                    {app.yaAtendida ? (
                                        <Link href={`/medico/citas/${app.id}?view=history`} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
                                            Ver Historia
                                        </Link>
                                    ) : (
                                        <Link
                                            href={`/medico/citas/${app.id}`}
                                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-lime-600 hover:bg-lime-700 text-white font-bold rounded-xl shadow-lg shadow-lime-500/30 transition-all hover:scale-105"
                                        >
                                            Atender <ArrowRight size={18} />
                                        </Link>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            {/* Info Modal */}
            <Modal
                isOpen={infoModal.isOpen}
                onClose={() => setInfoModal({ ...infoModal, isOpen: false })}
                title={infoModal.title}
            >
                {infoModal.content}
            </Modal>
        </div>
    );
}
