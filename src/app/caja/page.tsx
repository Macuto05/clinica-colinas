import { WalletCards, ShoppingCart, Users, ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function CajaDashboard() {
    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Bienvenido, Cajero
                </h1>
                <p className="text-gray-500 dark:text-gray-400">
                    Panel de facturación, gestión de proveedores y aprobación de compras.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Compras Pendientes"
                    value="-"
                    icon={<ShoppingCart className="text-lime-600" size={24} />}
                    trend="Ver detalles"
                    trendUp={null}
                    href="/caja/compras"
                />
                <StatCard
                    title="Proveedores Activos"
                    value="-"
                    icon={<Users className="text-blue-600" size={24} />}
                    trend="Gestionar"
                    trendUp={true}
                    href="/caja/proveedores"
                />
                <StatCard
                    title="Facturas Hoy"
                    value="-"
                    icon={<WalletCards className="text-purple-600" size={24} />}
                    trend="Ver historial"
                    trendUp={null}
                />
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900 rounded-xl p-4 text-blue-800 dark:text-blue-300 text-sm">
                Selecciona una opción del menú lateral para comenzar a gestionar el flujo de caja.
            </div>
        </div>
    );
}

function StatCard({ title, value, icon, trend, trendUp, href }: any) {
    return (
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-lg ${trendUp === true ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-gray-100 dark:bg-zinc-800'}`}>
                    {icon}
                </div>
                {href && (
                    <a href={href} className="text-xs font-medium text-gray-500 hover:text-lime-600 flex items-center gap-1">
                        Ir <ArrowUpRight size={12} />
                    </a>
                )}
            </div>
            <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</h3>
            </div>
            {trend && (
                <div className="mt-4 flex items-center gap-2 text-xs">
                    <span className="text-gray-400">{trend}</span>
                </div>
            )}
        </div>
    );
}
