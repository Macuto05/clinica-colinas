"use client";

import { useState, useEffect } from "react";
import { format, addDays, subDays, isToday } from "date-fns";
import { es } from "date-fns/locale";
import {
    Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight,
    CheckCircle, XCircle, UserX, CalendarClock,
    FileText, Phone, Mail, Stethoscope, User, Search, DollarSign, Siren
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AppointmentActionModal } from "./components/AppointmentActionModal";
import { toast } from "sonner";
import EmergenciasPage from "../emergencias/page";

interface Appointment {
    id: string;
    patientName: string;
    patientDoc: string;
    patientPhone: string;
    patientEmail: string;
    doctorName: string;
    specialty: string;
    date: string;
    startTime: string;
    endTime: string;
    status: string;
    reason: string;
    doctorId: string;
    type: string;
    isPaid: boolean;
}

export default function ReceptionAgendaPage() {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [loading, setLoading] = useState(true);

    // Modal State
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [modalAction, setModalAction] = useState<'CONFIRM' | 'CANCEL' | 'RESCHEDULE' | 'NO_SHOW' | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Tab State
    const [activeTab, setActiveTab] = useState<'AGENDA' | 'EMERGENCIAS'>('AGENDA');
    const [activeEmergenciesCount, setActiveEmergenciesCount] = useState(0);

    const [isMounted, setIsMounted] = useState(false);

    const fetchEmergenciesCount = async () => {
        try {
            const res = await fetch('/api/emergency?active=true');
            if (res.ok) {
                const data = await res.json();
                setActiveEmergenciesCount(data.length);
            }
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        setIsMounted(true);
        fetchEmergenciesCount();
        
        // Handle return routing
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            if (params.get("tab") === "EMERGENCIAS") {
                setActiveTab("EMERGENCIAS");
            }
        }
    }, []);

    const fetchAppointments = async () => {
        setLoading(true);
        try {
            const dateStr = format(selectedDate, 'yyyy-MM-dd');
            const res = await fetch(`/api/reception/appointments?date=${dateStr}`);

            if (res.ok) {
                const data = await res.json();
                setAppointments(data);
                setFilteredAppointments(data);
            } else {
                setAppointments([]);
                setFilteredAppointments([]);
            }
        } catch (error) {
            console.error(error);
            toast.error("Error al cargar citas");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isMounted) {
            fetchAppointments();
        }
    }, [selectedDate, isMounted]);

    // Filter Logic
    useEffect(() => {
        let filtered = appointments;

        // 1. Text Search
        if (searchTerm) {
            const lowerQuery = searchTerm.toLowerCase();
            filtered = filtered.filter(apt =>
                apt.patientName.toLowerCase().includes(lowerQuery) ||
                apt.patientDoc.toLowerCase().includes(lowerQuery)
            );
        }

        // 2. Status Filter
        if (statusFilter !== 'ALL') {
            filtered = filtered.filter(apt => apt.status === statusFilter);
        }

        setFilteredAppointments(filtered);
    }, [searchTerm, statusFilter, appointments]);

    const handleAction = (apt: Appointment, action: 'CONFIRM' | 'CANCEL' | 'RESCHEDULE' | 'NO_SHOW') => {
        setSelectedAppointment(apt);
        setModalAction(action);
        setIsModalOpen(true);
    };

    // Stats Logic
    const stats = {
        total: appointments.length,
        confirmed: appointments.filter(a => a.status === 'CONFIRMADA').length,
        cancelled: appointments.filter(a => a.status === 'CANCELADA').length,
        noShow: appointments.filter(a => a.status === 'NO_ASISTIO').length,
        pending: appointments.filter(a => a.status === 'PROGRAMADA').length,
    };

    // Helper for Status Badge
    const renderStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            'CONFIRMADA': 'bg-green-100 text-green-700 border-green-200',
            'PROGRAMADA': 'bg-blue-100 text-blue-700 border-blue-200',
            'CANCELADA': 'bg-red-50 text-red-600 border-red-100 opacity-60',
            'COMPLETADA': 'bg-gray-100 text-gray-600 border-gray-200',
            'NO_ASISTIO': 'bg-orange-100 text-orange-700 border-orange-200',
            'ATENDIDA': 'bg-purple-100 text-purple-700 border-purple-200'
        };
        const defaultStyle = 'bg-gray-50 text-gray-500 border-gray-100';

        return (
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${styles[status] || defaultStyle}`}>
                {status}
            </span>
        );
    };

    if (!isMounted) return null;

    return (
        <div className="space-y-6">
            {/* Modern Liquid Tab Switcher */}
            <div className="flex justify-center mb-2 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="relative flex items-center bg-white/40 backdrop-blur-xl rounded-[2rem] p-1.5 shadow-inner border border-white/50 w-full max-w-md mx-auto h-14">
                    
                    {/* Sliding Background */}
                    <div 
                        className={`absolute top-1.5 bottom-1.5 rounded-[1.75rem] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] shadow-[0_4px_12px_rgba(0,0,0,0.1)] border border-white/60 backdrop-blur-md
                        ${activeTab === 'AGENDA' 
                            ? 'bg-white/90 left-1.5 w-[calc(50%-6px)]' 
                            : 'bg-white/90 left-[50%] w-[calc(50%-6px)]'}`}
                    />
                    
                    {/* AGENDA TAB */}
                    <button
                        onClick={() => setActiveTab('AGENDA')}
                        className={`relative z-10 flex-1 flex items-center justify-center gap-2 h-full text-sm font-bold transition-colors duration-300 rounded-[1.75rem] select-none
                        ${activeTab === 'AGENDA' ? 'text-lime-700' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <CalendarIcon size={18} />
                        Citas
                    </button>
                    
                    {/* EMERGENCIAS TAB */}
                    <button
                        onClick={() => setActiveTab('EMERGENCIAS')}
                        className={`relative z-10 flex-1 flex items-center justify-center gap-2 h-full text-sm font-bold transition-colors duration-300 rounded-[1.75rem] select-none
                        ${activeTab === 'EMERGENCIAS' ? 'text-red-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <Siren size={18} className={activeTab === 'EMERGENCIAS' && activeEmergenciesCount > 0 ? 'animate-pulse' : ''} />
                        Emergencias
                        {activeEmergenciesCount > 0 && (
                            <span className={`ml-1 flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full text-[10px] font-black transition-colors ${
                                activeTab === 'EMERGENCIAS' 
                                    ? 'bg-red-100 text-red-700 border border-red-200' 
                                    : 'bg-red-500 text-white shadow-sm'
                            }`}>
                                {activeEmergenciesCount}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {activeTab === 'AGENDA' ? (
                <>
                    {/* Header & Date Navigation */}
                    <div className="flex flex-col md:flex-row justify-between items-center bg-white/40 backdrop-blur-md p-5 rounded-3xl shadow-[0_4px_16px_0_rgba(0,0,0,0.02)] border border-white/50 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2 tracking-tight">
                        <CalendarIcon className="text-lime-600" />
                        Agenda del Día
                    </h1>
                    <p className="text-gray-500 text-sm font-medium">Gestiona citas y llegadas de pacientes.</p>
                </div>

                <div className="flex items-center gap-4 bg-white/50 backdrop-blur-sm p-2 rounded-2xl border border-white/60 shadow-inner">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedDate(subDays(selectedDate, 1))} className="rounded-xl hover:bg-white/60">
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <div className="text-center min-w-[140px]">
                        <span className="block font-bold text-gray-800 capitalize text-lg tracking-tight">
                            {format(selectedDate, 'EEEE', { locale: es })}
                        </span>
                        <span className="text-xs text-gray-500/80 font-bold uppercase tracking-wider">
                            {format(selectedDate, 'd MMM yyyy', { locale: es })}
                        </span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedDate(addDays(selectedDate, 1))}>
                        <ChevronRight className="w-5 h-5" />
                    </Button>
                    {!isToday(selectedDate) && (
                        <Button variant="outline" size="sm" onClick={() => setSelectedDate(new Date())} className="text-xs h-8 px-2">
                            Hoy
                        </Button>
                    )}
                </div>
            </div>

            {/* KPIs Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Programadas" value={stats.pending} color="blue" icon={<Clock size={16} />} />
                <StatCard label="Confirmadas" value={stats.confirmed} color="green" icon={<CheckCircle size={16} />} />
                <StatCard label="Canceladas" value={stats.cancelled} color="red" icon={<XCircle size={16} />} />
                <StatCard label="No Asistió" value={stats.noShow} color="orange" icon={<UserX size={16} />} />
            </div>

            {/* Filter */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por paciente o cédula..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-5 py-3.5 rounded-2xl bg-white/50 border border-white/60 focus:bg-white/80 focus:ring-2 focus:ring-lime-500/50 outline-none text-sm shadow-inner transition-all placeholder:text-gray-400 font-medium"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-5 py-3.5 rounded-2xl bg-white/50 border border-white/60 focus:bg-white/80 focus:ring-2 focus:ring-lime-500/50 outline-none text-sm shadow-inner transition-all text-gray-700 min-w-[200px] font-medium appearance-none cursor-pointer"
                >
                    <option value="ALL">Todos los Estados</option>
                    <option value="PROGRAMADA">Programada</option>
                    <option value="CONFIRMADA">Confirmada</option>
                    <option value="CANCELADA">Cancelada</option>
                    <option value="NO_ASISTIO">No Asistió</option>
                </select>
            </div>

            {/* Main Table */}
            <div className="bg-white/40 backdrop-blur-md rounded-3xl shadow-[0_4px_16px_0_rgba(0,0,0,0.02)] border border-white/50 overflow-hidden">
                <div className="p-5 border-b border-white/40 bg-white/30 backdrop-blur-sm">
                    <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider">Desglose de Citas</h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-white/30 text-gray-500/80 text-xs font-bold uppercase tracking-wider border-b border-white/40 backdrop-blur-sm">
                                <th className="p-4 pl-6 font-semibold w-24">Hora</th>
                                <th className="p-4 font-semibold w-64">Paciente</th>
                                <th className="p-4 font-semibold w-56">Contacto</th>
                                <th className="p-4 font-semibold w-64">Médico / Especialidad</th>
                                <th className="p-4 font-semibold w-32">Estado</th>
                                <th className="p-4 font-semibold text-right pr-6">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/30 glass-rows">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="p-10 text-center text-gray-400 animate-pulse">
                                        Cargando agenda...
                                    </td>
                                </tr>
                            ) : filteredAppointments.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-10 text-center">
                                        <div className="flex flex-col items-center gap-3 text-gray-400">
                                            <CalendarIcon size={48} className="opacity-20" />
                                            <p className="font-medium">No se encontraron citas</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredAppointments.map((apt) => (
                                    <tr key={apt.id} className="hover:bg-white/60 transition-colors group">
                                        {/* Hora */}
                                        <td className="p-4 pl-6 align-top">
                                            <div className="font-bold text-gray-800 text-lg tracking-tight whitespace-nowrap">
                                                {apt.startTime}
                                            </div>
                                        </td>

                                        {/* Paciente */}
                                        <td className="p-4 align-top">
                                            <div>
                                                <p className="font-bold text-gray-800 text-sm">{apt.patientName}</p>
                                                <p className="text-xs text-gray-500 font-mono mt-0.5">{apt.patientDoc}</p>
                                            </div>
                                        </td>

                                        {/* Contacto */}
                                        <td className="p-4 align-top">
                                            <div className="space-y-1">
                                                {apt.patientPhone && (
                                                    <div className="flex items-center gap-2 text-xs text-gray-600">
                                                        <Phone size={12} className="text-gray-400" />
                                                        {apt.patientPhone}
                                                    </div>
                                                )}
                                                {apt.patientEmail && (
                                                    <div className="flex items-center gap-2 text-xs text-gray-600 truncate max-w-[180px]" title={apt.patientEmail}>
                                                        <Mail size={12} className="text-gray-400" />
                                                        <span className="truncate">{apt.patientEmail}</span>
                                                    </div>
                                                )}
                                                {!apt.patientPhone && !apt.patientEmail && (
                                                    <span className="text-xs text-gray-400 italic">Sin contacto</span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Médico */}
                                        <td className="p-4 align-top">
                                            <div className="flex items-start gap-2">
                                                <Stethoscope size={14} className="text-lime-600 mt-0.5 shrink-0" />
                                                <div>
                                                    <p className="font-medium text-gray-800 text-sm">{apt.doctorName}</p>
                                                    <span className="inline-block px-1.5 py-0.5 bg-lime-50 text-lime-700 text-[10px] font-bold rounded uppercase mt-1 border border-lime-100">
                                                        {apt.specialty}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Estado */}
                                        <td className="p-4 align-top">
                                            <div className="flex flex-col items-start gap-1">
                                                {renderStatusBadge(apt.status)}

                                                {apt.status !== 'CANCELADA' && (
                                                    apt.isPaid ? (
                                                        <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100" title="Pagado">
                                                            <DollarSign size={14} className="stroke-[3]" />
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-1 text-gray-300 bg-gray-50 px-2 py-1 rounded-md border border-gray-100" title="Pendiente de Pago">
                                                            <DollarSign size={14} />
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        </td>

                                        {/* Acciones */}
                                        <td className="p-4 align-top text-right">
                                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {/* Only confirm/cancel if pending */}
                                                {(apt.status === 'PROGRAMADA' || apt.status === 'NO_ASISTIO') && (
                                                    <>
                                                        <button
                                                            onClick={() => handleAction(apt, 'CONFIRM')}
                                                            title="Confirmar"
                                                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                        >
                                                            <CheckCircle size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleAction(apt, 'RESCHEDULE')}
                                                            title="Reprogramar"
                                                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        >
                                                            <CalendarClock size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleAction(apt, 'NO_SHOW')}
                                                            title="No Asistió"
                                                            className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                                        >
                                                            <UserX size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleAction(apt, 'CANCEL')}
                                                            title="Cancelar"
                                                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        >
                                                            <XCircle size={18} />
                                                        </button>
                                                    </>
                                                )}

                                                {/* If confirmed, maybe verify arrival? Or Start? */}
                                                {apt.status === 'CONFIRMADA' && (
                                                    <button
                                                        onClick={() => handleAction(apt, 'NO_SHOW')}
                                                        title="No Asistió"
                                                        className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                                    >
                                                        <UserX size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            </>
            ) : (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
                    <EmergenciasPage />
                </div>
            )}

            <AppointmentActionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                appointment={selectedAppointment as any} // Cast compatible type if needed
                action={modalAction as any}
                onSuccess={() => {
                    fetchAppointments();
                    setIsModalOpen(false);
                }}
            />
        </div>
    );
}

// Stats Card Component
function StatCard({ label, value, color, icon }: { label: string, value: number, color: string, icon: React.ReactNode }) {
    const colorClasses: Record<string, string> = {
        blue: 'bg-blue-50/70 text-blue-700 border-blue-200/50 shadow-blue-500/5',
        green: 'bg-green-50/70 text-green-700 border-green-200/50 shadow-green-500/5',
        red: 'bg-red-50/70 text-red-700 border-red-200/50 shadow-red-500/5',
        orange: 'bg-orange-50/70 text-orange-700 border-orange-200/50 shadow-orange-500/5',
    };

    return (
        <div className={`p-5 rounded-3xl border ${colorClasses[color]} flex items-center justify-between backdrop-blur-md shadow-[0_4px_16px_0_rgba(0,0,0,0.02)]`}>
            <div>
                <p className="text-xs font-bold uppercase text-current opacity-70 mb-1.5 tracking-wider">{label}</p>
                <p className="text-3xl font-bold tracking-tight">{value}</p>
            </div>
            <div className={`p-3 rounded-2xl bg-white/60 shadow-sm border border-white/50 backdrop-blur-sm text-current`}>
                {icon}
            </div>
        </div>
    );
}

function getInitials(name: string) {
    return name
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
}
