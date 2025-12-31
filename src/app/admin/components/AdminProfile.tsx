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
        <div className="absolute bottom-0 w-full p-4 border-t border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <div className="flex items-center gap-3 px-4 py-2 mb-2">
                <div className="h-8 w-8 rounded-full bg-lime-100 dark:bg-lime-900/30 flex items-center justify-center text-lime-700 dark:text-lime-300 font-bold">
                    {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {user.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {role}
                    </p>
                </div>
            </div>

            <button
                suppressHydrationWarning
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors cursor-pointer"
            >
                <LogOut size={16} />
                <span>Cerrar Sesión</span>
            </button>
        </div>
    );
}
