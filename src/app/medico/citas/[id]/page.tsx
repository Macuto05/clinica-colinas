"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useParams, useRouter } from "next/navigation";
import {
    User, Calendar, Activity, Pill, FileText, CheckCircle,
    Plus, Trash2, ArrowLeft, History, AlertTriangle, Stethoscope, ClipboardList, Book
} from "lucide-react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { ClinicalHistoryForm } from "../../components/ClinicalHistoryForm";

// Helper for UTC Date Formatting (Fixes off-by-one error)
function formatHistoryDate(isoString: string) {
    if (!isoString) return "";
    const date = new Date(isoString);
    const day = date.getUTCDate().toString().padStart(2, '0');
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const year = date.getUTCFullYear();
    return `${day}/${month}/${year}`;
}

export default function ConsultationPage() {
    const { id } = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isReadOnly, setIsReadOnly] = useState(false);

    // Data
    const [appointment, setAppointment] = useState<any>(null);
    const [patientHistory, setPatientHistory] = useState<any[]>([]);

    // Form - Diagnosis
    const [diagnosis, setDiagnosis] = useState({
        descripcion: "",
        notas: ""
    });

    // Form - Prescription
    const [prescription, setPrescription] = useState<{
        detalles: any[];
    }>({
        detalles: [] // { medicamento, dosis, frecuencia, duracion, instrucciones }
    });

    // Form - Orders (Exams)
    const [orders, setOrders] = useState<any[]>([]); // { estudio, tipo }

    // UI State
    const [activeTab, setActiveTab] = useState<'CONSULTA' | 'RECETA' | 'ORDENES' | 'HISTORIAL_CLINICA'>('CONSULTA');

    // History Modal State
    const [historyModal, setHistoryModal] = useState<{
        isOpen: boolean;
        title: string;
        content: React.ReactNode;
    }>({ isOpen: false, title: "", content: null });

    const openHistoryModal = (title: string, content: React.ReactNode) => {
        setHistoryModal({ isOpen: true, title, content });
    };

    // 1. Fetch Appointment Details & History
    useEffect(() => {
        if (id && user) {
            // Fetch specific appointment details
            fetch(`/api/doctor/appointments/${id}`)
                .then(r => r.json())
                .then(appt => {
                    if (appt && !appt.error) {
                        setAppointment(appt);

                        // Check Read Only Status
                        if (appt.yaAtendida || appt.estado === 'ATENDIDA' || appt.estado === 'FINALIZADA') {
                            setIsReadOnly(true);
                            // Populate Diagnosis
                            if (appt.diagnostico) {
                                setDiagnosis({
                                    descripcion: appt.diagnostico.descripcion,
                                    notas: appt.diagnostico.notas || ""
                                });
                            }
                            // Populate Prescription
                            if (appt.receta && appt.receta.detalles) {
                                setPrescription({ detalles: appt.receta.detalles });
                            }
                            // Populate Orders
                            if (appt.ordenes && appt.ordenes.length > 0) {
                                setOrders(appt.ordenes);
                            }
                        }

                        // Now fetch history with userId for filtering
                        // userId is available from useAuth() hook
                        // We need to ensure we use the correct user identifier
                        const currentUserId = (user as any)?.id || (user as any)?.userId;
                        let historyUrl = `/api/doctor/patients/${appt.paciente.id}/history`;
                        if (currentUserId) {
                            historyUrl += `?userId=${currentUserId}`;
                        }

                        fetch(historyUrl)
                            .then(h => h.json())
                            .then(setPatientHistory);
                    } else {
                        toast.error(appt.error || "No se pudo cargar la cita");
                    }
                    setLoading(false);
                })
                .catch(err => {
                    console.error("Error loading appointment:", err);
                    setLoading(false);
                    toast.error("Error de conexión");
                });
        }
    }, [id, user]);

    const addMedication = () => {
        setPrescription(prev => ({
            ...prev,
            detalles: [...prev.detalles, { medicamento: "", dosis: "", frecuencia: "", duracion: "", instrucciones: "" }]
        }));
    };

    const updateMedication = (index: number, field: string, value: string) => {
        const newDetalles = [...prescription.detalles];
        newDetalles[index] = { ...newDetalles[index], [field]: value };
        setPrescription(prev => ({ ...prev, detalles: newDetalles }));
    };

    const removeMedication = (index: number) => {
        setPrescription(prev => ({
            ...prev,
            detalles: prev.detalles.filter((_, i) => i !== index)
        }));
    };

    // Orders Handlers
    const addOrder = () => {
        setOrders([...orders, { estudio: "", tipo: "" }]);
    };

    const updateOrder = (index: number, field: string, value: string) => {
        const newOrders = [...orders];
        newOrders[index] = { ...newOrders[index], [field]: value };
        setOrders(newOrders);
    };

    const removeOrder = (index: number) => {
        setOrders(orders.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        console.log("Submit clicked. Diagnosis:", diagnosis);
        console.log("User:", user);

        if (!diagnosis.descripcion.trim()) {
            toast.error("Debes ingresar un diagnóstico");
            return;
        }

        if (!(user as any)?.id) {
            toast.error("Error: Usuario no identificado. Recarga la página.");
            console.error("Missing user ID:", user);
            return;
        }

        setSaving(true);
        try {
            const payload = {
                citaId: id,
                usuarioId: (user as any)?.id,
                diagnostico: diagnosis,
                receta: prescription.detalles.length > 0 ? prescription : undefined,
                ordenes: orders.length > 0 ? orders : undefined
            };
            console.log("Payload:", payload);

            const res = await fetch("/api/doctor/clinical-record", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            console.log("Response status:", res.status);
            const responseData = await res.json();
            console.log("Response Data:", responseData);

            if (res.ok && responseData.success) {
                toast.success("Consulta finalizada correctamente");
                router.push("/medico");
            } else {
                console.error("API Error Object:", responseData);
                toast.error(responseData.error || "Error al guardar consulta");
            }
        } catch (error) {
            console.error("Fetch error:", error);
            toast.error("Error de conexión");
        }
        setSaving(false);
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Cargando paciente...</div>;
    if (!appointment) return <div className="p-8 text-center text-red-500">Cita no encontrada</div>;

    return (
        <div className="space-y-6">
            {/* Header: Patient Info */}
            <header className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-gray-200 dark:border-zinc-800 shadow-sm flex justify-between items-start">
                <div className="flex gap-4">
                    <div className="w-16 h-16 rounded-full bg-lime-100 dark:bg-lime-900 flex items-center justify-center text-lime-600 dark:text-lime-300">
                        <User size={32} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            {appointment.paciente.nombre}
                            <span className="text-sm font-normal text-gray-500 bg-gray-100 dark:bg-zinc-800 px-3 py-1 rounded-full">
                                {appointment.paciente.edad} años
                            </span>
                        </h1>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                                <Activity size={14} className="text-lime-500" />
                                <span className="font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[10px] uppercase border border-blue-100">
                                    {appointment.tipo}
                                </span>
                                {appointment.motivo && (
                                    <button
                                        onClick={() => openHistoryModal("Motivo de Consulta", (
                                            <div className="space-y-1">
                                                <p className="text-base text-gray-800 dark:text-gray-200 first-letter:uppercase">
                                                    {appointment.motivo}
                                                </p>
                                            </div>
                                        ))}
                                        className="group/btn relative"
                                    >
                                        <FileText size={14} className="text-gray-400 cursor-pointer hover:text-lime-500 transition-colors" />
                                    </button>
                                )}
                            </div>
                            <span className="flex items-center gap-1"><Calendar size={14} /> Cita: {appointment.hora}</span>
                        </div>
                    </div>
                </div>
                <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                    <ArrowLeft size={24} />
                </button>
            </header>

            <div className="flex gap-8">
                {/* Main Workspace (Left) */}
                <div className="flex-1 space-y-6">

                    {/* Tabs */}
                    <div className="flex gap-2 border-b border-gray-200 dark:border-zinc-800 pb-1">
                        <button
                            onClick={() => setActiveTab('CONSULTA')}
                            className={`px-4 py-2 text-sm font-bold flex items-center gap-2 rounded-t-lg transition-colors
                                ${activeTab === 'CONSULTA'
                                    ? 'bg-white dark:bg-zinc-900 border-b-2 border-lime-500 text-lime-600'
                                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                        >
                            <StethoscopeIcon active={activeTab === 'CONSULTA'} /> Diagnóstico
                        </button>
                        <button
                            onClick={() => setActiveTab('RECETA')}
                            className={`px-4 py-2 text-sm font-bold flex items-center gap-2 rounded-t-lg transition-colors
                                ${activeTab === 'RECETA'
                                    ? 'bg-white dark:bg-zinc-900 border-b-2 border-lime-500 text-lime-600'
                                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                        >
                            <Pill size={16} /> Receta Médica
                            {prescription.detalles.length > 0 && <span className="bg-lime-100 text-lime-700 px-1.5 py-0.5 rounded-full text-[10px]">{prescription.detalles.length}</span>}
                        </button>
                        <button
                            onClick={() => setActiveTab('ORDENES')}
                            className={`px-4 py-2 text-sm font-bold flex items-center gap-2 rounded-t-lg transition-colors
                                ${activeTab === 'ORDENES'
                                    ? 'bg-white dark:bg-zinc-900 border-b-2 border-lime-500 text-lime-600'
                                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                        >
                            <ClipboardList size={16} /> Órdenes
                            {orders.length > 0 && <span className="bg-lime-100 text-lime-700 px-1.5 py-0.5 rounded-full text-[10px]">{orders.length}</span>}
                        </button>
                        <button
                            onClick={() => setActiveTab('HISTORIAL_CLINICA')}
                            className={`px-4 py-2 text-sm font-bold flex items-center gap-2 rounded-t-lg transition-colors
                                ${activeTab === 'HISTORIAL_CLINICA'
                                    ? 'bg-white dark:bg-zinc-900 border-b-2 border-lime-500 text-lime-600'
                                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                        >
                            <Book size={16} /> Historia Clínica
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-gray-200 dark:border-zinc-800 shadow-sm min-h-[400px]">

                        {activeTab === 'CONSULTA' && (
                            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Diagnóstico Médico <span className="text-red-500">*</span></label>
                                    <textarea
                                        value={diagnosis.descripcion}
                                        onChange={e => setDiagnosis({ ...diagnosis, descripcion: e.target.value })}
                                        disabled={isReadOnly}
                                        className="w-full h-32 p-4 rounded-xl border border-gray-300 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 focus:ring-2 focus:ring-lime-500 outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                        placeholder="Descripción detallada del diagnóstico..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notas / Plan de Tratamiento</label>
                                    <textarea
                                        value={diagnosis.notas}
                                        onChange={e => setDiagnosis({ ...diagnosis, notas: e.target.value })}
                                        disabled={isReadOnly}
                                        className="w-full h-24 p-4 rounded-xl border border-gray-300 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 focus:ring-2 focus:ring-lime-500 outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                        placeholder="Indicaciones adicionales, recomendaciones..."
                                    />
                                </div>
                            </div>
                        )}

                        {activeTab === 'RECETA' && (
                            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold text-gray-900 dark:text-white">Medicamentos</h3>
                                    <button
                                        onClick={addMedication}
                                        disabled={isReadOnly}
                                        className={`flex items-center gap-2 px-3 py-1.5 bg-lime-50 text-lime-600 rounded-lg hover:bg-lime-100 text-sm font-bold transition-colors ${isReadOnly ? 'hidden' : ''}`}
                                    >
                                        <Plus size={16} /> Agregar
                                    </button>
                                </div>

                                {prescription.detalles.length === 0 ? (
                                    <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-zinc-700 rounded-xl">
                                        <Pill className="mx-auto text-gray-300 mb-3" size={32} />
                                        <p className="text-gray-500 text-sm">No hay medicamentos agregados.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {prescription.detalles.map((med, idx) => (
                                            <div key={idx} className="bg-gray-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-gray-200 dark:border-zinc-700 relative group">
                                                {!isReadOnly && (
                                                    <button
                                                        onClick={() => removeMedication(idx)}
                                                        className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                                <div className="grid grid-cols-12 gap-3 mb-2">
                                                    <div className="col-span-6">
                                                        <input
                                                            placeholder="Medicamento (Ej. Acetaminofen)"
                                                            className="w-full bg-transparent border-b border-gray-300 dark:border-zinc-600 px-1 py-1 text-sm font-bold focus:border-lime-500 outline-none disabled:cursor-not-allowed"
                                                            value={med.medicamento}
                                                            onChange={e => updateMedication(idx, 'medicamento', e.target.value)}
                                                            disabled={isReadOnly}
                                                        />
                                                    </div>
                                                    <div className="col-span-3">
                                                        <input
                                                            placeholder="Dosis (500mg)"
                                                            className="w-full bg-transparent border-b border-gray-300 dark:border-zinc-600 px-1 py-1 text-sm focus:border-lime-500 outline-none"
                                                            value={med.dosis}
                                                            onChange={e => updateMedication(idx, 'dosis', e.target.value)}
                                                            disabled={isReadOnly}
                                                        />
                                                    </div>
                                                    <div className="col-span-3">
                                                        <input
                                                            placeholder="Frec. (8h)"
                                                            className="w-full bg-transparent border-b border-gray-300 dark:border-zinc-600 px-1 py-1 text-sm focus:border-lime-500 outline-none"
                                                            value={med.frecuencia}
                                                            onChange={e => updateMedication(idx, 'frecuencia', e.target.value)}
                                                            disabled={isReadOnly}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-12 gap-3">
                                                    <div className="col-span-3">
                                                        <input
                                                            placeholder="Duración (3 días)"
                                                            className="w-full bg-transparent border-b border-gray-300 dark:border-zinc-600 px-1 py-1 text-xs text-gray-600 dark:text-gray-400 focus:border-lime-500 outline-none"
                                                            value={med.duracion}
                                                            onChange={e => updateMedication(idx, 'duracion', e.target.value)}
                                                            disabled={isReadOnly}
                                                        />
                                                    </div>
                                                    <div className="col-span-9">
                                                        <input
                                                            placeholder="Instrucciones adicionales..."
                                                            className="w-full bg-transparent border-b border-gray-300 dark:border-zinc-600 px-1 py-1 text-xs text-gray-600 dark:text-gray-400 focus:border-lime-500 outline-none"
                                                            value={med.instrucciones}
                                                            onChange={e => updateMedication(idx, 'instrucciones', e.target.value)}
                                                            disabled={isReadOnly}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'ORDENES' && (
                            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold text-gray-900 dark:text-white">Estudios y Exámenes</h3>
                                    <button
                                        onClick={addOrder}
                                        disabled={isReadOnly}
                                        className={`flex items-center gap-2 px-3 py-1.5 bg-lime-50 text-lime-600 rounded-lg hover:bg-lime-100 text-sm font-bold transition-colors ${isReadOnly ? 'hidden' : ''}`}
                                    >
                                        <Plus size={16} /> Agregar
                                    </button>
                                </div>

                                {orders.length === 0 ? (
                                    <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-zinc-700 rounded-xl">
                                        <ClipboardList className="mx-auto text-gray-300 mb-3" size={32} />
                                        <p className="text-gray-500 text-sm">No hay órdenes creadas.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {orders.map((ord, idx) => (
                                            <div key={idx} className="bg-gray-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-gray-200 dark:border-zinc-700 relative group">
                                                {!isReadOnly && (
                                                    <button
                                                        onClick={() => removeOrder(idx)}
                                                        className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                                <div className="grid grid-cols-12 gap-3 mb-2">
                                                    <div className="col-span-8">
                                                        <input
                                                            placeholder="Estudio (Ej. Hematología Completa)"
                                                            className="w-full bg-transparent border-b border-gray-300 dark:border-zinc-600 px-1 py-1 text-sm font-bold focus:border-lime-500 outline-none disabled:cursor-not-allowed"
                                                            value={ord.estudio}
                                                            onChange={e => updateOrder(idx, 'estudio', e.target.value)}
                                                            disabled={isReadOnly}
                                                        />
                                                    </div>
                                                    <div className="col-span-4">
                                                        <input
                                                            placeholder="Tipo (Lab, Rayos X...)"
                                                            className="w-full bg-transparent border-b border-gray-300 dark:border-zinc-600 px-1 py-1 text-sm text-gray-500 focus:border-lime-500 outline-none"
                                                            value={ord.tipo}
                                                            onChange={e => updateOrder(idx, 'tipo', e.target.value)}
                                                            disabled={isReadOnly}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'HISTORIAL_CLINICA' && (
                            <div className="animate-in fade-in zoom-in-95 duration-200">
                                <ClinicalHistoryForm
                                    patientId={appointment.paciente.id}
                                    patientData={appointment.paciente}
                                    isReadOnly={isReadOnly}
                                />
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end pt-4">
                        {!isReadOnly && (
                            <button
                                onClick={handleSubmit}
                                disabled={saving || !diagnosis.descripcion}
                                className="bg-lime-600 hover:bg-lime-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-lime-500/30 flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? <Activity className="animate-spin" /> : <CheckCircle />}
                                Finalizar Consulta
                            </button>
                        )}
                    </div>

                </div>

                {/* Sidebar History (Right) */}
                <div className="w-80 space-y-4">
                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <History size={18} /> Historial Médico
                    </h3>
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-gray-200 dark:border-zinc-800 shadow-sm max-h-[600px] overflow-y-auto space-y-4 custom-scrollbar">
                        {patientHistory.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-4">Sin historial previo</p>
                        ) : (
                            patientHistory.map((hist, i) => (
                                <div key={i} className="relative pl-6 border-l-2 border-gray-200 dark:border-zinc-700 pb-6 last:pb-0 group">
                                    <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-zinc-600 ring-4 ring-white dark:ring-zinc-900 group-hover:bg-lime-500 transition-colors"></div>

                                    {/* Date & Doctor */}
                                    <div className="mb-2">
                                        <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{formatHistoryDate(hist.fecha)}</p>
                                        <p className="text-xs text-gray-500">Dr. {hist.doctor}</p>
                                    </div>

                                    {/* Actions Grid */}
                                    <div className="space-y-2">
                                        {/* Diagnosis - Always present or at least generic */}
                                        <button
                                            onClick={() => openHistoryModal("Diagnóstico Médico", (
                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="text-xs font-bold text-gray-500 uppercase">Descripción</label>
                                                        <p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-zinc-800 p-3 rounded-lg mt-1 text-sm">
                                                            {hist.diagnostico?.descripcion || "Sin descripción"}
                                                        </p>
                                                    </div>
                                                    {hist.diagnostico?.notas && (
                                                        <div>
                                                            <label className="text-xs font-bold text-gray-500 uppercase">Notas / Tratamiento</label>
                                                            <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-zinc-800 p-3 rounded-lg mt-1 text-sm whitespace-pre-wrap">
                                                                {hist.diagnostico.notas}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                            className="flex items-center gap-2 w-full text-left p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 border border-transparent hover:border-gray-100 transition-all group/btn"
                                        >
                                            <div className="p-1.5 rounded-md bg-lime-100 text-lime-700 group-hover/btn:bg-lime-200 transition-colors">
                                                <FileText size={16} />
                                            </div>
                                            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Diagnóstico Médico</span>
                                        </button>

                                        {/* Prescription */}
                                        {hist.receta && (
                                            <button
                                                onClick={() => openHistoryModal("Receta Médica", (
                                                    <div className="space-y-2">
                                                        {hist.receta.detalles.map((d: any, idx: number) => (
                                                            <div key={idx} className="bg-gray-50 dark:bg-zinc-800 p-3 rounded-lg border border-gray-100 dark:border-zinc-700">
                                                                <div className="flex justify-between items-start">
                                                                    <p className="font-bold text-gray-900 dark:text-white">{d.medicamento}</p>
                                                                    <span className="text-xs bg-lime-100 text-lime-700 px-2 py-0.5 rounded-full font-medium">{d.dosis}</span>
                                                                </div>
                                                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                                                    {d.frecuencia} • {d.duracion}
                                                                </p>
                                                                {d.instrucciones && (
                                                                    <p className="text-xs text-gray-500 mt-1 italic">"{d.instrucciones}"</p>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                ))}
                                                className="flex items-center gap-2 w-full text-left p-2 rounded-lg hover:bg-lime-50/50 dark:hover:bg-lime-900/10 border border-transparent hover:border-lime-100 transition-all group/btn"
                                            >
                                                <div className="p-1.5 rounded-md bg-green-100 text-green-700 group-hover/btn:bg-green-200 transition-colors">
                                                    <Pill size={16} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Receta Médica</span>
                                                    <span className="text-[10px] text-gray-500">{hist.receta.detalles.length} medicamentos</span>
                                                </div>
                                            </button>
                                        )}

                                        {/* Orders (Placeholder for future) */}
                                        {hist.ordenes && hist.ordenes.length > 0 && (
                                            <button
                                                onClick={() => openHistoryModal("Órdenes y Estudios", (
                                                    <div className="space-y-2">
                                                        {hist.ordenes.map((ord: any, idx: number) => (
                                                            <div key={idx} className="bg-gray-50 dark:bg-zinc-800 p-3 rounded-lg flex justify-between items-center">
                                                                <span className="font-medium text-sm text-gray-800 dark:text-gray-200">{ord.estudio}</span>
                                                                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-100">{ord.tipo}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ))}
                                                className="flex items-center gap-2 w-full text-left p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/10 border border-transparent hover:border-blue-100 transition-all group/btn"
                                            >
                                                <div className="p-1.5 rounded-md bg-blue-100 text-blue-700 group-hover/btn:bg-blue-200 transition-colors">
                                                    <ClipboardList size={16} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Órdenes</span>
                                                    <span className="text-[10px] text-gray-500">{hist.ordenes.length} estudios</span>
                                                </div>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Reusable History Details Modal */}
            <Modal
                isOpen={historyModal.isOpen}
                onClose={() => setHistoryModal({ ...historyModal, isOpen: false })}
                title={historyModal.title}
            >
                {historyModal.content}
            </Modal>
        </div >
    );
}

function StethoscopeIcon({ active }: { active: boolean }) {
    return <Stethoscope className={active ? "text-lime-500" : "text-gray-400"} size={18} />;
}
