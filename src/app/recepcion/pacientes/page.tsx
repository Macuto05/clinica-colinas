"use client";

import { useState, useEffect } from "react";

import { Search, Plus, User, Edit2, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { PatientModal } from "../components/PatientModal";
// Actually, let's implement debounce manually to be safe or check if hook exists.
// I'll assume standard React pattern.

export default function ReceptionPatientsPage() {
    const [patients, setPatients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Modal State will go here
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState<any>(null);

    const debouncedSearch = useDebounceValue(search, 500);

    const fetchPatients = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: "10",
                search: debouncedSearch
            });
            const res = await fetch(`/api/reception/patients?${params}`);
            if (res.ok) {
                const data = await res.json();
                setPatients(data.data);
                setTotalPages(data.meta.totalPages);
            }
        } catch (error) {
            console.error("Failed to fetch patients", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPatients();
    }, [page, debouncedSearch]);

    const handleEdit = (patient: any) => {
        setSelectedPatient(patient);
        setIsModalOpen(true);
    };

    const handleCreate = () => {
        setSelectedPatient(undefined);
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestión de Pacientes</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Base de datos de pacientes registrados.</p>
                </div>
                <button
                    onClick={handleCreate}
                    suppressHydrationWarning
                    className="px-4 py-2.5 rounded-2xl bg-lime-500/95 hover:bg-lime-500 text-white font-bold shadow-[0_4px_12px_rgba(132,204,22,0.3)] backdrop-blur-md border border-lime-400/50 outline-none focus:ring-2 focus:ring-lime-300 transition-colors flex items-center gap-2 text-sm"
                >
                    <Plus size={18} />
                    Nuevo Paciente
                </button>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                    type="text"
                    placeholder="Buscar por nombre, apellido o cédula..."
                    className="w-full pl-11 pr-5 py-3.5 rounded-2xl bg-white/50 border border-white/60 focus:bg-white/80 focus:ring-2 focus:ring-lime-500/50 outline-none text-sm font-medium shadow-inner transition-all placeholder:text-gray-400"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* Table */}
            <div className="bg-white/40 backdrop-blur-md rounded-3xl shadow-[0_4px_16px_0_rgba(0,0,0,0.02)] border border-white/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-white/30 text-gray-500/80 text-xs font-bold uppercase tracking-wider border-b border-white/40 backdrop-blur-sm">
                            <tr>
                                <th className="px-6 py-4">Paciente</th>
                                <th className="px-6 py-4">Documento</th>
                                <th className="px-6 py-4">Contacto</th>
                                <th className="px-6 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/30 glass-rows">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex justify-center items-center gap-2">
                                            <Loader2 size={20} className="animate-spin" /> Cargando...
                                        </div>
                                    </td>
                                </tr>
                            ) : patients.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                        No se encontraron pacientes.
                                    </td>
                                </tr>
                            ) : (
                                patients.map((patient) => (
                                    <tr key={patient.id} className="hover:bg-white/60 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div>
                                                    <div className="font-bold text-gray-900 text-base">
                                                        {patient.nombres} {patient.apellidos}
                                                    </div>
                                                    <div className="text-xs text-gray-500 font-mono mt-0.5">ID: {patient.id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-800 font-medium">
                                            {patient.documento || "N/A"}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            <div className="flex flex-col text-xs gap-1">
                                                <span>{patient.telefono || "Sin teléfono"}</span>
                                                <span className="text-gray-500/80 font-medium">{patient.contactEmail !== 'N/A' ? patient.contactEmail : ''}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleEdit(patient)}
                                                className="p-2 text-lime-700 hover:text-lime-800 bg-white/50 hover:bg-white/80 rounded-xl shadow-sm border border-white/60 transition-colors backdrop-blur-sm"
                                                title="Editar Paciente"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-white/40 bg-white/30 backdrop-blur-md flex items-center justify-between">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="p-2 text-gray-700 bg-white/50 hover:bg-white/80 rounded-xl border border-white/60 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm backdrop-blur-sm transition-colors"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <span className="text-sm font-bold text-gray-600">
                        Página {page} de {totalPages}
                    </span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="p-2 text-gray-700 bg-white/50 hover:bg-white/80 rounded-xl border border-white/60 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm backdrop-blur-sm transition-colors"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {/* Modal */}
            <PatientModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                patient={selectedPatient}
                onSuccess={fetchPatients}
            />
        </div>
    );
}

// Simple debounce hook inline to avoid dependency issues if file missing
function useDebounceValue(value: string, delay: number) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
}
