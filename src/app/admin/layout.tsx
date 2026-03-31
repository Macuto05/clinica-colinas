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
        <div className="min-h-screen bg-gradient-to-br from-slate-100 via-green-50/30 to-lime-50/30 flex transition-colors duration-300">
            {/* Admin Sidebar */}
            <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white/60 backdrop-blur-xl border-r border-white/50 shadow-[2px_0_16px_0_rgba(0,0,0,0.06)] hidden lg:flex overflow-hidden flex flex-col">
                <div className="flex h-16 items-center px-6 border-b border-white/40 shrink-0 bg-white/30 backdrop-blur-sm">
                    <img
                        src="/logo-clinicas-colina.jpg"
                        alt="Clinica Colinas Logo"
                        className="h-10 w-auto object-contain"
                    />
                </div>

                <div className="flex-1 p-3 space-y-0 overflow-y-auto custom-scrollbar scroll-smooth">
                    <p className="px-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1.5 mt-2">
                        General
                    </p>
                    <NavItem href="/admin" icon={<LayoutDashboard size={16} />} label="Resumen" />

                    <div className="my-2.5 border-t border-white/40 mx-2" />

                    <p className="px-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1.5">
                        Gestión de Usuarios
                    </p>
                    <NavItem href="/admin/doctores" icon={<Award size={16} />} label="Médicos" />
                    <NavItem href="/admin/pacientes" icon={<Users size={16} />} label="Pacientes" />
                    <NavItem href="/admin/personal" icon={<Briefcase size={16} />} label="Personal / Staff" />
                    <NavItem href="/admin/roles" icon={<Shield size={16} />} label="Roles" />

                    <div className="my-2.5 border-t border-white/40 mx-2" />

                    <p className="px-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1.5">
                        Clínica
                    </p>
                    <NavItem href="/admin/citas" icon={<Calendar size={16} />} label="Citas Médicas" />
                    <NavItem href="/admin/especialidades" icon={<Activity size={16} />} label="Especialidades" />
                    <NavItem href="/admin/aseguradoras" icon={<Shield size={16} />} label="Aseguradoras" />
                    <NavItem href="/emergencias" icon={<Siren size={16} />} label="Emergencias" />

                    <div className="my-2.5 border-t border-white/40 mx-2" />

                    <p className="px-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1.5">
                        Control y Métricas
                    </p>
                    <NavItem href="/admin/auditoria" icon={<LayoutDashboard size={16} />} label="Auditoría / Logs" />
                    <NavItem href="/admin/metricas" icon={<LayoutDashboard size={16} />} label="Métricas Bi" />

                </div>

                <div className="shrink-0 p-4 border-t border-white/40">
                    <AdminProfile user={{ name: user.name }} />
                </div>
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
                <header className="flex lg:hidden items-center justify-between sticky top-0 z-40 bg-white/30 backdrop-blur-md border-b border-white/40 p-4">
                    <span className="text-lg font-black text-gray-900 tracking-tight">Admin Panel</span>
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
            className="flex items-center gap-3 px-4 py-1.5 rounded-lg text-gray-600 hover:bg-white/60 hover:text-[#a1db4b] hover:shadow-sm transition-all duration-300 group"
        >
            <div className="transition-transform group-hover:scale-110 group-hover:rotate-3 shrink-0">
                {icon}
            </div>
            <span className="font-bold text-sm tracking-tight truncate">{label}</span>
        </Link>
    );
}
