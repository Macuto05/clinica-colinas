"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, Check, User, Loader2 } from "lucide-react";

interface Patient {
    id: string;
    nombres: string;
    apellidos: string;
    documento: string;
    contactEmail?: string;
}

interface PatientSelectorProps {
    onSelect: (patient: Patient | null) => void;
    selectedPatient: Patient | null;
}

export function PatientSelector({ onSelect, selectedPatient }: PatientSelectorProps) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.length >= 2) {
                searchPatients();
            } else {
                setResults([]);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [query]);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const searchPatients = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/reception/patients?search=${encodeURIComponent(query)}&limit=5`);
            if (res.ok) {
                const data = await res.json();
                setResults(data.data);
                setIsOpen(true);
            }
        } catch (error) {
            console.error("Error searching patients:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (patient: Patient) => {
        onSelect(patient);
        setIsOpen(false);
        setQuery(""); // Clear search
    };

    const handleClear = () => {
        onSelect(null);
        setQuery("");
        setResults([]);
    };

    if (selectedPatient) {
        return (
            <div className="bg-lime-50 dark:bg-lime-900/20 border border-lime-200 dark:border-lime-900 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div>
                        <h4 className="font-bold text-gray-900 dark:text-white">
                            {selectedPatient.nombres} {selectedPatient.apellidos}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            ID: {selectedPatient.documento} • {selectedPatient.contactEmail && selectedPatient.contactEmail !== 'N/A' ? selectedPatient.contactEmail : 'Sin correo'}
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleClear}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Cambiar paciente"
                >
                    <X size={20} />
                </button>
            </div>
        );
    }

    return (
        <div className="relative" ref={wrapperRef}>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    placeholder="Buscar paciente por nombre o cédula..."
                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-lime-500 focus:border-transparent outline-none transition-all"
                />
                {loading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 size={16} className="animate-spin text-gray-400" />
                    </div>
                )}
            </div>

            {/* Dropdown Results */}
            {isOpen && results.length > 0 && (
                <div className="absolute z-50 w-full mt-2 bg-white dark:bg-zinc-800 rounded-xl shadow-xl border border-gray-100 dark:border-zinc-700 overflow-hidden max-h-64 overflow-y-auto animate-in fade-in slide-in-from-top-2">
                    {results.map((patient) => (
                        <button
                            key={patient.id}
                            onClick={() => handleSelect(patient)}
                            className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-zinc-700/50 flex items-center gap-3 transition-colors border-b border-gray-50 dark:border-zinc-700/50 last:border-0"
                        >
                            <div>
                                <div className="font-medium text-gray-900 dark:text-white">
                                    {patient.nombres} {patient.apellidos}
                                </div>
                                <div className="text-xs text-gray-500">
                                    {patient.documento}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {isOpen && query.length >= 2 && results.length === 0 && !loading && (
                <div className="absolute z-50 w-full mt-2 bg-white dark:bg-zinc-800 rounded-xl shadow-xl border border-gray-100 dark:border-zinc-700 p-4 text-center text-gray-500 text-sm">
                    No se encontraron pacientes.
                </div>
            )}
        </div>
    );
}
