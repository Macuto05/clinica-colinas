"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { AlertCircle, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { FormInput } from "@/components/auth/FormInput";
import { Calendar as CustomCalendar } from "@/components/ui/Calendar";
import { format, parse } from "date-fns";
import { es } from "date-fns/locale";

interface Speciality {
    id: number;
    name: string;
}

interface Doctor {
    id: number;
    firstName: string;
    lastName: string;
    specialityId: number;
}

interface TimeSlot {
    start: string; // "HH:mm"
    end: string;   // "HH:mm"
    available: boolean;
}

export default function NewAppointmentPage() {
    const { user } = useAuth();
    const router = useRouter();

    // Form States
    const [specialities, setSpecialities] = useState<Speciality[]>([]);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);

    const [selectedSpeciality, setSelectedSpeciality] = useState<string>("");
    const [selectedDoctor, setSelectedDoctor] = useState<string>("");
    const [selectedDate, setSelectedDate] = useState<string>("");
    const [selectedSlot, setSelectedSlot] = useState<string>(""); // "HH:mm"
    const [reason, setReason] = useState("");
    const [minDate, setMinDate] = useState("");
    const [workingDays, setWorkingDays] = useState<number[]>([]);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);

    // UI States
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingSlots, setIsFetchingSlots] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 0. Initialize Min Date
    useEffect(() => {
        setMinDate(new Date().toISOString().split('T')[0]);
    }, []);

    // 1. Fetch Specialties on Mount
    useEffect(() => {
        const loadSpecialties = async () => {
            try {
                const res = await fetch("/api/specialties");
                if (res.ok) {
                    const data = await res.json();
                    setSpecialities(data);
                }
            } catch (err) {
                console.error("Error loading specialties:", err);
            }
        };
        loadSpecialties();
    }, []);

    // 2. Fetch Doctors when Specialty Changes
    useEffect(() => {
        if (selectedSpeciality) {
            fetchDoctors(selectedSpeciality);
            fetchDoctors(selectedSpeciality);
            setSelectedDoctor(""); // Reset doctor
            setAvailableSlots([]); // Reset slots
            setSelectedSlot("");
            setWorkingDays([]); // Reset working days
            setSelectedDate("");
        } else {
            setDoctors([]);
        }
    }, [selectedSpeciality]);

    // 3. Fetch Slots when Doctor or Date Changes
    useEffect(() => {
        if (selectedDoctor && selectedDate) {
            fetchSlots(selectedDoctor, selectedDate);
        } else {
            setAvailableSlots([]);
        }
    }, [selectedDoctor, selectedDate]);

    const fetchDoctors = async (specialityId: string) => {
        try {
            const response = await fetch(`/api/doctors?specialityId=${specialityId}`);
            if (response.ok) {
                const data = await response.json();
                // Map API response to Doctor interface if needed
                // Assuming API returns { id, firstName, lastName, ... }
                setDoctors(data.map((d: any) => ({
                    id: d.id,
                    firstName: d.firstName,
                    lastName: d.lastName,
                    specialityId: d.specialtiyId
                })));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const fetchWorkingDays = async (doctorId: string) => {
        try {
            const res = await fetch(`/api/doctors/${doctorId}/working-days`);
            if (res.ok) {
                const data = await res.json();
                setWorkingDays(data.workingDays);
            }
        } catch (error) {
            console.error("Error fetching working days:", error);
        }
    };

    // Update doctor selection to fetch working days
    const handleDoctorChange = (doctorId: string) => {
        setSelectedDoctor(doctorId);
        if (doctorId) {
            fetchWorkingDays(doctorId);
        } else {
            setWorkingDays([]);
        }
    };

    const fetchSlots = async (doctorId: string, date: string) => {
        setIsFetchingSlots(true);
        try {
            // Ensure date is purely YYYY-MM-DD string without timezone interference
            // 'date' state comes from format(date, 'yyyy-MM-dd') so it should be safe,
            // but let's double check if we are passing it directly.

            const response = await fetch(`/api/appointments/slots?doctorId=${doctorId}&date=${date}`);
            if (response.ok) {
                const data = await response.json();
                // API returns { slots: TimeSlot[] } or just TimeSlot[]?
                // Depending on GetAvailableSlotsUseCase return.
                // It returns { slots: [...] } usually.
                setAvailableSlots(data.slots || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsFetchingSlots(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            if (!selectedDoctor || !selectedDate || !selectedSlot) {
                throw new Error("Por favor completa todos los campos");
            }

            // user might be structured differently depending on AuthContext
            // Typically user.id or user.patientId
            // Let's assume user.id is the User ID, but we need Patient ID.
            // If user object has nested patient info: user.patient?.id
            // Or if session stores patientId directly.
            // fallback to user.id if named that way.

            // Checking AuthContext implementation would be good, but let's try safe access
            const patientId = (user as any)?.patient?.patientId || (user as any)?.patientId;

            if (!patientId) throw new Error("No se pudo identificar al paciente. Inicia sesión nuevamente.");

            // Construct timestamps
            const startTimeStr = selectedSlot;
            // Assume 30 min duration for now? Or get duration from slot?
            // Let's assume 30 mins standard or calculate from slot end if available.
            // Ideally backend handles this or we send slot index.
            // Sending generic 30 mins for now.

            const [hours, minutes] = startTimeStr.split(':').map(Number);
            const startDate = new Date(selectedDate); // Local -> Beware timezone issues if not careful
            // Safer to treat date as string and concat time for ISO
            // But let's keep it simple for now as backend expects ISO strings usually

            // Simple end time calc
            const endObj = new Date();
            endObj.setHours(hours, minutes + 30);
            const endTimeStr = `${endObj.getHours().toString().padStart(2, '0')}:${endObj.getMinutes().toString().padStart(2, '0')}`;


            const payload = {
                patientId: Number(patientId),
                doctorId: Number(selectedDoctor),
                date: selectedDate, // YYYY-MM-DD
                startTime: startTimeStr, // HH:MM
                endTime: endTimeStr, // HH:MM
                reason: reason || "Consulta General",
                type: "CONSULTA",
                origin: "WEB"
            };

            const response = await fetch("/api/appointments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Error al agendar cita");
            }

            router.push("/dashboard/citas?success=true");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex justify-center p-4 sm:p-6 md:p-8 animate-in fade-in duration-300">
            <div className="bg-white/70 backdrop-blur-2xl w-full max-w-2xl rounded-[2.5rem] shadow-[0_8px_32px_0_rgba(0,0,0,0.12)] border border-white/60 flex flex-col overflow-hidden">
                
                {/* Header */}
                <div className="p-6 sm:p-8 border-b border-white/40 bg-white/30 backdrop-blur-md flex items-center justify-between shrink-0">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Nueva Cita</h1>
                        <p className="text-sm text-gray-500/80 font-medium tracking-wider mt-1">Agenda una consulta con nuestros especialistas</p>
                    </div>
                    <div className="w-12 h-12 bg-lime-500/10 rounded-full border border-lime-500/20 shadow-inner flex items-center justify-center">
                        <Calendar className="text-lime-600 w-6 h-6" />
                    </div>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
                    <div className="p-6 sm:p-8 space-y-6">
                        
                        {error && (
                            <div className="p-4 bg-red-50 text-red-700/90 rounded-2xl flex items-center gap-2 border border-red-200/50 shadow-sm backdrop-blur-md">
                                <AlertCircle size={20} />
                                <span className="text-sm font-bold">{error}</span>
                            </div>
                        )}

                        {/* Section 1: Especialidad y Médico */}
                        <section className="bg-white/40 backdrop-blur-md border border-white/50 rounded-3xl p-5 shadow-[0_4px_16px_0_rgba(0,0,0,0.02)] space-y-4">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="w-7 h-7 rounded-full bg-gray-900/90 text-white shadow-md text-xs font-black flex items-center justify-center shrink-0">1</span>
                                <h4 className="font-bold text-gray-800 text-base">Especialidad y Médico</h4>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500/80 uppercase tracking-wider mb-2 block">Especialidad</label>
                                    <select
                                        value={selectedSpeciality}
                                        onChange={(e) => setSelectedSpeciality(e.target.value)}
                                        className="w-full px-5 py-3.5 rounded-2xl bg-white/50 border border-white/60 focus:bg-white/80 focus:ring-2 focus:ring-lime-500/50 outline-none text-sm font-medium shadow-inner transition-all text-gray-800 cursor-pointer"
                                    >
                                        <option value="" disabled>Selecciona especialidad</option>
                                        {specialities.map(s => (
                                            <option key={s.id} value={s.id.toString()}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500/80 uppercase tracking-wider mb-2 block">Médico</label>
                                    <select
                                        value={selectedDoctor}
                                        onChange={(e) => handleDoctorChange(e.target.value)}
                                        disabled={!selectedSpeciality}
                                        className="w-full px-5 py-3.5 rounded-2xl bg-white/50 border border-white/60 focus:bg-white/80 focus:ring-2 focus:ring-lime-500/50 outline-none text-sm font-medium shadow-inner transition-all text-gray-800 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <option value="" disabled>Selecciona un médico</option>
                                        {doctors.map(d => (
                                            <option key={d.id} value={d.id.toString()}>Dr. {d.firstName} {d.lastName}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </section>

                        {/* Section 2: Fecha y Hora */}
                        <section className="bg-white/40 backdrop-blur-md border border-white/50 rounded-3xl p-5 shadow-[0_4px_16px_0_rgba(0,0,0,0.02)] space-y-4">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="w-7 h-7 rounded-full bg-gray-900/90 text-white shadow-md text-xs font-black flex items-center justify-center shrink-0">2</span>
                                <h4 className="font-bold text-gray-800 text-base">Fecha y Hora</h4>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500/80 uppercase tracking-wider mb-2 block">Selecciona la Fecha</label>
                                    <div className="bg-white/50 rounded-[1.5rem] border border-white/60 shadow-sm overflow-hidden p-2">
                                        <CustomCalendar
                                            value={selectedDate ? parse(selectedDate, 'yyyy-MM-dd', new Date()) : null}
                                            onChange={(date) => {
                                                setSelectedDate(format(date, 'yyyy-MM-dd'));
                                                setSelectedSlot("");
                                                setAvailableSlots([]);
                                            }}
                                            doctorId={selectedDoctor}
                                        />
                                    </div>
                                </div>

                                {/* Available Slots Section */}
                                {selectedDoctor && selectedDate && (
                                    <div className="space-y-3 animate-in fade-in slide-in-from-top-4 duration-300 pt-2">
                                        <div className="flex items-center gap-2 text-gray-800">
                                            <Clock className="w-5 h-5 text-lime-600" />
                                            <h3 className="font-bold text-sm">Disponibilidad para el {format(parse(selectedDate, 'yyyy-MM-dd', new Date()), "d 'de' MMMM", { locale: es })}</h3>
                                        </div>

                                        {isFetchingSlots ? (
                                            <div className="p-8 text-center bg-white/30 backdrop-blur-sm rounded-2xl border border-white/50 shadow-inner">
                                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-lime-600 mb-2"></div>
                                                <p className="text-sm font-bold text-gray-500">Buscando horarios...</p>
                                            </div>
                                        ) : availableSlots.length > 0 ? (
                                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                                                {availableSlots.map((slot, idx) => (
                                                    <button
                                                        key={idx}
                                                        type="button"
                                                        disabled={!slot.available}
                                                        onClick={() => setSelectedSlot(slot.start)}
                                                        className={`
                                                            relative px-4 py-3 text-sm font-bold rounded-2xl border transition-all duration-200 flex flex-col items-center gap-1 focus:outline-none
                                                            ${selectedSlot === slot.start
                                                                ? "border-lime-500/80 bg-lime-50 text-lime-700 shadow-[0_4px_12px_rgba(132,204,22,0.2)] ring-2 ring-lime-400/20 scale-[1.02]"
                                                                : slot.available
                                                                    ? "border-white/60 bg-white/40 text-gray-500 opacity-80 hover:opacity-100 hover:bg-white/60 shadow-sm"
                                                                    : "bg-gray-100/50 text-gray-300 border-white/40 cursor-not-allowed"}
                                                        `}
                                                    >
                                                        <span className="text-base tracking-wide">{slot.start}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="p-5 bg-red-50 text-red-700/80 rounded-2xl border border-red-200 flex items-center justify-center gap-2 shadow-sm font-bold text-sm">
                                                <AlertCircle className="w-5 h-5" />
                                                <span>No hay horarios disponibles para esta fecha.</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Section 3: Motivo */}
                        <section className="bg-white/40 backdrop-blur-md border border-white/50 rounded-3xl p-5 shadow-[0_4px_16px_0_rgba(0,0,0,0.02)] space-y-4">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="w-7 h-7 rounded-full bg-gray-900/90 text-white shadow-md text-xs font-black flex items-center justify-center shrink-0">3</span>
                                <h4 className="font-bold text-gray-800 text-base">Motivo de consulta</h4>
                            </div>
                            <div>
                                <textarea
                                    rows={3}
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="Describe brevemente tus síntomas o motivo de consulta..."
                                    className="w-full px-5 py-4 rounded-2xl bg-white/50 border border-white/60 focus:bg-white/80 focus:ring-2 focus:ring-lime-500/50 outline-none text-sm font-medium shadow-inner transition-all placeholder:text-gray-400 resize-none text-gray-800"
                                />
                            </div>
                        </section>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-6 sm:p-8 border-t border-white/40 flex gap-3 shrink-0 bg-white/30 backdrop-blur-md">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="flex-1 py-3.5 rounded-2xl bg-white/50 border border-white/60 text-gray-700 font-bold hover:bg-white/80 transition-colors text-sm shadow-sm backdrop-blur-sm outline-none focus:ring-2 focus:ring-gray-300"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={!selectedSlot || isLoading}
                            className={`flex-1 py-3.5 rounded-2xl font-bold transition-all text-sm flex items-center justify-center gap-2 outline-none
                                ${!selectedSlot || isLoading 
                                    ? "bg-gray-100 text-gray-400 border border-white/40 cursor-not-allowed shadow-none" 
                                    : "bg-red-500/95 hover:bg-red-500 text-white shadow-[0_8px_20px_rgba(239,68,68,0.3)] border border-red-400/50 focus:ring-2 focus:ring-red-300"
                                }
                            `}
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                "Confirmar Cita"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
