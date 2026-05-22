import InboxSolicitudes from "./components/InboxSolicitudes";
import { FlaskConical, Info } from "lucide-react";

export default function LaboratorioPage() {
    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            {/* Encabezado de la página */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-[#a1db4b]/10 rounded-xl">
                            <FlaskConical className="text-[#a1db4b]" size={24} />
                        </div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase italic">
                            Gestión de <span className="text-[#a1db4b]">Laboratorio</span>
                        </h1>
                    </div>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        Bandeja de Exámenes
                    </p>
                </div>

                <div className="bg-white/40 backdrop-blur-md border border-white/60 p-4 rounded-[2rem] flex items-start gap-4 max-w-xs shadow-sm shadow-lime-500/5">
                    <Info className="text-lime-600 shrink-0 mt-0.5" size={18} />
                    <p className="text-[10px] font-bold text-gray-500 leading-relaxed uppercase tracking-tight">
                        Aquí recibes las peticiones de exámenes de <strong className="text-gray-900">Enfermería</strong> y <strong className="text-gray-900">Médico</strong>. Selecciona un paciente para cargar resultados y atender facturación.
                    </p>
                </div>
            </div>

            {/* Componente de bandeja */}
            <div className="min-h-[600px]">
                <InboxSolicitudes />
            </div>
        </div>
    );
}
