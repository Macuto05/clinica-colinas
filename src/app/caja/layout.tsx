import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { JWTService } from "@/infrastructure/services/JWTService";
import { PrismaUserRepository } from "@/infrastructure/database/prisma/repositories/PrismaUserRepository";
import { LayoutDashboard, ShoppingCart, LogOut, Users, Settings } from "lucide-react";
import AdminProfile from "@/app/admin/components/AdminProfile";
import ExchangeRateWidget from "@/components/admin/ExchangeRateWidget";

export default async function CajaLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;

    if (!token) {
        redirect("/login");
    }

    const payload = await JWTService.verifyToken(token);
    // Allow CAJA/FACTURACION and ADMIN roles
    if (!payload || ((payload as any).role !== "CAJA/FACTURACION" && (payload as any).role !== "ADMIN")) {
        redirect("/login");
    }

    const userRepository = new PrismaUserRepository();
    const user = await userRepository.findByEmail(payload.email);

    if (!user) {
        redirect("/login");
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 via-green-50/30 to-lime-50/30 flex transition-colors duration-300">
            {/* Sidebar */}
            <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white/60 backdrop-blur-xl border-r border-white/50 shadow-[2px_0_16px_0_rgba(0,0,0,0.06)] transform transition-transform duration-300 lg:translate-x-0 -translate-x-full flex flex-col">
                <div className="flex h-16 items-center px-6 border-b border-white/40 shrink-0">
                    <img
                        src="/logo-clinicas-colina.jpg"
                        alt="Clinica Colinas Logo"
                        className="h-10 w-auto object-contain drop-shadow-sm mix-blend-multiply"
                    />
                </div>

                <div className="p-4 space-y-1 overflow-y-auto flex-1">
                    <p className="px-4 text-xs font-bold text-gray-500/80 uppercase tracking-wider mb-2 mt-2">
                        Caja Principal
                    </p>
                    <NavItem href="/caja" icon={<LayoutDashboard size={20} />} label="Resumen" />

                    <div className="my-4 border-t border-white/40" />

                    <p className="px-4 text-xs font-bold text-gray-500/80 uppercase tracking-wider mb-2">
                        Gestión
                    </p>
                    <NavItem href="/caja/compras" icon={<ShoppingCart size={20} />} label="Aprobación Compras" />
                    <NavItem href="/caja/proveedores" icon={<Users size={20} />} label="Proveedores" />
                    <NavItem href="/caja/pagos" icon={<ShoppingCart size={20} />} label="Gestión de Pagos" />
                    <NavItem href="/caja/configuracion" icon={<Settings size={20} />} label="Configuración" />
                </div>

                <div className="shrink-0 border-t border-white/40 bg-white/30 backdrop-blur-md">
                    <AdminProfile user={{ name: user.name }} role="Cajero" />
                </div>
            </aside>

            {/* Content Area */}
            <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">

                {/* Desktop Header - Floating Widget Style */}
                <header className="hidden lg:flex items-center justify-end sticky top-0 z-40 px-8 py-4 pointer-events-none">
                    <div className="pointer-events-auto">
                        <ExchangeRateWidget />
                    </div>
                </header>

                {/* Mobile Header */}
                <header className="flex lg:hidden items-center justify-between sticky top-0 z-40 bg-white/60 backdrop-blur-xl border-b border-white/50 p-4 shadow-sm">
                    <span className="text-lg font-bold text-gray-900">Panel Caja</span>
                    <ExchangeRateWidget />
                </header>

                <main className="flex-1 p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}

function NavItem({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
    return (
        <Link
            href={href}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl text-gray-600 font-bold hover:bg-white/60 hover:text-lime-700 hover:shadow-sm transition-all border border-transparent hover:border-white/60"
        >
            {icon}
            <span className="font-bold">{label}</span>
        </Link>
    );
}
