"use client";

import { useAuth } from "@/contexts/AuthContext";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AdminProfile({ user, role = "Administrador" }: { user: { name: string }, role?: string }) {
    const { logout } = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
        await logout();
        router.push("/login");
    };

    return (
        <div className="w-full">
            <div className="flex items-center gap-3 px-4 py-3 mb-2 rounded-2xl bg-white/30 backdrop-blur-sm border border-white/40 shadow-sm">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-lime-400 to-lime-600 flex items-center justify-center text-white font-black shadow-md shadow-lime-500/20 border border-white/60">
                    {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-gray-900 truncate tracking-tight">
                        {user.name}
                    </p>
                    <p className="text-[10px] font-bold text-gray-500/80 uppercase tracking-widest truncate">
                        {role}
                    </p>
                </div>
            </div>

            <button
                suppressHydrationWarning
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 rounded-2xl transition-all duration-300 cursor-pointer group"
            >
                <LogOut size={16} className="transition-transform group-hover:-translate-x-1" />
                <span>Cerrar Sesión</span>
            </button>
        </div>
    );
}
