"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { FileText, Download, Loader2, FlaskConical, Activity, FileCheck2 } from "lucide-react";
import { PageLoader } from "@/components/ui/PageLoader";

export default function ResultadosPage() {
    const { user, loading: authLoading } = useAuth();
    const [resultados, setResultados] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchResultados = async () => {
            if (!user || user.role !== 'PACIENTE') return;
            const patientId = (user as any).patientId;
            if (!patientId) return;

            try {
                const res = await fetch(`/api/patient/resultados?patientId=${patientId}`);
                if (res.ok) {
                    const data = await res.json();
                    setResultados(data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        if (user) fetchResultados();
    }, [user]);

    if (authLoading || isLoading) {
        return <PageLoader message="Cargando resultados..." minHeight="min-h-[500px]" />;
    }

    const getIconForSource = (origen: string) => {
        if (origen === "Laboratorio") return <FlaskConical className="text-purple-500" size={24} />;
        if (origen === "Imagenología") return <Activity className="text-blue-500" size={24} />;
        return <FileCheck2 className="text-emerald-500" size={24} />;
    };

    return (
        <div className="space-y-6">
            <div className="bg-white/40 backdrop-blur-md rounded-3xl p-6 shadow-[0_4px_16px_0_rgba(0,0,0,0.02)] border border-white/50">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-xl">
                        <FileText className="text-blue-600" size={24} />
                    </div>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mt-2">Mis Resultados</h1>
                <p className="text-gray-600">Visualiza y descarga tus exámenes médicos e informes.</p>
            </div>

            {resultados.length === 0 ? (
                <div className="text-center py-20 bg-white/30 backdrop-blur-sm rounded-3xl border border-dashed border-white/60 shadow-inner">
                    <FileText size={64} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-xl font-bold text-gray-400">Sin resultados disponibles</h3>
                    <p className="text-gray-500 text-sm mt-2 max-w-sm mx-auto">
                        Cuando el equipo médico publique resultados de laboratorio o imagenología, aparecerán aquí.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {resultados.map((res) => (
                        <div key={res.documentoId} className="bg-white/60 backdrop-blur-md border border-white/80 rounded-3xl p-6 shadow-sm hover:shadow-lg transition-all group flex flex-col justify-between">
                            <div>
                                <div className="flex items-start justify-between mb-4">
                                    <div className="bg-white p-3 rounded-2xl shadow-sm">
                                        {getIconForSource(res.origen)}
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 bg-gray-100/50 px-2 py-1 rounded-lg">
                                        {format(new Date(res.fecha), "dd MMM yyyy", { locale: es })}
                                    </span>
                                </div>
                                <h4 className="font-bold text-gray-900 text-lg leading-tight mb-1">{res.label}</h4>
                                <p className="text-xs font-black uppercase tracking-widest text-gray-400">{res.origen}</p>
                            </div>
                            
                            <a
                                href={res.rutaArchivo}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-6 flex items-center justify-center gap-2 w-full bg-blue-50 hover:bg-blue-100 text-blue-600 px-4 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] transition-colors"
                            >
                                <Download size={16} />
                                Descargar Archivo
                            </a>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
