import { AlertTriangle } from "lucide-react";

export default function AdminAuditPage() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Auditoría y Traza</h1>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800 p-12 text-center">
                <div className="flex justify-center mb-4">
                    <div className="bg-yellow-100 dark:bg-yellow-900/30 p-4 rounded-full">
                        <AlertTriangle className="text-yellow-600 dark:text-yellow-500" size={32} />
                    </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Registro de Actividad</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                    Aquí se mostrará el historial detallado de todas las acciones realizadas en el sistema (login, creación de usuarios, edición de historias clínicas).
                </p>
            </div>
        </div>
    );
}
