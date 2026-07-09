"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
    LayoutDashboard,
    Users,
    CalendarPlus,
    LogOut,
    Menu,
    ChevronRight,
    Activity,
    ShieldCheck
} from "lucide-react";
import ExchangeRateWidget from "@/components/admin/ExchangeRateWidget";

interface RecepcionLayoutProps {
    children: React.ReactNode;
}

export default function RecepcionLayout({ children }: RecepcionLayoutProps) {
    const { user, logout, loading } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push("/login");
                return;
            }
            const roleName = user.role?.toString().toUpperCase();
            if (roleName !== "ADMIN" && roleName !== "RECEPCION") {
                router.push("/dashboard");
            }
        }
    }, [user, loading, router]);

    const navigation = [
        { name: "Agenda del Día", href: "/recepcion", icon: LayoutDashboard, section: "Recepción" },
        { name: "Pacientes", href: "/recepcion/pacientes", icon: Users, section: "Gestión" },
        { name: "Nueva Cita", href: "/recepcion/citas/nueva", icon: CalendarPlus, section: "Gestión" },
        { name: "Guardias", href: "/recepcion/guardias", icon: ShieldCheck, section: "Gestión" },
    ];

    const isActive = (path: string) => pathname === path;

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-lime-50/30 to-green-50/30">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-lime-500/10 border border-lime-400/20 flex items-center justify-center animate-pulse">
                        <Activity size={24} className="text-lime-500" />
                    </div>
                    <p className="text-sm font-bold text-gray-500 tracking-wide">Cargando módulo de recepción…</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 via-green-50/30 to-lime-50/30 flex">
            {/* Superposición de menú móvil */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Barra lateral */}
            <aside
                className={`
                    fixed inset-y-0 left-0 z-50 w-56 bg-white/60 backdrop-blur-xl border-r border-white/50 shadow-[2px_0_16px_0_rgba(0,0,0,0.06)] transform transition-transform duration-200 ease-in-out flex flex-col
                    ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
                `}
            >
                {/* Logotipo */}
                <div className="h-16 flex items-center px-6 border-b border-white/50 shrink-0">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="relative h-8 w-32 transition-transform hover:scale-105">
                            <img
                                src="/logo-clinicas-colina.jpg"
                                alt="Clínicas Colina"
                                className="object-contain h-full w-full"
                            />
                        </div>
                    </Link>
                </div>

                {/* Resumen del perfil del usuario */}
                <div className="p-4 border-b border-white/50 bg-white/30 backdrop-blur-md shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-lime-500/10 flex items-center justify-center text-lime-700 font-black shadow-inner border border-lime-500/20 backdrop-blur-md">
                            {user?.name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || "R"}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                                {(user as any)?.name || user?.email || "Recepción"}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                                {user?.role === 'ADMIN' ? 'Administrador' : 'Recepcionista'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Navegación */}
                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                    <div className="mb-2">
                        <p className="px-3 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1.5 mt-2">Recepción</p>
                        {navigation.filter(n => n.section === "Recepción").map(item => (
                            <Link key={item.name} href={item.href} onClick={() => setIsMobileMenuOpen(false)} className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl border text-sm font-bold transition-all duration-200 group ${isActive(item.href) ? "border-lime-500/80 bg-lime-50/80 text-lime-700 shadow-[0_4px_12px_rgba(132,204,22,0.2)] ring-2 ring-lime-400/20 scale-[1.02] backdrop-blur-sm" : "border-transparent bg-transparent text-gray-500/80 hover:bg-white/50 hover:border-white/60 hover:text-gray-700 hover:shadow-sm"}`}>
                                <item.icon size={20} className={`transition-colors duration-200 ${isActive(item.href) ? "text-lime-600" : "text-gray-400 group-hover:text-gray-600"}`} />
                                {item.name}
                                {isActive(item.href) && <ChevronRight size={16} className="ml-auto text-lime-400" />}
                            </Link>
                        ))}
                    </div>
                    
                    <div className="my-2.5 border-t border-white/40 mx-2" />
                    
                    <div className="mb-2">
                        <p className="px-3 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1.5">Gestión</p>
                        {navigation.filter(n => n.section === "Gestión").map(item => (
                            <Link key={item.name} href={item.href} onClick={() => setIsMobileMenuOpen(false)} className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl border text-sm font-bold transition-all duration-200 group ${isActive(item.href) ? "border-lime-500/80 bg-lime-50/80 text-lime-700 shadow-[0_4px_12px_rgba(132,204,22,0.2)] ring-2 ring-lime-400/20 scale-[1.02] backdrop-blur-sm" : "border-transparent bg-transparent text-gray-500/80 hover:bg-white/50 hover:border-white/60 hover:text-gray-700 hover:shadow-sm"}`}>
                                <item.icon size={20} className={`transition-colors duration-200 ${isActive(item.href) ? "text-lime-600" : "text-gray-400 group-hover:text-gray-600"}`} />
                                {item.name}
                                {isActive(item.href) && <ChevronRight size={16} className="ml-auto text-lime-400" />}
                            </Link>
                        ))}
                    </div>
                </nav>

                {/* Cerrar sesión */}
                <div className="p-4 border-t border-white/50 bg-white/30 backdrop-blur-md shrink-0">
                    <button
                        onClick={() => logout()}
                        className="flex w-full items-center gap-3 px-3 py-2.5 rounded-2xl border border-transparent text-sm font-bold text-red-600 transition-all focus:outline-none hover:bg-red-50 hover:text-red-700 hover:border-red-200 hover:shadow-[0_4px_12px_rgba(239,68,68,0.2)]"
                    >
                        <LogOut size={20} />
                        Cerrar Sesión
                    </button>
                </div>
            </aside>

            {/* Contenido principal */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden lg:pl-56">
                {/* Encabezado móvil */}
                <header className="lg:hidden h-16 bg-white/60 backdrop-blur-xl border-b border-white/50 flex items-center justify-between px-4">
                    <button
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="p-2 -ml-2 text-gray-600 hover:bg-white/60 rounded-xl transition-colors"
                    >
                        <Menu size={24} />
                    </button>
                    <span className="font-semibold text-gray-900 truncate max-w-[150px]">
                        {navigation.find(n => isActive(n.href))?.name || "Panel Recepción"}
                    </span>
                    <div className="scale-75 origin-right">
                        <ExchangeRateWidget />
                    </div>
                </header>

                {/* Encabezado de escritorio */}
                <header className="hidden lg:flex items-center justify-end sticky top-0 z-40 px-8 py-4 pointer-events-none">
                    <div className="pointer-events-auto">
                        <ExchangeRateWidget />
                    </div>
                </header>

                {/* Contenido de la página */}
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
