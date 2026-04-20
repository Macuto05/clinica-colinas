"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Clock, Plus, FileText, ArrowRight, AlertCircle, Search, X as XIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/ui/Modal";
import { PageLoader } from "@/components/ui/PageLoader";
import { AppointmentDetailsModal } from "./components/AppointmentDetailsModal";
import { EmergencyExamsModal } from "./components/EmergencyExamsModal";
import { toast } from "sonner";

const PAGE_SIZE = 10;

interface Appointment {
    id: number;
    date: string;
    startTime: string;
    endTime: string;
    type: string;
    status: string;
    doctorName?: string;
    reason?: string;
}

interface Emergencia {
    emergenciaId: string;
    citaId: string | null;
    fechaIngreso: string;
    fechaAlta?: string;
    motivoIngreso: string;
    nivelUrgencia: string;
    estadoEmergencia: string;
    verificacionPago?: string;
    tieneExamenes?: boolean;
    medico?: { nombre: string } | null;
}

export default function AppointmentsPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    const [activeTab, setActiveTab] = useState<'citas' | 'emergencias'>('citas');

    // Data
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [isLoadingAppointments, setIsLoadingAppointments] = useState(true);
    const [emergencias, setEmergencias] = useState<Emergencia[]>([]);
    const [isLoadingEmergencias, setIsLoadingEmergencias] = useState(true);

    // Modals
    const [reasonModal, setReasonModal] = useState<{ isOpen: boolean; text: string }>({ isOpen: false, text: "" });
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [selectedAppointmentDetails, setSelectedAppointmentDetails] = useState<any>(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [examsEmergenciaId, setExamsEmergenciaId] = useState<string | null>(null);

    // ── Filtros Citas ──────────────────────────────────────────────────────
    const [draftCitaDoctor, setDraftCitaDoctor] = useState('');
    const [draftCitaEstado, setDraftCitaEstado] = useState('');
    const [draftCitaDesde, setDraftCitaDesde]   = useState('');
    const [draftCitaHasta, setDraftCitaHasta]   = useState('');
    const [appliedCita, setAppliedCita] = useState({ doctor: '', estado: '', desde: '', hasta: '' });
    const [citaPage, setCitaPage] = useState(1);

    // ── Filtros Emergencias ────────────────────────────────────────────────
    const [draftEmgDesde, setDraftEmgDesde] = useState('');
    const [draftEmgHasta, setDraftEmgHasta] = useState('');
    const [appliedEmg, setAppliedEmg] = useState({ desde: '', hasta: '' });
    const [emgPage, setEmgPage] = useState(1);

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login?redirect=/dashboard/citas");
            return;
        }
        if (user) {
            fetchAppointments();
            fetchEmergencias();
        }
    }, [user, loading, router]);

    const fetchAppointments = async () => {
        if (!user) return;
        try {
            const patientId = (user as any).patientId;
            if (!patientId && user.role === 'PACIENTE') { setIsLoadingAppointments(false); return; }
            const queryParam = user.role === 'MEDICO'
                ? `doctorId=${(user as any).employeeId}`
                : `patientId=${patientId}`;
            const response = await fetch(`/api/appointments?${queryParam}`);
            if (response.ok) {
                const data = await response.json();
                setAppointments(data.filter((apt: any) => apt.type !== 'EMERGENCIA'));
            }
        } catch (error) {
            console.error("Error fetching appointments:", error);
        } finally {
            setIsLoadingAppointments(false);
        }
    };

    const fetchEmergencias = async () => {
        if (!user || user.role === 'MEDICO') { setIsLoadingEmergencias(false); return; }
        try {
            const patientId = (user as any).patientId;
            if (!patientId) { setIsLoadingEmergencias(false); return; }
            const response = await fetch(`/api/emergency?patientId=${patientId}`);
            if (response.ok) {
                setEmergencias(await response.json());
            } else {
                toast.error("No se pudieron cargar las emergencias.");
            }
        } catch (error) {
            console.error("Error fetching emergencies:", error);
        } finally {
            setIsLoadingEmergencias(false);
        }
    };

    const handleOpenDetails = async (appointmentId: number) => {
        setDetailsModalOpen(true);
        setLoadingDetails(true);
        setSelectedAppointmentDetails(null);
        try {
            const res = await fetch(`/api/patient/appointments/${appointmentId}`);
            if (res.ok) {
                setSelectedAppointmentDetails(await res.json());
            } else {
                toast.error("Error al cargar detalles");
                setDetailsModalOpen(false);
            }
        } catch {
            toast.error("Error de conexión");
            setDetailsModalOpen(false);
        } finally {
            setLoadingDetails(false);
        }
    };

    // ── Computed Citas ─────────────────────────────────────────────────────
    const filteredCitas = appointments.filter(apt => {
        const aptDate = apt.date?.toString().split('T')[0] ?? '';
        if (appliedCita.doctor && !apt.doctorName?.toLowerCase().includes(appliedCita.doctor.toLowerCase())) return false;
        if (appliedCita.estado && apt.status !== appliedCita.estado) return false;
        if (appliedCita.desde && aptDate < appliedCita.desde) return false;
        if (appliedCita.hasta && aptDate > appliedCita.hasta) return false;
        return true;
    });
    const citaTotalPages = Math.max(1, Math.ceil(filteredCitas.length / PAGE_SIZE));
    const paginatedCitas = filteredCitas.slice((citaPage - 1) * PAGE_SIZE, citaPage * PAGE_SIZE);
    const citaHasFilters = !!(appliedCita.doctor || appliedCita.estado || appliedCita.desde || appliedCita.hasta);

    // ── Computed Emergencias ───────────────────────────────────────────────
    const filteredEmg = emergencias.filter(emg => {
        const d = emg.fechaIngreso?.toString().split('T')[0] ?? '';
        if (appliedEmg.desde && d < appliedEmg.desde) return false;
        if (appliedEmg.hasta && d > appliedEmg.hasta) return false;
        return true;
    });
    const emgTotalPages = Math.max(1, Math.ceil(filteredEmg.length / PAGE_SIZE));
    const paginatedEmg = filteredEmg.slice((emgPage - 1) * PAGE_SIZE, emgPage * PAGE_SIZE);
    const emgHasFilters = !!(appliedEmg.desde || appliedEmg.hasta);

    const handleBuscarCitas  = () => { setAppliedCita({ doctor: draftCitaDoctor, estado: draftCitaEstado, desde: draftCitaDesde, hasta: draftCitaHasta }); setCitaPage(1); };
    const handleLimpiarCitas = () => { setDraftCitaDoctor(''); setDraftCitaEstado(''); setDraftCitaDesde(''); setDraftCitaHasta(''); setAppliedCita({ doctor: '', estado: '', desde: '', hasta: '' }); setCitaPage(1); };
    const handleBuscarEmg    = () => { setAppliedEmg({ desde: draftEmgDesde, hasta: draftEmgHasta }); setEmgPage(1); };
    const handleLimpiarEmg   = () => { setDraftEmgDesde(''); setDraftEmgHasta(''); setAppliedEmg({ desde: '', hasta: '' }); setEmgPage(1); };

    if (loading) return <PageLoader message="Verificando sesión..." minHeight="min-h-screen" />;

    return (
        <div className="p-4 sm:p-6 md:p-8 animate-in fade-in duration-500">
            <div className="max-w-5xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Mis Visitas</h1>
                        <p className="text-gray-500 font-medium mt-1">Gestiona tus consultas médicas y emergencias</p>
                    </div>
                    {activeTab === 'citas' && (
                        <button
                            onClick={() => router.push("/dashboard/citas/nueva")}
                            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-lime-500/95 text-white font-bold shadow-[0_8px_20px_rgba(132,204,22,0.3)] border border-lime-400/50 hover:bg-lime-600 hover:scale-[1.02] transition-all"
                        >
                            <Plus size={20} /> Nueva Cita
                        </button>
                    )}
                </div>

                {/* Tabs */}
                <div className="flex bg-white/40 backdrop-blur-md border border-white/60 p-1 rounded-2xl w-full sm:w-fit shadow-sm">
                    {(['citas', 'emergencias'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === tab ? 'bg-white text-lime-700 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'}`}
                        >
                            {tab === 'citas' ? 'Mis Citas' : 'Mis Emergencias'}
                        </button>
                    ))}
                </div>

                {/* ── TAB: MIS CITAS ──────────────────────────────────────────────────── */}
                {activeTab === 'citas' && (
                    <div className="space-y-4">

                        {/* Filter bar */}
                        <div className="bg-white/50 backdrop-blur-md rounded-2xl border border-white/60 shadow-sm px-4 py-3 space-y-2">
                            {/* Fields row */}
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={draftCitaDoctor}
                                    onChange={e => setDraftCitaDoctor(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleBuscarCitas()}
                                    placeholder="Médico..."
                                    className="flex-[2] min-w-0 px-3 py-2 rounded-xl bg-white/70 border border-white/70 text-xs font-medium text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-lime-400/50 transition-all"
                                />
                                <select
                                    value={draftCitaEstado}
                                    onChange={e => setDraftCitaEstado(e.target.value)}
                                    className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-white/70 border border-white/70 text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-lime-400/50 transition-all cursor-pointer"
                                >
                                    <option value="">Todos los estados</option>
                                    <option value="PROGRAMADA">Programada</option>
                                    <option value="ATENDIDA">Atendida</option>
                                    <option value="CANCELADA">Cancelada</option>
                                    <option value="NO_ASISTIO">No asistió</option>
                                </select>
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider shrink-0">Desde</span>
                                <input
                                    type="date"
                                    value={draftCitaDesde}
                                    onChange={e => setDraftCitaDesde(e.target.value)}
                                    className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-white/70 border border-white/70 text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-lime-400/50 transition-all"
                                />
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider shrink-0">Hasta</span>
                                <input
                                    type="date"
                                    value={draftCitaHasta}
                                    onChange={e => setDraftCitaHasta(e.target.value)}
                                    className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-white/70 border border-white/70 text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-lime-400/50 transition-all"
                                />
                            </div>
                            {/* Buttons row */}
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleBuscarCitas}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-lime-500 hover:bg-lime-600 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                                >
                                    <Search size={13} /> Buscar
                                </button>
                                {citaHasFilters && (
                                    <button
                                        onClick={handleLimpiarCitas}
                                        className="flex items-center gap-1.5 px-3 py-2 bg-white/60 border border-white/70 text-gray-500 text-xs font-bold rounded-xl hover:bg-white transition-all"
                                    >
                                        <XIcon size={12} /> Limpiar
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* List */}
                        {isLoadingAppointments ? (
                            <PageLoader message="Cargando historial..." />
                        ) : appointments.length === 0 ? (
                            <div className="bg-white/40 backdrop-blur-md rounded-[2.5rem] p-12 sm:p-20 text-center border border-white/50">
                                <div className="mx-auto w-20 h-20 bg-white/60 backdrop-blur-sm rounded-full flex items-center justify-center mb-6 border border-white/80 shadow-inner">
                                    <Calendar size={36} className="text-lime-600 opacity-60" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900">No tienes citas programadas</h3>
                                <p className="text-gray-500 mt-2 mb-8 max-w-sm mx-auto font-medium">Agenda tu primera consulta hoy mismo.</p>
                                <button onClick={() => router.push("/dashboard/citas/nueva")} className="px-8 py-4 bg-lime-500 hover:bg-lime-600 text-white font-black rounded-2xl shadow-[0_8px_20px_rgba(132,204,22,0.3)] transition-all hover:scale-[1.05]">
                                    Agendar Cita
                                </button>
                            </div>
                        ) : paginatedCitas.length === 0 ? (
                            <div className="bg-white/40 backdrop-blur-md rounded-[2.5rem] p-12 text-center border border-white/50">
                                <Search size={40} className="mx-auto text-gray-300 mb-3" />
                                <p className="font-bold text-gray-500">Sin resultados para los filtros aplicados.</p>
                                <button onClick={handleLimpiarCitas} className="mt-4 text-sm text-lime-600 font-bold hover:underline">Limpiar filtros</button>
                            </div>
                        ) : (
                            <div className="grid gap-5">
                                {paginatedCitas.map((apt) => {
                                    const isCompleted = ['ATENDIDA', 'COMPLETADA', 'FINALIZADA'].includes(apt.status);
                                    return (
                                        <div key={apt.id} className="group bg-white/40 backdrop-blur-md p-6 rounded-[2rem] border border-white/50 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all hover:bg-white/70 hover:shadow-lg hover:scale-[1.01]">
                                            <div className="flex items-start gap-5">
                                                <div className="w-14 h-14 bg-white/80 rounded-2xl border border-white shadow-sm flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                                    <Calendar className="text-lime-600" size={28} />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-3">
                                                        <h3 className="font-black text-gray-900 text-lg uppercase tracking-tight">{apt.type}</h3>
                                                        <div className="md:hidden"><StatusBadge status={apt.status} /></div>
                                                    </div>
                                                    <p className="text-gray-500 font-bold text-sm mt-0.5">Dr. {apt.doctorName || 'No asignado'}</p>
                                                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-4">
                                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/50 rounded-xl border border-white/60 text-xs font-bold text-gray-600">
                                                            <Calendar size={14} className="text-lime-600" />
                                                            {String(new Date(apt.date).getUTCDate()).padStart(2, '0')}/{String(new Date(apt.date).getUTCMonth() + 1).padStart(2, '0')}/{new Date(apt.date).getUTCFullYear()}
                                                        </div>
                                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/50 rounded-xl border border-white/60 text-xs font-bold text-gray-600">
                                                            <Clock size={14} className="text-lime-600" />
                                                            {apt.startTime} - {apt.endTime}
                                                        </div>
                                                    </div>
                                                    {apt.reason && (
                                                        <button onClick={() => setReasonModal({ isOpen: true, text: apt.reason! })} className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-lime-600 transition-colors">
                                                            <FileText size={14} /> Ver motivo
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-4">
                                                <div className="hidden md:block"><StatusBadge status={apt.status} /></div>
                                                {isCompleted ? (
                                                    <button onClick={() => handleOpenDetails(apt.id)} className="w-full md:w-auto text-[11px] font-black uppercase tracking-widest text-lime-700 bg-lime-500/10 hover:bg-lime-500/20 border border-lime-500/20 px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition-all hover:scale-[1.02]">
                                                        Ver Resultados <ArrowRight size={14} />
                                                    </button>
                                                ) : (
                                                    <div className="h-10 hidden md:block" />
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Pagination */}
                        {!isLoadingAppointments && citaTotalPages > 1 && (
                            <div className="flex items-center justify-between bg-white/50 backdrop-blur-md rounded-2xl border border-white/60 px-5 py-3 shadow-sm">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                    {(citaPage - 1) * PAGE_SIZE + 1}–{Math.min(citaPage * PAGE_SIZE, filteredCitas.length)} de {filteredCitas.length}
                                </p>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setCitaPage(p => p - 1)} disabled={citaPage === 1} className="p-2 rounded-xl bg-white/60 border border-white/70 text-gray-600 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                                        <ChevronLeft size={16} />
                                    </button>
                                    <span className="text-xs font-black text-gray-600 bg-white/60 border border-white/70 rounded-xl px-4 py-2 min-w-[70px] text-center">{citaPage} / {citaTotalPages}</span>
                                    <button onClick={() => setCitaPage(p => p + 1)} disabled={citaPage === citaTotalPages} className="p-2 rounded-xl bg-white/60 border border-white/70 text-gray-600 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ── TAB: MIS EMERGENCIAS ────────────────────────────────────────────── */}
                {activeTab === 'emergencias' && (
                    <div className="space-y-4">

                        {/* Filter bar */}
                        <div className="bg-white/50 backdrop-blur-md rounded-2xl border border-white/60 shadow-sm px-4 py-3 space-y-2">
                            {/* Fields row */}
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider shrink-0">Desde</span>
                                <input
                                    type="date"
                                    value={draftEmgDesde}
                                    onChange={e => setDraftEmgDesde(e.target.value)}
                                    className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-white/70 border border-white/70 text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-400/50 transition-all"
                                />
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider shrink-0">Hasta</span>
                                <input
                                    type="date"
                                    value={draftEmgHasta}
                                    onChange={e => setDraftEmgHasta(e.target.value)}
                                    className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-white/70 border border-white/70 text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-400/50 transition-all"
                                />
                            </div>
                            {/* Buttons row */}
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleBuscarEmg}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                                >
                                    <Search size={13} /> Buscar
                                </button>
                                {emgHasFilters && (
                                    <button
                                        onClick={handleLimpiarEmg}
                                        className="flex items-center gap-1.5 px-3 py-2 bg-white/60 border border-white/70 text-gray-500 text-xs font-bold rounded-xl hover:bg-white transition-all"
                                    >
                                        <XIcon size={12} /> Limpiar
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* List */}
                        {isLoadingEmergencias ? (
                            <PageLoader message="Cargando emergencias..." />
                        ) : emergencias.length === 0 ? (
                            <div className="bg-white/40 backdrop-blur-md rounded-[2.5rem] p-12 sm:p-20 text-center border border-white/50">
                                <div className="mx-auto w-20 h-20 bg-white/60 rounded-full flex items-center justify-center mb-6 border border-white/80 shadow-inner">
                                    <AlertCircle size={36} className="text-red-500 opacity-60" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900">No tienes registros de emergencias</h3>
                                <p className="text-gray-500 mt-2 font-medium">Historial limpio.</p>
                            </div>
                        ) : paginatedEmg.length === 0 ? (
                            <div className="bg-white/40 backdrop-blur-md rounded-[2.5rem] p-12 text-center border border-white/50">
                                <Search size={40} className="mx-auto text-gray-300 mb-3" />
                                <p className="font-bold text-gray-500">Sin resultados para el rango seleccionado.</p>
                                <button onClick={handleLimpiarEmg} className="mt-4 text-sm text-red-500 font-bold hover:underline">Limpiar filtros</button>
                            </div>
                        ) : (
                            <div className="grid gap-5">
                                {paginatedEmg.map((emg) => (
                                    <div key={emg.emergenciaId} className="group bg-white/40 backdrop-blur-md p-6 rounded-[2rem] border border-red-100/50 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all hover:bg-white/70 hover:shadow-lg hover:scale-[1.01]">
                                        <div className="flex items-start gap-5">
                                            <div className="w-14 h-14 bg-red-50/80 rounded-2xl border border-red-100 shadow-sm flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                                <AlertCircle className="text-red-500" size={28} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3">
                                                    <h3 className="font-black text-gray-900 text-lg uppercase tracking-tight">EMERGENCIA</h3>
                                                    <div className="md:hidden"><StatusBadge status={emg.estadoEmergencia} /></div>
                                                </div>
                                                <p className="text-gray-500 font-bold text-sm mt-0.5">Dr. {emg.medico?.nombre || 'No asignado'}</p>
                                                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-4">
                                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/50 rounded-xl border border-white/60 text-xs font-bold text-gray-600">
                                                        <Calendar size={14} className="text-red-500" />
                                                        {new Date(emg.fechaIngreso).toLocaleDateString()} — {new Date(emg.fechaIngreso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                    {emg.fechaAlta && (
                                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/50 rounded-xl border border-white/60 text-xs font-bold text-gray-600">
                                                            <ArrowRight size={14} className="text-red-500" />
                                                            Alta: {new Date(emg.fechaAlta).toLocaleDateString()}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="mt-4 flex flex-wrap items-center gap-3">
                                                    {emg.motivoIngreso && (
                                                        <button onClick={() => setReasonModal({ isOpen: true, text: emg.motivoIngreso })} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-red-500 transition-colors">
                                                            <FileText size={14} /> Ver motivo
                                                        </button>
                                                    )}
                                                    {!!emg.tieneExamenes && (
                                                        <button
                                                            onClick={() => setExamsEmergenciaId(emg.emergenciaId)}
                                                            className="md:hidden flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-red-600 hover:text-red-700 transition-colors"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2v-4M9 21H5a2 2 0 0 1-2-2v-4m0 0h18"/></svg>
                                                            Ver Exámenes
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="hidden md:flex flex-col items-end gap-2">
                                            <StatusBadge status={emg.estadoEmergencia} />
                                            {emg.verificacionPago && (
                                                <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                                                    emg.verificacionPago === 'CONFIRMADO' ? 'bg-green-100 text-green-700 border border-green-200' :
                                                    emg.verificacionPago === 'SIN_COBERTURA' ? 'bg-red-100 text-red-700 border border-red-200' :
                                                    'bg-amber-100 text-amber-700 border border-amber-200'
                                                }`}>PAGO {emg.verificacionPago}</span>
                                            )}
                                            {!!emg.tieneExamenes && (
                                                <button
                                                    onClick={() => setExamsEmergenciaId(emg.emergenciaId)}
                                                    className="text-[11px] font-black uppercase tracking-widest text-red-600 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 px-4 py-2 rounded-xl flex items-center gap-2 transition-all hover:scale-[1.02]"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2v-4M9 21H5a2 2 0 0 1-2-2v-4m0 0h18"/></svg>
                                                    Ver Exámenes
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Pagination */}
                        {!isLoadingEmergencias && emgTotalPages > 1 && (
                            <div className="flex items-center justify-between bg-white/50 backdrop-blur-md rounded-2xl border border-white/60 px-5 py-3 shadow-sm">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                    {(emgPage - 1) * PAGE_SIZE + 1}–{Math.min(emgPage * PAGE_SIZE, filteredEmg.length)} de {filteredEmg.length}
                                </p>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setEmgPage(p => p - 1)} disabled={emgPage === 1} className="p-2 rounded-xl bg-white/60 border border-white/70 text-gray-600 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                                        <ChevronLeft size={16} />
                                    </button>
                                    <span className="text-xs font-black text-gray-600 bg-white/60 border border-white/70 rounded-xl px-4 py-2 min-w-[70px] text-center">{emgPage} / {emgTotalPages}</span>
                                    <button onClick={() => setEmgPage(p => p + 1)} disabled={emgPage === emgTotalPages} className="p-2 rounded-xl bg-white/60 border border-white/70 text-gray-600 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modals */}
            <Modal isOpen={reasonModal.isOpen} onClose={() => setReasonModal({ ...reasonModal, isOpen: false })} title="Motivo">
                <div className="p-6">
                    <p className="text-gray-800 text-lg font-medium italic bg-white/50 p-6 rounded-[2rem] border border-white/60 text-center leading-relaxed">
                        "{reasonModal.text}"
                    </p>
                </div>
            </Modal>

            <AppointmentDetailsModal
                isOpen={detailsModalOpen}
                onClose={() => setDetailsModalOpen(false)}
                appointment={selectedAppointmentDetails}
                loading={loadingDetails}
            />

            {examsEmergenciaId && (
                <EmergencyExamsModal
                    emergenciaId={examsEmergenciaId}
                    onClose={() => setExamsEmergenciaId(null)}
                />
            )}
        </div>
    );
}
