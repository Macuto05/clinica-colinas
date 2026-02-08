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
        <div className="min-h-screen bg-gray-50 flex">
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
                    fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out
                    ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
                `}
            >
                <div className="h-full flex flex-col">
                    {/* Logo */}
                    <div className="h-16 flex items-center px-6 border-b border-gray-100">
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
                    <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-lime-100 flex items-center justify-center text-lime-700 font-bold border-2 border-white shadow-sm">
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
                                        flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group
                                        ${active
                                            ? "bg-lime-50 text-lime-700 shadow-sm ring-1 ring-lime-200"
                                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
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
                    <div className="p-4 border-t border-gray-100">
                        <button
                            onClick={() => logout()}
                            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
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
                <header className="lg:hidden h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4">
                    <button
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg"
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
