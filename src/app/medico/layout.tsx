
"use client";

import { useAuth } from "@/contexts/AuthContext";
import {
    LayoutDashboard,
    Calendar,
    Users,
    Stethoscope,
    LogOut,
    Activity,
    History as HistoryIcon
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
    const { logout, user } = useAuth();
    const pathname = usePathname();

    const menuItems = [
        { label: "Mi Agenda", icon: <Calendar size={20} />, href: "/medico" },
        { label: "Historial Citas", icon: <HistoryIcon size={20} />, href: "/medico/historial" },
    ];

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100 font-sans selection:bg-lime-500/30">
            {/* Sidebar */}
            <aside className="w-64 bg-white dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-800 flex flex-col fixed inset-y-0 z-50 transition-all duration-300">
                <div className="p-6 flex items-center gap-3 border-b border-gray-100 dark:border-zinc-800/50">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-lime-500 to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-lime-500/20">
                        <Activity size={24} />
                    </div>
                    <div>
                        <h1 className="font-bold text-lg tracking-tight">Portal Médico</h1>
                        <p className="text-xs text-gray-500 font-medium">Clínica Colinas</p>
                    </div>
                </div>

                <div className="p-4">
                    <div className="mb-6 p-4 rounded-xl bg-lime-50 dark:bg-lime-900/10 border border-lime-100 dark:border-lime-900/30">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-lime-100 dark:bg-lime-800 flex items-center justify-center text-lime-600 dark:text-lime-200 font-bold">
                                Dr.
                            </div>
                            <div className="overflow-hidden">
                                <p className="font-bold text-sm truncate">
                                    {(user as any)?.name || `${(user as any)?.firstName || ''} ${(user as any)?.lastName || ''}`.trim() || "Doctor"}
                                </p>
                                <p className="text-xs text-lime-600 dark:text-lime-400">En línea</p>
                            </div>
                        </div>
                    </div>

                    <nav className="space-y-1">
                        {menuItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group
                                        ${isActive
                                            ? "bg-lime-500 text-white shadow-md shadow-lime-500/20"
                                            : "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-zinc-800 dark:hover:text-white"
                                        }`}
                                >
                                    <span className={isActive ? "text-white" : "text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300"}>
                                        {item.icon}
                                    </span>
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div className="mt-auto p-4 border-t border-gray-200 dark:border-zinc-800">
                    <button
                        onClick={logout}
                        className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/10 transition-colors"
                    >
                        <LogOut size={20} />
                        Cerrar Sesión
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 p-8 overflow-y-auto">
                <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {children}
                </div>
            </main>
        </div>
    );
}
