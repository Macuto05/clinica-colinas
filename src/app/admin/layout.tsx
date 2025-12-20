
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { JWTService } from "@/infrastructure/services/JWTService";
import { PrismaUserRepository } from "@/infrastructure/database/prisma/repositories/PrismaUserRepository";
import { Users, Calendar, Settings, LogOut, LayoutDashboard, Shield } from "lucide-react";
import AdminProfile from "./components/AdminProfile";

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
                    <span className="text-xl font-bold bg-gradient-to-r from-lime-600 to-green-600 bg-clip-text text-transparent">
                        Admin Panel
                    </span>
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
                    <NavItem href="/admin/doctores" icon={<Users size={20} />} label="Médicos" />
                    <NavItem href="/admin/pacientes" icon={<Users size={20} />} label="Pacientes" />
                    <NavItem href="/admin/personal" icon={<Users size={20} />} label="Personal / Staff" />
                    <NavItem href="/admin/roles" icon={<Shield size={20} />} label="Roles" />

                    <div className="my-4 border-t border-gray-200 dark:border-zinc-800" />

                    <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                        Clínica
                    </p>
                    <NavItem href="/admin/citas" icon={<Calendar size={20} />} label="Citas Médicas" />
                    <NavItem href="/admin/especialidades" icon={<LayoutDashboard size={20} />} label="Especialidades" />

                    <div className="my-4 border-t border-gray-200 dark:border-zinc-800" />

                    <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                        Control y Métricas
                    </p>
                    <NavItem href="/admin/auditoria" icon={<LayoutDashboard size={20} />} label="Auditoría / Logs" />
                    <NavItem href="/admin/metricas" icon={<LayoutDashboard size={20} />} label="Métricas Bi" />

                    <div className="my-4 border-t border-gray-200 dark:border-zinc-800" />

                    <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                        Configuración
                    </p>
                    <NavItem href="/admin/configuracion" icon={<Settings size={20} />} label="Ajustes" />

                    <div className="my-2" />
                    <NavItem href="/" icon={<LogOut className="rotate-180" size={20} />} label="Volver al Inicio" />
                </div>

                <AdminProfile user={{ name: user.name }} />
            </aside>

            {/* Mobile Header & Content */}
            <div className="flex-1 lg:ml-64">
                <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200 dark:border-zinc-800 dark:bg-zinc-900/80 p-4 lg:hidden">
                    <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-gray-900 dark:text-white">Admin Panel</span>
                        {/* Mobile menu trigger could go here */}
                    </div>
                </header>

                <main className="p-8">
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
