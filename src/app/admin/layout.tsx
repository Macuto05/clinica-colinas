import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { JWTService } from "@/infrastructure/services/JWTService";
import { PrismaUserRepository } from "@/infrastructure/database/prisma/repositories/PrismaUserRepository";
import { LayoutDashboard, Users, UserCog, Calendar, Activity, BarChart3, FileText, Settings, LogOut, Clock, ShoppingCart, Award, Briefcase, Shield, Siren } from "lucide-react";
import AdminProfile from "./components/AdminProfile";
import ExchangeRateWidget from "@/components/admin/ExchangeRateWidget";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // 1. Auth & Role Guard
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;

    if (!token) {
        redirect("/login");
    }

    const payload = await JWTService.verifyToken(token);
    if (!payload) {
        redirect("/login");
    }

    const userRepository = new PrismaUserRepository();
    const user = await userRepository.findById(payload.userId);

    if (!user || user.role !== "ADMIN") {
        redirect("/dashboard"); // Or display a 403 Forbidden page
    }

    return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-zinc-950">
            {/* Admin Sidebar */}
            <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-800 hidden lg:block">
                <div className="flex h-16 items-center px-6 border-b border-gray-200 dark:border-zinc-800">
                    <img
                        src="/logo-clinicas-colina.jpg"
                        alt="Clinica Colinas Logo"
                        className="h-10 w-auto object-contain"
                    />
                </div>

                <div className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-4rem)]">
                    <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-2">
                        General
                    </p>
                    <NavItem href="/admin" icon={<LayoutDashboard size={20} />} label="Resumen" />

                    <div className="my-4 border-t border-gray-200 dark:border-zinc-800" />

                    <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                        Gestión de Usuarios
                    </p>
                    <NavItem href="/admin/doctores" icon={<Award size={20} />} label="Médicos" />
                    <NavItem href="/admin/pacientes" icon={<Users size={20} />} label="Pacientes" />
                    <NavItem href="/admin/personal" icon={<Briefcase size={20} />} label="Personal / Staff" />
                    <NavItem href="/admin/roles" icon={<Shield size={20} />} label="Roles" />

                    <div className="my-4 border-t border-gray-200 dark:border-zinc-800" />

                    <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                        Clínica
                    </p>
                    <NavItem href="/admin/citas" icon={<Calendar size={20} />} label="Citas Médicas" />
                    <NavItem href="/admin/especialidades" icon={<Activity size={20} />} label="Especialidades" />
                    <NavItem href="/admin/aseguradoras" icon={<Shield size={20} />} label="Aseguradoras" />
                    <NavItem href="/emergencias" icon={<Siren size={20} />} label="Emergencias" />



                    <div className="my-4 border-t border-gray-200 dark:border-zinc-800" />

                    <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                        Control y Métricas
                    </p>
                    <NavItem href="/admin/auditoria" icon={<LayoutDashboard size={20} />} label="Auditoría / Logs" />
                    <NavItem href="/admin/metricas" icon={<LayoutDashboard size={20} />} label="Métricas Bi" />

                    <div className="my-4 border-t border-gray-200 dark:border-zinc-800" />

                    <div className="my-4 border-t border-gray-200 dark:border-zinc-800" />

                    <NavItem href="/admin/configuracion" icon={<Settings size={20} />} label="Ajustes" />

                    <div className="my-2" />
                    <NavItem href="/" icon={<LogOut className="rotate-180" size={20} />} label="Volver al Inicio" />
                </div>

                <AdminProfile user={{ name: user.name }} />
            </aside>

            {/* Content Area */}
            <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">

                {/* Desktop Header */}
                <header className="hidden lg:flex items-center justify-end sticky top-0 z-40 px-8 py-4 pointer-events-none">
                    <div className="pointer-events-auto">
                        <ExchangeRateWidget />
                    </div>
                </header>

                {/* Mobile Header */}
                <header className="flex lg:hidden items-center justify-between sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200 dark:border-zinc-800 dark:bg-zinc-900/80 p-4">
                    <span className="text-lg font-bold text-gray-900 dark:text-white">Admin Panel</span>
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
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-700 hover:bg-lime-50 hover:text-lime-700 dark:text-gray-300 dark:hover:bg-lime-900/20 dark:hover:text-lime-400 transition-colors"
        >
            {icon}
            <span className="font-medium">{label}</span>
        </Link>
    );
}
