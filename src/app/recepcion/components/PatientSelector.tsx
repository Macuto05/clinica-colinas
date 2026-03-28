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
            <div className="bg-lime-50/70 border border-lime-200/50 rounded-2xl p-4 flex items-center justify-between backdrop-blur-md shadow-sm">
                <div className="flex items-center gap-3">
                    <div>
                        <h4 className="font-bold text-gray-900 text-base">
                            {selectedPatient.nombres} {selectedPatient.apellidos}
                        </h4>
                        <p className="text-xs font-mono text-gray-500 mt-0.5">
                            ID: {selectedPatient.documento} • {selectedPatient.contactEmail && selectedPatient.contactEmail !== 'N/A' ? selectedPatient.contactEmail : 'Sin correo'}
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleClear}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-white/60 rounded-xl transition-colors backdrop-blur-sm"
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
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    placeholder="Buscar paciente por nombre o cédula..."
                    className="w-full pl-11 pr-5 py-3.5 bg-white/50 border border-white/60 rounded-2xl focus:bg-white/80 focus:ring-2 focus:ring-lime-500/50 outline-none text-sm font-medium shadow-inner transition-all placeholder:text-gray-400"
                />
                {loading && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <Loader2 size={16} className="animate-spin text-lime-600" />
                    </div>
                )}
            </div>

            {/* Dropdown Results */}
            {isOpen && results.length > 0 && (
                <div className="absolute z-50 w-full mt-2 bg-white/70 backdrop-blur-xl backdrop-saturate-[1.2] rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.12)] border border-white/60 overflow-hidden max-h-64 overflow-y-auto animate-in fade-in slide-in-from-top-2">
                    {results.map((patient) => (
                        <button
                            key={patient.id}
                            onClick={() => handleSelect(patient)}
                            className="w-full text-left px-5 py-4 hover:bg-white/60 flex items-center gap-3 transition-colors border-b border-white/30 last:border-0"
                        >
                            <div>
                                <div className="font-bold text-gray-900 text-sm">
                                    {patient.nombres} {patient.apellidos}
                                </div>
                                <div className="text-xs text-gray-500 font-mono mt-0.5">
                                    {patient.documento}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {isOpen && query.length >= 2 && results.length === 0 && !loading && (
                <div className="absolute z-50 w-full mt-2 bg-white/70 backdrop-blur-xl backdrop-saturate-[1.2] rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.12)] border border-white/60 p-5 text-center font-bold text-gray-500 text-sm">
                    No se encontraron pacientes.
                </div>
            )}
        </div>
    );
}
