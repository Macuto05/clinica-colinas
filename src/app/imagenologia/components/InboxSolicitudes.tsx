"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ClipboardList, User, CheckCircle2, AlertCircle, ArrowRight, X, Loader2, RefreshCcw, Activity, Filter, UploadCloud, Eye, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@supabase/supabase-js";
import { toast } from "sonner";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

interface Examen {
    detalleImgId: string;
    examenId: string;
    nombre: string;
    atendido: boolean;
    documentoUrl?: string;
}

interface Solicitud {
    solicitudImgId: string;
    estadoSolicitud: string;
    fechaSolicitud: string;
    paciente: string;
    cedula: string;
    emergenciaId: string | null;
    triage: string;
    solicitante: string;
    observaciones?: string;
    examenes: Examen[];
}

interface PatientGroup {
    pacienteId: string;
    pacienteNombre: string;
    cedula: string;
    emergenciaId: string | null;
    triage: string;
    solicitudes: Solicitud[];
}

export default function InboxSolicitudes() {
    const [groups, setGroups] = useState<PatientGroup[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<"nuevas" | "historial">("nuevas");
    const [expandedRequests, setExpandedRequests] = useState<Set<string>>(new Set());
    const [actionStatusMap, setActionStatusMap] = useState<Record<string, { type: 'success' | 'error', message: string } | null>>({});

    const [processingDetalleId, setProcessingDetalleId] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadForm, setUploadForm] = useState<{ obs: string, fileName: string, file: File | null, objectUrl: string }>({ obs: "", fileName: "", file: null, objectUrl: "" });

    const toggleRequest = (id: string) => {
        setExpandedRequests(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const fetchSolicitudes = async (mode: "nuevas" | "historial") => {
        setIsLoading(true);
        try {
            let url = "/api/imagenologia/solicitudes?group=patient";
            if (mode === "historial") {
                url += "&history=true";
            }


            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setGroups(data);
            }
        } catch (error) {
            console.error("Error fetching solicitudes img:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSolicitudes(viewMode);
        setSelectedPatientId(null);
    }, [viewMode]);

    useEffect(() => {
        setExpandedRequests(new Set());
        setActionStatusMap({}); 
        setProcessingDetalleId(null);
    }, [selectedPatientId]);


    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        if (files.length > 1) {
            toast.error("Solo se permite adjuntar 1 archivo por estudio");
            return;
        }

        const file = files[0];
        const objectUrl = URL.createObjectURL(file);
        
        setUploadForm(prev => ({ 
            ...prev, 
            fileName: file.name, 
            file: file,
            objectUrl: objectUrl
        }));
    };

    const handleAtenderExamen = async (solicitudId: string, detalleImgId: string) => {
        if (!uploadForm.file) {
            toast.error("Debes adjuntar un documento primero");
            return;
        }

        setIsUploading(true);
        try {
            // 1. Upload to Supabase Storage
            const fileExt = uploadForm.fileName.split('.').pop() || 'pdf';
            const uniqueName = `img_${solicitudId}_${detalleImgId}_${Date.now()}.${fileExt}`;
            
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('imagenologia-resultados')
                .upload(uniqueName, uploadForm.file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) {
                throw new Error("Error al subir archivo a la nube: " + uploadError.message);
            }

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('imagenologia-resultados')
                .getPublicUrl(uniqueName);

            // 3. Save in DB
            const res = await fetch(`/api/imagenologia/solicitudes/${solicitudId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    detalleImgId,
                    observacionGeneral: uploadForm.obs,
                    documentoUrl: publicUrl,
                    nombreArchivo: uploadForm.fileName
                })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || `Error al procesar`);
            }
            
            toast.success("Estudio cargado correctamente");
            setActionStatusMap(prev => ({ ...prev, [detalleImgId]: { type: 'success', message: "Resultado Guardado" } }));
            
            setTimeout(() => {
                fetchSolicitudes(viewMode);
                setProcessingDetalleId(null);
                setUploadForm({ obs: "", fileName: "", file: null, objectUrl: "" });
            }, 1000);

        } catch (error: any) {
            console.error("Upload error img:", error);
            toast.error(error.message);
            setActionStatusMap(prev => ({ ...prev, [detalleImgId]: { type: 'error', message: error.message } }));
        } finally {
            setIsUploading(false);
        }
    };

    const selectedGroup = groups.find(g => g.pacienteId === selectedPatientId);

    const getTriageColor = (triage: string) => {
        switch (triage?.toUpperCase()) {
            case "ROJO": return "bg-red-500 shadow-red-500/30";
            case "NARANJA": return "bg-orange-500 shadow-orange-500/30";
            case "AMARILLO": return "bg-amber-400 shadow-amber-400/30";
            case "VERDE": return "bg-emerald-500 shadow-emerald-500/30";
            default: return "bg-blue-500 shadow-blue-500/30";
        }
    };

    if (isLoading && groups.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Loader2 className="animate-spin text-[#a1db4b]" size={40} />
                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest animate-pulse">Cargando...</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
            {/* Sidebar / List */}
            <div className="lg:col-span-4 flex flex-col gap-4 overflow-y-auto max-h-[80vh] custom-scrollbar pr-2">
                
                <div className="flex p-1 bg-gray-100 rounded-2xl mb-4 border border-gray-200">
                    <button 
                        onClick={() => { setViewMode("nuevas"); }}
                        className={`flex-1 py-2 text-[9px] uppercase font-black tracking-widest rounded-xl transition-all ${viewMode === "nuevas" ? "bg-white text-lime-600 shadow-sm border border-lime-100" : "text-gray-400 hover:text-gray-600"}`}
                    >
                        Nuevas / En Proceso
                    </button>
                    <button 
                        onClick={() => { setViewMode("historial"); }}
                        className={`flex-1 py-2 text-[9px] uppercase font-black tracking-widest rounded-xl transition-all ${viewMode === "historial" ? "bg-white text-lime-600 shadow-sm border border-lime-100" : "text-gray-400 hover:text-gray-600"}`}
                    >
                        Historial (Completadas)
                    </button>
                </div>

                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        {viewMode === "nuevas" ? <ClipboardList size={14} className="text-lime-500" /> : <Filter size={14} className="text-[#a1db4b]" />}
                        {viewMode === "nuevas" ? "Pacientes con Peticiones" : "Historial"}
                    </h2>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => fetchSolicitudes(viewMode)}
                            disabled={isLoading}
                            className="p-1.5 hover:bg-white rounded-lg text-gray-400 hover:text-lime-500 transition-all active:rotate-180 duration-500"
                        >
                            <RefreshCcw size={14} className={isLoading ? "animate-spin" : ""} />
                        </button>
                        <span className="px-2 py-0.5 bg-lime-500/10 text-lime-600 rounded-full text-[10px] font-black border border-lime-200/50">
                            {groups.length}
                        </span>
                    </div>
                </div>

                <AnimatePresence mode="popLayout">
                    {groups.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white/40 backdrop-blur-sm border border-dashed border-white/60 p-12 rounded-[2rem] flex flex-col items-center text-center"
                        >
                            <Activity size={48} className="text-gray-300 mb-4" />
                            <p className="text-gray-400 font-bold text-sm">No hay peticiones radiológicas.</p>
                        </motion.div>
                    ) : (
                        groups.map((g) => (
                            <motion.button
                                layout
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                onClick={() => setSelectedPatientId(g.pacienteId)}
                                key={g.pacienteId}
                                className={`group p-5 rounded-[1.5rem] border transition-all text-left relative overflow-hidden ${
                                    selectedPatientId === g.pacienteId
                                        ? "bg-white border-[#a1db4b] shadow-xl shadow-lime-500/10 scale-[1.02] ring-2 ring-lime-500/20"
                                        : "bg-white/40 border-white/60 hover:bg-white/70 hover:border-lime-400 hover:shadow-lg hover:shadow-lime-500/5"
                                }`}
                            >
                                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${viewMode === "nuevas" ? getTriageColor(g.triage) : 'bg-lime-500'}`} />
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-[10px] font-mono font-black text-gray-400 uppercase bg-gray-100 px-2 py-0.5 rounded-full">
                                        C.I: {g.cedula}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <div className="px-2 py-0.5 bg-lime-500 text-white rounded-lg text-[8px] font-black">
                                            {g.solicitudes.length} PEDIDOS
                                        </div>
                                    </div>
                                </div>
                                <h4 className="font-black text-gray-900 tracking-tight leading-none mb-1 transition-colors">
                                    {g.pacienteNombre}
                                </h4>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">ORIGEN: {g.emergenciaId ? `EMERGENCIA-${g.emergenciaId}` : 'CONSULTA'}</p>
                            </motion.button>
                        ))
                    )}
                </AnimatePresence>
            </div>

            {/* Detail View */}
            <div className="lg:col-span-8 flex flex-col min-h-[600px]">
                <AnimatePresence mode="wait">
                    {selectedGroup ? (
                        <motion.div
                            key={selectedPatientId}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="bg-white/70 backdrop-blur-2xl border border-white/80 rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] flex flex-col h-full overflow-hidden"
                        >
                            <div className="p-8 border-b border-white/50 bg-white/30">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-5">
                                        <div className={`p-4 rounded-[1.5rem] text-white shadow-lg ${viewMode === "nuevas" ? getTriageColor(selectedGroup.triage) : 'bg-lime-500 shadow-lime-200'}`}>
                                            <User size={32} strokeWidth={2.5} />
                                        </div>
                                        <div>
                                            <h3 className="text-3xl font-black text-gray-900 tracking-tighter uppercase leading-none">
                                                {selectedGroup.pacienteNombre}
                                            </h3>
                                            <div className="flex items-center gap-3 mt-2">
                                                <span className="text-[10px] font-mono font-black text-gray-400 bg-white/50 px-3 py-1 rounded-full border border-white uppercase">
                                                    C.I: {selectedGroup.cedula}
                                                </span>
                                                <span className="text-[10px] font-mono font-black text-lime-600 bg-lime-50 px-3 py-1 rounded-full border border-lime-100 uppercase">
                                                    ID EMG: {selectedGroup.emergenciaId ?? 'SIN ID'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-3">
                                        <button 
                                            onClick={() => setSelectedPatientId(null)}
                                            className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-400 hover:text-gray-600 rounded-full transition-all"
                                        >
                                            <X size={20} strokeWidth={3} />
                                        </button>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Solicitudes Totales</p>
                                            <span className={`px-4 py-1.5 rounded-full text-xs font-black border uppercase tracking-widest bg-lime-500/10 text-lime-600 border-lime-200/50`}>
                                                {selectedGroup.solicitudes.length} PETICIONES
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                                <div className="space-y-6">
                                    {selectedGroup.solicitudes.map((sol) => {
                                        const isExpanded = expandedRequests.has(sol.solicitudImgId);
                                        const unAttendedCount = sol.examenes.filter(e => !e.atendido).length;

                                        return (
                                            <div key={sol.solicitudImgId} 
                                                 className={`relative rounded-3xl border transition-all overflow-hidden ${
                                                     isExpanded ? 'bg-white/80 shadow-lg border-white/60' : 'bg-white/40 border-white/40 hover:bg-white/60'
                                                 }`}>
                                                
                                                <div className="relative">
                                                    <button 
                                                        onClick={() => toggleRequest(sol.solicitudImgId)}
                                                        className="w-full p-5 flex items-center justify-between text-left outline-none group relative z-10"
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transform transition-transform ${isExpanded ? 'rotate-90 bg-lime-500 text-white' : 'bg-white shadow-sm text-gray-400 group-hover:scale-110'}`}>
                                                                <ArrowRight size={18} strokeWidth={3} />
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-3">
                                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Petición #{sol.solicitudImgId}</p>
                                                                    {viewMode === 'nuevas' && (
                                                                        <span className={`px-2 py-0.5 text-[8px] font-black rounded-full border uppercase tracking-widest ${
                                                                            unAttendedCount === 0
                                                                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200/50'
                                                                            : 'bg-amber-500/10 text-amber-600 border-amber-200/50'
                                                                        }`}>
                                                                            {unAttendedCount === 0 ? 'TODO CARGADO' : `${unAttendedCount} PENDIENTES`}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <h4 className="font-bold text-gray-800 text-sm mt-0.5">
                                                                    {format(new Date(sol.fechaSolicitud), "EEEE d 'de' MMMM, HH:mm", { locale: es })}
                                                                </h4>
                                                            </div>
                                                        </div>
                                                        <div className="text-right flex items-center gap-4">
                                                            <div className="hidden sm:block">
                                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">Estudios</p>
                                                                <p className="text-lg font-black text-gray-900 leading-none mt-1">{sol.examenes.length}</p>
                                                            </div>
                                                            <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${isExpanded ? 'bg-lime-500 border-lime-400 text-white' : 'bg-white/50 border-white/80 text-gray-400'}`}>
                                                                {isExpanded ? <CheckCircle2 size={12} strokeWidth={3} /> : <AlertCircle size={12} strokeWidth={3} />}
                                                            </div>
                                                        </div>
                                                    </button>
                                                </div>

                                                <AnimatePresence>
                                                    {isExpanded && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: "auto", opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            transition={{ duration: 0.3, ease: "easeInOut" }}
                                                        >
                                                            <div className="px-5 pb-5 pt-2 space-y-4 border-t border-white/40">
                                                                {sol.examenes.map((examen) => (
                                                                    <div key={examen.detalleImgId} className="flex flex-col p-4 bg-white/50 border border-white/60 rounded-2xl">
                                                                        <div className="flex items-center justify-between mb-2">
                                                                            <div className="flex items-center gap-3">
                                                                                <div className={`w-2 h-10 rounded-full ${
                                                                                    examen.atendido ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]' : 'bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                                                                                }`} />
                                                                                <div>
                                                                                    <p className="font-bold text-gray-900 text-sm">{examen.nombre}</p>
                                                                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                                                                        {examen.atendido ? 'COMPLETADO' : 'PENDIENTE'}
                                                                                    </p>
                                                                                </div>
                                                                            </div>
                                                                            {viewMode === "nuevas" && !examen.atendido && processingDetalleId !== examen.detalleImgId && (
                                                                                <button
                                                                                    onClick={() => {
                                                                                        setProcessingDetalleId(examen.detalleImgId);
                                                                                        setUploadForm({ obs: "", file: null, fileName: "", objectUrl: "" });
                                                                                    }}
                                                                                    className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all shadow-sm"
                                                                                >
                                                                                    Cargar Estudio / Informe
                                                                                </button>
                                                                            )}
                                                                            {viewMode === "historial" && examen.documentoUrl && (
                                                                                <button
                                                                                    onClick={() => window.open(examen.documentoUrl, '_blank')}
                                                                                    className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all shadow-sm flex items-center gap-2"
                                                                                >
                                                                                    <Eye size={12} /> Ver Resultado
                                                                                </button>
                                                                            )}
                                                                        </div>

                                                                        <AnimatePresence>
                                                                            {processingDetalleId === examen.detalleImgId && !examen.atendido && (
                                                                                <motion.div 
                                                                                    initial={{ height: 0, opacity: 0 }}
                                                                                    animate={{ height: "auto", opacity: 1 }}
                                                                                    exit={{ height: 0, opacity: 0 }}
                                                                                    className="bg-white border border-gray-100 rounded-xl p-4 mt-2 shadow-inner"
                                                                                >
                                                                                    <div className="space-y-4">
                                                                                        <div>
                                                                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 shadow-none block">Informe del Médico Radiólogo / Técnico (Opcional)</label>
                                                                                            <textarea 
                                                                                                value={uploadForm.obs}
                                                                                                onChange={e => setUploadForm(p => ({...p, obs: e.target.value}))}
                                                                                                className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-sm focus:ring-2 focus:ring-lime-500/20 outline-none transition-all resize-none h-20"
                                                                                                placeholder="Escribe el informe o alguna nota..."
                                                                                            />
                                                                                        </div>
                                                                                        
                                                                                        <div className="flex flex-col gap-3">
                                                                                            {!uploadForm.file ? (
                                                                                                <label className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-lime-400 hover:bg-lime-50/50 transition-all min-h-[120px]">
                                                                                                    <UploadCloud className="text-gray-400 mb-2" size={28} />
                                                                                                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                                                                                        Adjuntar PDF o Foto (Rayos X)
                                                                                                    </span>
                                                                                                    <input type="file" className="hidden" accept=".pdf,image/png,image/jpeg" multiple={false} onChange={handleFileChange} />
                                                                                                </label>
                                                                                            ) : (
                                                                                                <div className="border-2 border-solid border-lime-200 bg-lime-50 rounded-xl p-4 flex items-center justify-between">
                                                                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                                                                        <CheckCircle2 className="text-lime-500 shrink-0" size={24} />
                                                                                                        <span className="text-xs font-bold text-lime-700 truncate">
                                                                                                            {uploadForm.fileName}
                                                                                                        </span>
                                                                                                    </div>
                                                                                                </div>
                                                                                            )}

                                                                                            <div className="flex items-center gap-2 mt-2">
                                                                                                {uploadForm.file ? (
                                                                                                    <>
                                                                                                        <button
                                                                                                            disabled={isUploading}
                                                                                                            onClick={() => window.open(uploadForm.objectUrl, '_blank')}
                                                                                                            className="flex-1 py-3 bg-blue-50 text-blue-600 rounded-xl font-black uppercase tracking-widest text-[9px] hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
                                                                                                        >
                                                                                                            <Eye size={14} /> Previsualizar
                                                                                                        </button>
                                                                                                        <button
                                                                                                            disabled={isUploading}
                                                                                                            onClick={() => setUploadForm({ obs: uploadForm.obs, fileName: "", file: null, objectUrl: "" })}
                                                                                                            className="flex-1 py-3 bg-red-50 text-red-600 rounded-xl font-black uppercase tracking-widest text-[9px] hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                                                                                                        >
                                                                                                            <Trash2 size={14} /> Eliminar
                                                                                                        </button>
                                                                                                        <button
                                                                                                            disabled={isUploading}
                                                                                                            onClick={() => handleAtenderExamen(sol.solicitudImgId, examen.detalleImgId)}
                                                                                                            className="flex-1 py-3 bg-lime-500 text-white rounded-xl font-black uppercase tracking-widest text-[9px] shadow-lg shadow-lime-500/20 hover:bg-lime-600 transition-colors flex items-center justify-center gap-2"
                                                                                                        >
                                                                                                            {isUploading ? <Loader2 size={14} className="animate-spin" /> : <><CheckCircle2 size={14} /> Confirmar Carga</>}
                                                                                                        </button>
                                                                                                    </>
                                                                                                ) : (
                                                                                                    <button
                                                                                                        onClick={() => setProcessingDetalleId(null)}
                                                                                                        className="flex-1 py-3 bg-gray-50 text-gray-400 hover:text-gray-600 rounded-xl font-black uppercase tracking-widest text-[9px] transition-colors"
                                                                                                    >
                                                                                                        Cancelar
                                                                                                    </button>
                                                                                                )}
                                                                                            </div>
                                                                                        </div>

                                                                                        {actionStatusMap[examen.detalleImgId] && (
                                                                                            <p className={`text-[10px] font-black uppercase tracking-widest text-center mt-2 ${actionStatusMap[examen.detalleImgId]?.type === 'error' ? 'text-red-500' : 'text-emerald-500'}`}>
                                                                                                {actionStatusMap[examen.detalleImgId]?.message}
                                                                                            </p>
                                                                                        )}
                                                                                    </div>
                                                                                </motion.div>
                                                                            )}
                                                                        </AnimatePresence>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-white/30 backdrop-blur-sm border border-dashed border-white/60 rounded-[2.5rem]">
                            <motion.div
                                animate={{ y: [0, -10, 0] }}
                                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                            >
                                <Activity size={64} className="text-gray-300 mb-6" />
                            </motion.div>
                            <h3 className="text-xl font-black text-gray-400 uppercase tracking-tighter">Selecciona un Paciente</h3>
                            <p className="text-gray-400 text-[10px] uppercase font-black mt-2 tracking-widest max-w-[200px]">
                                Selecciona una tarjeta para ver las peticiones radiológicas
                            </p>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
