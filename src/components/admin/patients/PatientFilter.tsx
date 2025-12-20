"use client";

import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useRef } from "react";

// Inline hook for debounce
function useDebouncedCallback<T extends (...args: any[]) => void>(callback: T, delay: number) {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    return useCallback((...args: Parameters<T>) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            callback(...args);
        }, delay);
    }, [callback, delay]);
}

export default function PatientFilter() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const handleSearch = useDebouncedCallback((term: string, type: "id" | "search" | "doc") => {
        const params = new URLSearchParams(searchParams);
        if (term) {
            params.set(type, term);
        } else {
            params.delete(type);
        }
        router.replace(`?${params.toString()}`);
    }, 300);

    const handleFilterChange = (value: string, type: "status" | "userStatus") => {
        const params = new URLSearchParams(searchParams);
        if (value && value !== "ALL") {
            params.set(type, value);
        } else {
            params.delete(type);
        }
        router.replace(`?${params.toString()}`);
    };

    return (
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* ID Filter */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="ID..."
                        defaultValue={searchParams.get("id")?.toString()}
                        onChange={(e) => handleSearch(e.target.value, "id")}
                        className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-zinc-700 dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                </div>

                {/* Name Filter */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Nombre..."
                        defaultValue={searchParams.get("search")?.toString()}
                        onChange={(e) => handleSearch(e.target.value, "search")}
                        className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-zinc-700 dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                </div>

                {/* Document Filter */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Documento..."
                        defaultValue={searchParams.get("doc")?.toString()}
                        onChange={(e) => handleSearch(e.target.value, "doc")}
                        className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-zinc-700 dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                </div>

                {/* Patient Status Filter */}
                <div>
                    <select
                        onChange={(e) => handleFilterChange(e.target.value, "status")}
                        defaultValue={searchParams.get("status")?.toString() || "ALL"}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-zinc-700 dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    >
                        <option value="ALL">Estado Paciente</option>
                        <option value="ACTIVO">Activo</option>
                        <option value="INACTIVO">Inactivo</option>
                        <option value="BLOQUEADO">Bloqueado</option>
                        <option value="FALLECIDO">Fallecido</option>
                    </select>
                </div>

                {/* User Status Filter */}
                <div>
                    <select
                        onChange={(e) => handleFilterChange(e.target.value, "userStatus")}
                        defaultValue={searchParams.get("userStatus")?.toString() || "ALL"}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-zinc-700 dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    >
                        <option value="ALL">Estado Usuario</option>
                        <option value="ACTIVO">Activo</option>
                        <option value="INACTIVO">Inactivo</option>
                        <option value="BLOQUEADO">Bloqueado</option>
                    </select>
                </div>
            </div>
        </div>
    );
}
