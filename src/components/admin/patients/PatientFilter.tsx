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
        <div className="bg-white/40 backdrop-blur-md p-6 rounded-[2rem] border border-white/50 shadow-sm mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                {/* ID Filter */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">ID</label>
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="ID..."
                            defaultValue={searchParams.get("id")?.toString()}
                            onChange={(e) => handleSearch(e.target.value, "id")}
                            className="w-full pl-11 pr-4 py-3 text-sm font-medium rounded-2xl bg-white/50 border border-white/60 focus:bg-white/80 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-gray-400/60 shadow-inner"
                        />
                    </div>
                </div>

                {/* Name Filter */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nombre</label>
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar..."
                            defaultValue={searchParams.get("search")?.toString()}
                            onChange={(e) => handleSearch(e.target.value, "search")}
                            className="w-full pl-11 pr-4 py-3 text-sm font-medium rounded-2xl bg-white/50 border border-white/60 focus:bg-white/80 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-gray-400/60 shadow-inner"
                        />
                    </div>
                </div>

                {/* Document Filter */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Documento</label>
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Documento..."
                            defaultValue={searchParams.get("doc")?.toString()}
                            onChange={(e) => handleSearch(e.target.value, "doc")}
                            className="w-full pl-11 pr-4 py-3 text-sm font-medium rounded-2xl bg-white/50 border border-white/60 focus:bg-white/80 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-gray-400/60 shadow-inner"
                        />
                    </div>
                </div>

                {/* Patient Status Filter */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Estado Paciente</label>
                    <select
                        onChange={(e) => handleFilterChange(e.target.value, "status")}
                        defaultValue={searchParams.get("status")?.toString() || "ALL"}
                        className="w-full px-4 py-3 text-sm font-bold rounded-2xl bg-white/50 border border-white/60 focus:bg-white/80 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all appearance-none cursor-pointer shadow-inner"
                    >
                        <option value="ALL">Todos</option>
                        <option value="ACTIVO">Activo</option>
                        <option value="INACTIVO">Inactivo</option>
                        <option value="BLOQUEADO">Bloqueado</option>
                        <option value="FALLECIDO">Fallecido</option>
                    </select>
                </div>

                {/* User Status Filter */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Estado Usuario</label>
                    <select
                        onChange={(e) => handleFilterChange(e.target.value, "userStatus")}
                        defaultValue={searchParams.get("userStatus")?.toString() || "ALL"}
                        className="w-full px-4 py-3 text-sm font-bold rounded-2xl bg-white/50 border border-white/60 focus:bg-white/80 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all appearance-none cursor-pointer shadow-inner"
                    >
                        <option value="ALL">Todos</option>
                        <option value="ACTIVO">Activo</option>
                        <option value="INACTIVO">Inactivo</option>
                        <option value="BLOQUEADO">Bloqueado</option>
                    </select>
                </div>
            </div>
        </div>
    );
}
