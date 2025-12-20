
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

export function SpecialtyFilter() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const handleSearch = useDebouncedCallback((term: string, type: "id" | "nombre") => {
        const params = new URLSearchParams(searchParams);
        if (term) {
            params.set(type, term);
        } else {
            params.delete(type);
        }
        router.replace(`?${params.toString()}`);
    }, 300);

    const handleActiveChange = (value: string) => {
        const params = new URLSearchParams(searchParams);
        if (value && value !== "ALL") {
            params.set("active", value);
        } else {
            params.delete("active");
        }
        router.replace(`?${params.toString()}`);
    };

    return (
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* ID Filter */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Filtrar por ID..."
                        defaultValue={searchParams.get("id")?.toString()}
                        onChange={(e) => handleSearch(e.target.value, "id")}
                        className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-zinc-700 dark:bg-zinc-800 focus:ring-2 focus:ring-lime-500 outline-none"
                    />
                </div>

                {/* Name Filter */}
                <div className="relative md:col-span-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre..."
                        defaultValue={searchParams.get("nombre")?.toString()}
                        onChange={(e) => handleSearch(e.target.value, "nombre")}
                        className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-zinc-700 dark:bg-zinc-800 focus:ring-2 focus:ring-lime-500 outline-none"
                    />
                </div>

                {/* Status Filter */}
                <div>
                    <select
                        onChange={(e) => handleActiveChange(e.target.value)}
                        defaultValue={searchParams.get("active")?.toString() || "ALL"}
                        className="w-full px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-zinc-700 dark:bg-zinc-800 focus:ring-2 focus:ring-lime-500 outline-none"
                    >
                        <option value="ALL">Todos los estados</option>
                        <option value="true">Activa</option>
                        <option value="false">Inactiva</option>
                    </select>
                </div>
            </div>
        </div>
    );
}
