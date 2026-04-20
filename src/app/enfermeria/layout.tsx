"use client";

import { ReactNode, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Activity, LogOut, Stethoscope } from "lucide-react";

export default function EnfermeriaLayout({ children }: { children: ReactNode }) {
    const { user, loading, logout } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && (!user || (user.role as string)?.toUpperCase() !== "ENFERMERIA")) {
            if (!loading && !user) router.push("/login");
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-lime-50/30 to-green-50/30">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-lime-500/10 border border-lime-400/20 flex items-center justify-center animate-pulse">
                        <Activity size={24} className="text-lime-500" />
                    </div>
                    <p className="text-sm font-bold text-gray-500 tracking-wide">Cargando estación de enfermería…</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 via-lime-50/20 to-green-50/20 flex">
            {/* ── Sidebar ─────────────────────────────────── */}
            <aside className="w-64 shrink-0 bg-white/60 backdrop-blur-xl border-r border-white/50 shadow-[2px_0_16px_0_rgba(0,0,0,0.06)] hidden md:flex flex-col">
                {/* Logo */}
                <div className="p-6 border-b border-white/40">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-lime-500 flex items-center justify-center shadow-lg shadow-lime-200">
                            <Stethoscope size={18} className="text-white" />
                        </div>
                        <div>
                            <p className="font-extrabold text-gray-900 text-sm leading-none">Clínica Colinas</p>
                            <p className="text-[11px] font-bold text-lime-500 tracking-widest uppercase mt-0.5">Enfermería</p>
                        </div>
                    </div>
                </div>

                {/* Nav items */}
                <nav className="flex-1 p-4 space-y-1.5">
                    <div className="px-3 py-2.5 rounded-2xl bg-lime-50/70 border border-lime-200/50 flex items-center gap-3 shadow-sm">
                        <div className="w-8 h-8 rounded-xl bg-lime-500 flex items-center justify-center shadow-sm shadow-lime-200">
                            <Activity size={15} className="text-white" />
                        </div>
                        <span className="text-sm font-bold text-lime-700">Pacientes en Piso</span>
                    </div>
                </nav>

                {/* Footer: user info + logout */}
                <div className="p-4 border-t border-white/40">
                    <div className="bg-white/50 rounded-2xl p-3 border border-white/60 shadow-sm mb-3">
                        <p className="text-xs font-bold text-gray-700 truncate">{user?.email}</p>
                        <p className="text-[11px] text-lime-500 font-bold uppercase tracking-wider mt-0.5">Enfermería</p>
                    </div>
                    <button
                        onClick={logout}
                        className="w-full flex items-center justify-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-700 py-2.5 rounded-2xl hover:bg-white/60 border border-transparent hover:border-white/60 transition-all"
                    >
                        <LogOut size={15} /> Cerrar Sesión
                    </button>
                </div>
            </aside>

            {/* ── Main content ─────────────────────────────── */}
            <div className="flex-1 overflow-auto">
                <div className="max-w-7xl mx-auto p-6 md:p-8">
                    {children}
                </div>
            </div>
        </div>
    );
}
