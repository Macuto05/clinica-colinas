import { BarChart3 } from "lucide-react";

export default function AdminMetricsPage() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Métricas y Reportes (BI)</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm animate-pulse">
                        <div className="h-4 bg-gray-200 dark:bg-zinc-800 rounded w-1/3 mb-4"></div>
                        <div className="h-8 bg-gray-100 dark:bg-zinc-800/50 rounded w-1/2"></div>
                    </div>
                ))}
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800 p-12 text-center">
                <div className="flex justify-center mb-4">
                    <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-full">
                        <BarChart3 className="text-blue-600 dark:text-blue-400" size={32} />
                    </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Paneles de Business Intelligence</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                    Próximamente visualizarás aquí estadísticas de citas, ocupación de médicos e ingresos.
                </p>
            </div>
        </div>
    );
}
