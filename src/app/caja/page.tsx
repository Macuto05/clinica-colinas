"use client";

import { useEffect, useState } from "react";
import { WalletCards, ShoppingCart, Users, ArrowUpRight, DollarSign, Clock, Loader2 } from "lucide-react";

interface DashboardData {
    comprasPendientes: number;
    proveedoresActivos: number;
    facturasHoy: number;
    pagosPendientes: number;
    ingresosHoy: number;
}

function StatCard({
    title, value, icon, sub, href, loading, highlight,
}: {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    sub?: string;
    href?: string;
    loading?: boolean;
    highlight?: boolean;
}) {
    return (
        <div className={`bg-white/40 backdrop-blur-md p-5 rounded-3xl border shadow-[0_4px_16px_0_rgba(0,0,0,0.02)] hover:shadow-[0_8px_24px_0_rgba(0,0,0,0.04)] transition-all hover:bg-white/50 group ${
            highlight ? "border-amber-300/60 bg-amber-50/40" : "border-white/50"
        }`}>
            <div className="flex justify-between items-start mb-3">
                <div className="p-3 rounded-2xl shadow-inner border border-white/60 bg-white/50">
                    {icon}
                </div>
                {href && (
                    <a
                        href={href}
                        className="px-3 py-1.5 rounded-full bg-white/50 border border-white/60 text-xs font-bold text-gray-500 hover:text-lime-700 hover:bg-white/80 transition-colors flex items-center gap-1 shadow-sm"
                    >
                        Ir <ArrowUpRight size={12} />
                    </a>
                )}
            </div>
            <p className="text-xs font-bold text-gray-500/80 uppercase tracking-wider mb-1">{title}</p>
            {loading ? (
                <div className="h-9 w-20 bg-gray-100 animate-pulse rounded-lg mt-1" />
            ) : (
                <h3 className="text-3xl font-bold text-gray-900 tracking-tight">{value}</h3>
            )}
            {sub && <p className="mt-2 text-xs text-gray-400 font-medium">{sub}</p>}
        </div>
    );
}

export default function CajaDashboard() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/caja/dashboard")
            .then(r => r.ok ? r.json() : null)
            .then(d => { if (d) setData(d); })
            .finally(() => setLoading(false));
    }, []);

    const hoy = new Date().toLocaleDateString("es-VE", {
        weekday: "long", day: "numeric", month: "long",
    });

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="bg-white/40 backdrop-blur-md p-6 rounded-3xl border border-white/50 shadow-[0_4px_16px_0_rgba(0,0,0,0.02)] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-lime-400/10 rounded-full blur-3xl -mr-20 -mt-20" />
                <div className="relative z-10 flex items-start justify-between flex-wrap gap-2">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-1 tracking-tight">Bienvenido, Cajero</h1>
                        <p className="text-gray-500 font-medium capitalize">{hoy}</p>
                    </div>
                    {loading && <Loader2 className="animate-spin text-gray-300 mt-1" size={20} />}
                </div>
            </div>

            {/* KPI cards — fila 1 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Compras Pendientes"
                    value={data?.comprasPendientes ?? "—"}
                    icon={<ShoppingCart className="text-lime-600" size={24} />}
                    sub="Pedidos por aprobar"
                    href="/caja/compras"
                    loading={loading}
                    highlight={(data?.comprasPendientes ?? 0) > 0}
                />
                <StatCard
                    title="Proveedores Activos"
                    value={data?.proveedoresActivos ?? "—"}
                    icon={<Users className="text-blue-600" size={24} />}
                    sub="En el sistema"
                    href="/caja/proveedores"
                    loading={loading}
                />
                <StatCard
                    title="Facturas Hoy"
                    value={data?.facturasHoy ?? "—"}
                    icon={<WalletCards className="text-purple-600" size={24} />}
                    sub="Emitidas hoy"
                    loading={loading}
                />
            </div>

            {/* KPI cards — fila 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <StatCard
                    title="Pagos Pendientes"
                    value={data?.pagosPendientes ?? "—"}
                    icon={<Clock className="text-amber-500" size={24} />}
                    sub="Esperando validación"
                    href="/caja/pagos"
                    loading={loading}
                    highlight={(data?.pagosPendientes ?? 0) > 0}
                />
                <StatCard
                    title="Ingresos Hoy"
                    value={loading ? "—" : `$${(data?.ingresosHoy ?? 0).toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    icon={<DollarSign className="text-emerald-600" size={24} />}
                    sub="Pagos validados (USD)"
                    loading={loading}
                />
            </div>

        </div>
    );
}
