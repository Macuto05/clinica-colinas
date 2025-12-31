"use client";

import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useRef } from "react";

// Inline hook to avoid external dependency
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

interface StaffFilterProps {
    roles: { id: string; nombre: string }[];
}

export default function StaffFilter({ roles }: StaffFilterProps) {
    const searchParams = useSearchParams();
    const router = useRouter();

    const handleSearch = useDebouncedCallback((term: string, type: "id" | "search" | "document") => {
        const params = new URLSearchParams(searchParams);
        if (term) {
            params.set(type, term);
        } else {
            params.delete(type);
        }
        router.replace(`?${params.toString()}`);
    }, 300);

    const handleFilterChange = (value: string, type: "role" | "status") => {
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
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {/* ID Filter */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="ID..."
                        defaultValue={searchParams.get("id")?.toString()}
                        onChange={(e) => handleSearch(e.target.value, "id")}
                        className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-zinc-700 dark:bg-zinc-800 focus:ring-2 focus:ring-lime-500 outline-none"
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
                        className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-zinc-700 dark:bg-zinc-800 focus:ring-2 focus:ring-lime-500 outline-none"
                    />
                </div>

                {/* Document Filter */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Documento..."
                        defaultValue={searchParams.get("document")?.toString()}
                        onChange={(e) => handleSearch(e.target.value, "document")}
                        className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-zinc-700 dark:bg-zinc-800 focus:ring-2 focus:ring-lime-500 outline-none"
                    />
                </div>

                {/* Role Filter */}
                <div>
                    <select
                        onChange={(e) => handleFilterChange(e.target.value, "role")}
                        defaultValue={searchParams.get("role")?.toString() || "ALL"}
                        className="w-full px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-zinc-700 dark:bg-zinc-800 focus:ring-2 focus:ring-lime-500 outline-none"
                    >
                        <option value="ALL">Todos los roles</option>
                        {roles.map((rol) => (
                            <option key={rol.id} value={rol.id}>
                                {rol.nombre}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Status Filter */}
                <div>
                    <select
                        onChange={(e) => handleFilterChange(e.target.value, "status")}
                        defaultValue={searchParams.get("status")?.toString() || "ALL"}
                        className="w-full px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-zinc-700 dark:bg-zinc-800 focus:ring-2 focus:ring-lime-500 outline-none"
                    >
                        <option value="ALL">Estado Laboral</option>
                        <option value="ACTIVO">ACTIVO</option>
                        <option value="VACACIONES">VACACIONES</option>
                        <option value="LICENCIA">LICENCIA</option>
                        <option value="SUSPENDIDO">SUSPENDIDO</option>
                        <option value="RETIRADO">RETIRADO</option>
                    </select>
                </div>
            </div>
        </div>
    );
}
