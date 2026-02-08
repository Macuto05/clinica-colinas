"use client";

import { useState, useEffect } from "react";
import { CLINICAL_HISTORY_SECTIONS, ClinicalField } from "@/lib/clinical-history-config";
import { AccordionItem } from "@/components/ui/Accordion";
import { Loader2, Save, AlertCircle, CheckCircle, FileDown } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { generateClinicalHistoryPDF } from "@/lib/generate-history-pdf";

interface ClinicalHistoryFormProps {
    patientId: string | number;
    patientData: any;
    isReadOnly?: boolean;
}

export function ClinicalHistoryForm({ patientId, patientData, isReadOnly = false }: ClinicalHistoryFormProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Store all form data in a flat JSON structure
    // Key = field ID, Value = { checked: boolean, text: string } OR string
    // To be flexible: Key = ID, Value = any
    const [formData, setFormData] = useState<Record<string, any>>({});

    // Fetch History
    useEffect(() => {
        if (!patientId) {
            setLoading(false);
            return;
        }
        setLoading(true);
        fetch(`/api/doctor/patients/${patientId}/clinical-history`)
            .then(res => res.json())
            .then(data => {
                if (data.contenido) {
                    setFormData(data.contenido);
                }
            })
            .catch(err => {
                console.error("Error loading history:", err);
                toast.error("No se pudo cargar la historia clínica");
            })
            .finally(() => setLoading(false));
    }, [patientId]);

    const handleDownloadPDF = () => {
        try {
            generateClinicalHistoryPDF(patientData, formData);
            toast.success("PDF descargado");
        } catch (error) {
            console.error(error);
            toast.error("Error al generar PDF");
        }
    };

    // Specific Handlers
    const updateCheckboxField = (id: string, val: { checked?: boolean, text?: string }) => {
        setFormData(prev => ({
            ...prev,
            [id]: { ...(prev[id] || {}), ...val }
        }));
    };

    const updateTextField = (id: string, val: string) => {
        setFormData(prev => ({ ...prev, [id]: val }));
    };

    const handleSave = async () => {
        if (!(user as any)?.id) {
            toast.error("Usuario no identificado");
            return;
        }

        setSaving(true);
        try {
            const res = await fetch(`/api/doctor/patients/${patientId}/clinical-history`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contenido: formData,
                    updatedById: (user as any).id
                })
            });

            if (res.ok) {
                toast.success("Historia clínica actualizada");
            } else {
                toast.error("Error al guardar");
            }
        } catch (error) {
            console.error(error);
            toast.error("Error de conexión");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-lime-500" /></div>;

    const renderField = (field: ClinicalField) => {
        const val = formData[field.id]; // Could be string or { checked, text }

        if (field.type === 'checkbox') {
            const isChecked = val?.checked || false;
            const textVal = val?.text || "";

            return (
                <div key={field.id} className="flex items-start gap-3 p-2 hover:bg-gray-50 dark:hover:bg-zinc-800/50 rounded-lg transition-colors">
                    <div className="flex items-center h-5">
                        <input
                            type="checkbox"
                            disabled={isReadOnly}
                            checked={isChecked}
                            onChange={(e) => updateCheckboxField(field.id, { checked: e.target.checked })}
                            className="w-4 h-4 text-lime-600 border-gray-300 rounded focus:ring-lime-500 disabled:opacity-50"
                        />
                    </div>
                    <div className="flex-1 space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer block" onClick={() => !isReadOnly && updateCheckboxField(field.id, { checked: !isChecked })}>
                            {field.label}
                        </label>
                        {isChecked && (
                            <input
                                type="text"
                                disabled={isReadOnly}
                                value={textVal}
                                onChange={(e) => updateCheckboxField(field.id, { text: e.target.value })}
                                placeholder="Detalles / Observaciones..."
                                className="w-full text-xs p-1.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded focus:border-lime-500 outline-none"
                            />
                        )}
                    </div>
                </div>
            );
        }

        if (field.type === 'text') {
            const textVal = typeof val === 'string' ? val : (val?.text || "");

            return (
                <div key={field.id} className="mb-3">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">
                        {field.label}
                    </label>
                    <input
                        type="text"
                        disabled={isReadOnly}
                        value={textVal}
                        onChange={(e) => updateTextField(field.id, e.target.value)}
                        className="w-full p-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-lime-500 outline-none transition-all text-sm"
                        placeholder="Sin hallazgos..."
                    />
                </div>
            );
        }

        return null;
    };
    return (
        <div className="space-y-6">
            {/* ... Existing header ... */}

            <div className="custom-scrollbar pr-2 space-y-1">
                {/* ... Sections map ... */}
                {CLINICAL_HISTORY_SECTIONS.map((section, index) => {
                    // ... header logic ...
                    const showPart1Header = index === 0;
                    const showPart2Header = section.id === "p2_1_examen_fisico_general";

                    return (
                        <div key={section.id}>
                            {showPart1Header && (
                                <div className="py-4 flex items-center gap-4">
                                    <div className="h-px flex-1 bg-gray-200 dark:bg-zinc-700"></div>
                                    <h3 className="font-bold text-lg text-lime-600 dark:text-lime-400 uppercase tracking-widest">
                                        Parte 1: Antecedentes
                                    </h3>
                                    <div className="h-px flex-1 bg-gray-200 dark:bg-zinc-700"></div>
                                </div>
                            )}

                            {showPart2Header && (
                                <div className="py-6 flex items-center gap-4 mt-6">
                                    <div className="h-px flex-1 bg-gray-200 dark:bg-zinc-700"></div>
                                    <h3 className="font-bold text-lg text-lime-600 dark:text-lime-400 uppercase tracking-widest">
                                        Parte 2: Examen Físico
                                    </h3>
                                    <div className="h-px flex-1 bg-gray-200 dark:bg-zinc-700"></div>
                                </div>
                            )}

                            <AccordionItem title={section.title}>
                                <div className={`grid gap-4 ${section.id.includes('antecedentes') ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'}`}>
                                    {section.fields.map(field => renderField(field))}
                                </div>
                            </AccordionItem>
                        </div>
                    );
                })}
            </div>

            <div className="flex justify-end pt-4 gap-4">
                <button
                    onClick={handleDownloadPDF}
                    className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-700 text-gray-700 dark:text-gray-200 font-bold rounded-xl shadow-sm transition-all"
                >
                    <FileDown size={18} />
                    Descargar PDF
                </button>

                {!isReadOnly && (
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-3 bg-lime-600 hover:bg-lime-700 text-white font-bold rounded-xl shadow-lg shadow-lime-500/20 transition-all disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                        Guardar Cambios
                    </button>
                )}
            </div>
        </div>
    );
}
