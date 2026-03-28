"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
    LayoutDashboard,
    Calendar,
    PlusCircle,
    User,
    LogOut,
    Menu,
    X,
    ChevronRight,
    CreditCard
} from "lucide-react";
import { CLINIC_INFO } from "@/lib/constants/clinic-info";

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
    const { user, logout, loading } = useAuth();
    const pathname = usePathname();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const navigation = [
        { name: "Resumen", href: "/dashboard", icon: LayoutDashboard },
        { name: "Nueva Cita", href: "/dashboard/citas/nueva", icon: PlusCircle },
        { name: "Mis Citas", href: "/dashboard/citas", icon: Calendar },
        { name: "Mis Finanzas", href: "/dashboard/pagos", icon: CreditCard },
        { name: "Mi Perfil", href: "/dashboard/perfil", icon: User },
    ];

    const isActive = (path: string) => pathname === path;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 via-green-50/30 to-lime-50/30 flex">
            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
                    fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white/60 backdrop-blur-xl border-r border-white/50 shadow-[2px_0_16px_0_rgba(0,0,0,0.06)] transform transition-transform duration-200 ease-in-out
                    ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
                `}
            >
                <div className="h-full flex flex-col">
                    {/* Logo */}
                    <div className="h-16 flex items-center px-6 border-b border-white/50">
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

                    {/* User Profile Summary */}
                    <div className="p-4 border-b border-white/50 bg-white/30 backdrop-blur-md">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-lime-500/10 flex items-center justify-center text-lime-700 font-black shadow-inner border border-lime-500/20 backdrop-blur-md">
                                {user?.name?.charAt(0) || "U"}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                    {user?.name || "Usuario"}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                    {user?.role === 'DOCTOR' ? 'Doctor' : user?.role === 'ADMIN' ? 'Administrador' : 'Paciente'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                        {navigation.map((item) => {
                            const active = isActive(item.href);
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={`
                                        flex items-center gap-3 px-3 py-2.5 rounded-2xl border text-sm font-bold transition-all duration-200 group
                                        ${active
                                            ? "border-lime-500/80 bg-lime-50/80 text-lime-700 shadow-[0_4px_12px_rgba(132,204,22,0.2)] ring-2 ring-lime-400/20 scale-[1.02] backdrop-blur-sm"
                                            : "border-transparent bg-transparent text-gray-500/80 hover:bg-white/50 hover:border-white/60 hover:text-gray-700 hover:shadow-sm"
                                        }
                                    `}
                                >
                                    <item.icon
                                        size={20}
                                        className={`
                                            transition-colors duration-200
                                            ${active ? "text-lime-600" : "text-gray-400 group-hover:text-gray-600"}
                                        `}
                                    />
                                    {item.name}
                                    {active && <ChevronRight size={16} className="ml-auto text-lime-400" />}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Logout */}
                    <div className="p-4 border-t border-white/50 bg-white/30 backdrop-blur-md">
                        <button
                            onClick={() => logout()}
                            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-2xl border border-transparent text-sm font-bold text-red-600 hover:bg-white/60 hover:border-white/80 hover:shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-red-200"
                        >
                            <LogOut size={20} />
                            Cerrar Sesión
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Mobile Header */}
                <header className="lg:hidden h-16 bg-white/60 backdrop-blur-xl border-b border-white/50 flex items-center justify-between px-4">
                    <button
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="p-2 -ml-2 text-gray-600 hover:bg-white/60 rounded-xl transition-colors"
                    >
                        <Menu size={24} />
                    </button>
                    <span className="font-semibold text-gray-900">
                        {navigation.find(n => isActive(n.href))?.name || "Dashboard"}
                    </span>
                    <div className="w-8" /> {/* Spacer for centering */}
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                    <div className="max-w-6xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
            {/* Debug Footer Removed */}
        </div>
    );
}
