"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    Loader2, ArrowLeft, Siren, Activity, Heart, Clock, UserCheck, Ban, Shield,
    FileText, Phone, AlertTriangle, Plus, CheckCircle, XCircle
} from "lucide-react";

export default function EmergenciaDetallePage() {
    const params = useParams();
    const router = useRouter();
    const [emergencia, setEmergencia] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);

    // Carta Aval form
    const [showCartaModal, setShowCartaModal] = useState(false);
    const [cartaForm, setCartaForm] = useState({ polizaId: "", codigoAval: "", montoAprobado: "", estado: "SOLICITADA", observaciones: "" });
    const [isSavingCarta, setIsSavingCarta] = useState(false);

    const fetchData = async () => {
        try {
            const res = await fetch(`/api/emergency/${params.id}`);
            if (res.ok) setEmergencia(await res.json());
        } catch (e) { console.error(e); }
        finally { setIsLoading(false); }
    };

    useEffect(() => { fetchData(); }, [params.id]);

    const updateStatus = async (field: string, value: string) => {
        setIsUpdating(true);
        try {
            await fetch(`/api/emergency/${params.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ [field]: value })
            });
            fetchData();
        } catch (e) { console.error(e); }
        finally { setIsUpdating(false); }
    };

    const submitCartaAval = async () => {
        if (!cartaForm.polizaId) return;
        setIsSavingCarta(true);
        try {
            await fetch(`/api/emergency/${params.id}/carta-aval`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...cartaForm,
                    montoAprobado: cartaForm.montoAprobado ? parseFloat(cartaForm.montoAprobado) : null,
                    codigoAval: cartaForm.codigoAval || null,
                    observaciones: cartaForm.observaciones || null,
                })
            });
            setShowCartaModal(false);
            setCartaForm({ polizaId: "", codigoAval: "", montoAprobado: "", estado: "SOLICITADA", observaciones: "" });
            fetchData();
        } catch (e) { console.error(e); }
        finally { setIsSavingCarta(false); }
    };

    if (isLoading) return (
        <div className="flex justify-center items-center min-h-[60vh]">
            <Loader2 className="animate-spin text-red-500" size={32} />
        </div>
    );

    if (!emergencia) return (
        <div className="text-center py-16 text-gray-400">Emergencia no encontrada.</div>
    );

    const urgencyColors: Record<string, string> = {
        CRITICO: "bg-red-600 text-white", URGENTE: "bg-orange-500 text-white",
        MODERADO: "bg-yellow-500 text-white", LEVE: "bg-green-500 text-white",
    };

    const statusSteps = [
        { key: "TRIAJE", label: "Triaje", icon: Activity },
        { key: "EN_ATENCION", label: "En Atención", icon: Heart },
        { key: "HOSPITALIZADO", label: "Hospitalizado", icon: Clock },
        { key: "CIRUGIA_URGENTE", label: "Cirugía Urgente", icon: Siren },
        { key: "ALTA", label: "Alta Médica", icon: UserCheck },
    ];

    const polizas = emergencia.paciente?.polizas || [];

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Back */}
            <button onClick={() => router.push("/emergencias")} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors">
                <ArrowLeft size={16} /> Volver a Emergencias
            </button>

            {/* Header */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Siren size={24} className="text-red-500" />
                            {emergencia.paciente.nombres} {emergencia.paciente.apellidos}
                        </h1>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <span>{emergencia.paciente.documentoIdentidad || "Sin documento"}</span>
                            {emergencia.paciente.telefono && <span className="flex items-center gap-1"><Phone size={12} />{emergencia.paciente.telefono}</span>}
                            <span className="flex items-center gap-1"><Clock size={12} /> Ingreso: {new Date(emergencia.fechaIngreso).toLocaleString('es-VE')}</span>
                        </div>
                    </div>
                    <span className={`inline-flex rounded-full px-3 py-1 text-sm font-bold ${urgencyColors[emergencia.nivelUrgencia]}`}>
                        {emergencia.nivelUrgencia}
                    </span>
                </div>
                <div className="mt-4 p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Motivo de ingreso:</p>
                    <p className="text-gray-600 dark:text-gray-400">{emergencia.motivoIngreso}</p>
                </div>
            </div>

            {/* Status Timeline */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Estado del Caso</h2>
                <div className="flex items-center gap-2 flex-wrap">
                    {statusSteps.map((step) => {
                        const StepIcon = step.icon;
                        const isActive = emergencia.estadoEmergencia === step.key;
                        const isReferido = emergencia.estadoEmergencia === 'REFERIDO';

                        return (
                            <button
                                key={step.key}
                                onClick={() => updateStatus('estadoEmergencia', step.key)}
                                disabled={isUpdating || isReferido}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
                                    isActive
                                        ? 'bg-red-600 text-white border-red-600'
                                        : 'bg-white dark:bg-zinc-800 text-gray-500 border-gray-200 dark:border-zinc-700 hover:border-red-300'
                                }`}
                            >
                                <StepIcon size={14} /> {step.label}
                            </button>
                        );
                    })}
                    <button
                        onClick={() => updateStatus('estadoEmergencia', 'REFERIDO')}
                        disabled={isUpdating}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
                            emergencia.estadoEmergencia === 'REFERIDO'
                                ? 'bg-gray-600 text-white border-gray-600'
                                : 'bg-white dark:bg-zinc-800 text-gray-400 border-gray-200 dark:border-zinc-700 hover:border-gray-400'
                        }`}
                    >
                        <Ban size={14} /> Referido
                    </button>
                </div>
            </div>

            {/* Payment Verification & Insurance */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Payment Status */}
                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-6">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-3">Verificación de Pago</h3>
                    <div className="space-y-3">
                        <div className="flex gap-2">
                            {(['PENDIENTE', 'CONFIRMADO', 'SIN_COBERTURA'] as const).map(v => (
                                <button
                                    key={v}
                                    onClick={() => updateStatus('verificacionPago', v)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                        emergencia.verificacionPago === v
                                            ? v === 'CONFIRMADO' ? 'bg-green-600 text-white' : v === 'SIN_COBERTURA' ? 'bg-red-600 text-white' : 'bg-amber-500 text-white'
                                            : 'bg-gray-100 dark:bg-zinc-800 text-gray-500'
                                    }`}
                                >
                                    {v === 'CONFIRMADO' ? '✓ Confirmado' : v === 'SIN_COBERTURA' ? '✗ Sin Cobertura' : '⏳ Pendiente'}
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <span className="text-sm text-gray-500">Tipo:</span>
                            {(['PARTICULAR', 'ASEGURADO'] as const).map(t => (
                                <button
                                    key={t}
                                    onClick={() => updateStatus('tipoPago', t)}
                                    className={`px-2 py-1 rounded text-xs font-semibold transition-all ${
                                        emergencia.tipoPago === t
                                            ? t === 'ASEGURADO' ? 'bg-blue-600 text-white' : 'bg-lime-600 text-white'
                                            : 'bg-gray-100 dark:bg-zinc-800 text-gray-400'
                                    }`}
                                >
                                    {t === 'ASEGURADO' ? 'Asegurado' : 'Particular'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Insurance Info */}
                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-6">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Shield size={16} className="text-blue-500" /> Seguro Médico
                        </h3>
                        {polizas.length > 0 && (
                            <button
                                onClick={() => {
                                    setCartaForm({ ...cartaForm, polizaId: polizas[0].polizaId });
                                    setShowCartaModal(true);
                                }}
                                className="text-xs bg-blue-600 text-white px-2 py-1 rounded flex items-center gap-1 hover:bg-blue-700"
                            >
                                <Plus size={12} /> Carta Aval
                            </button>
                        )}
                    </div>
                    {polizas.length === 0 ? (
                        <div className="text-center py-4 text-gray-400 text-sm">
                            <AlertTriangle size={20} className="mx-auto mb-1 text-amber-400" />
                            Sin póliza de seguro activa
                        </div>
                    ) : (
                        polizas.map((p: any) => (
                            <div key={p.polizaId} className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm">
                                <p className="font-semibold text-blue-800 dark:text-blue-300">{p.aseguradora.nombre}</p>
                                <p className="text-blue-600 dark:text-blue-400">Póliza: {p.numeroPoliza}</p>
                                {p.tipoCobertura && <p className="text-blue-500">Cobertura: {p.tipoCobertura}</p>}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Cartas Aval */}
            {emergencia.cartasAval.length > 0 && (
                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-6">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <FileText size={16} /> Cartas Aval / Claves de Atención
                    </h3>
                    <div className="space-y-2">
                        {emergencia.cartasAval.map((c: any) => (
                            <div key={c.cartaAvalId} className={`p-3 rounded-lg border text-sm flex items-center justify-between ${
                                c.estado === 'APROBADA' ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800' :
                                c.estado === 'RECHAZADA' ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800' :
                                'bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700'
                            }`}>
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                        {c.aseguradora} — {c.codigoAval || "Sin código"}
                                    </p>
                                    {c.montoAprobado && <p className="text-gray-500">${Number(c.montoAprobado).toFixed(2)} aprobados</p>}
                                </div>
                                <span className={`inline-flex items-center gap-1 text-xs font-semibold ${
                                    c.estado === 'APROBADA' ? 'text-green-600' : c.estado === 'RECHAZADA' ? 'text-red-600' : 'text-amber-600'
                                }`}>
                                    {c.estado === 'APROBADA' ? <CheckCircle size={12} /> : c.estado === 'RECHAZADA' ? <XCircle size={12} /> : <Clock size={12} />}
                                    {c.estado}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Carta Aval Modal */}
            {showCartaModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-md border border-gray-200 dark:border-zinc-800">
                        <div className="p-6 border-b border-gray-200 dark:border-zinc-800">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Registrar Carta Aval</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Código Aval / Clave</label>
                                <input type="text" value={cartaForm.codigoAval}
                                    onChange={e => setCartaForm({ ...cartaForm, codigoAval: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="CLV-0001234" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Monto Aprobado ($)</label>
                                <input type="number" step="0.01" value={cartaForm.montoAprobado}
                                    onChange={e => setCartaForm({ ...cartaForm, montoAprobado: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="0.00" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estado</label>
                                <select value={cartaForm.estado}
                                    onChange={e => setCartaForm({ ...cartaForm, estado: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none">
                                    <option value="SOLICITADA">Solicitada</option>
                                    <option value="APROBADA">Aprobada</option>
                                    <option value="RECHAZADA">Rechazada</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observaciones</label>
                                <input type="text" value={cartaForm.observaciones}
                                    onChange={e => setCartaForm({ ...cartaForm, observaciones: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Notas..." />
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-200 dark:border-zinc-800 flex justify-end gap-3">
                            <button onClick={() => setShowCartaModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                            <button onClick={submitCartaAval} disabled={isSavingCarta}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                                {isSavingCarta && <Loader2 size={16} className="animate-spin" />}
                                Guardar Carta Aval
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
