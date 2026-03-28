import { WalletCards, ShoppingCart, Users, ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function CajaDashboard() {
    return (
        <div className="space-y-6">
            <div className="bg-white/40 backdrop-blur-md p-8 rounded-3xl border border-white/50 shadow-[0_4px_16px_0_rgba(0,0,0,0.02)] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-lime-400/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="relative z-10">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">
                        Bienvenido, Cajero
                    </h1>
                    <p className="text-gray-600 font-medium">
                        Panel de facturación, gestión de proveedores y aprobación de compras.
                    </p>
                </div>
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

            <div className="bg-blue-100/70 border border-blue-200/60 rounded-2xl p-4 text-blue-800 font-bold text-sm backdrop-blur-sm shadow-sm flex items-center gap-3">
                <div className="p-2 bg-blue-200/50 rounded-xl">
                    <WalletCards size={20} className="text-blue-700" />
                </div>
                Selecciona una opción del menú lateral para comenzar a gestionar el flujo de caja.
            </div>
        </div>
    );
}

function StatCard({ title, value, icon, trend, trendUp, href }: any) {
    return (
        <div className="bg-white/40 backdrop-blur-md p-6 rounded-3xl border border-white/50 shadow-[0_4px_16px_0_rgba(0,0,0,0.02)] hover:shadow-[0_8px_24px_0_rgba(0,0,0,0.04)] transition-all hover:bg-white/50 group">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl shadow-inner border border-white/60 bg-white/50`}>
                    {icon}
                </div>
                {href && (
                    <a href={href} className="px-3 py-1.5 rounded-full bg-white/50 border border-white/60 text-xs font-bold text-gray-500 hover:text-lime-700 hover:bg-white/80 transition-colors flex items-center gap-1 shadow-sm backdrop-blur-sm">
                        Ir <ArrowUpRight size={12} />
                    </a>
                )}
            </div>
            <div>
                <p className="text-xs font-bold text-gray-500/80 uppercase tracking-wider mb-1">{title}</p>
                <h3 className="text-3xl font-bold text-gray-900 tracking-tight">{value}</h3>
            </div>
            {trend && (
                <div className="mt-4 flex items-center gap-2 text-xs font-bold text-gray-400">
                    <span>{trend}</span>
                </div>
            )}
        </div>
    );
}
