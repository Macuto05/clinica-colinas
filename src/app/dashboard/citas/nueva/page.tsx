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
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">Nueva Cita</h1>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
                        <AlertCircle size={20} />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Specialty */}
                    <Select
                        label="Especialidad"
                        value={selectedSpeciality}
                        onChange={(e) => setSelectedSpeciality(e.target.value)}
                        placeholder="Selecciona una especialidad"
                        options={specialities.map(s => ({ value: s.id.toString(), label: s.name }))}
                    />

                    {/* Doctor */}
                    <Select
                        label="Médico"
                        value={selectedDoctor}
                        onChange={(e) => handleDoctorChange(e.target.value)}
                        disabled={!selectedSpeciality}
                        placeholder="Selecciona un médico"
                        options={doctors.map(d => ({ value: d.id.toString(), label: `Dr. ${d.firstName} ${d.lastName}` }))}
                    />



                    {/* Date Selection - Inline Calendar */}
                    <div className="space-y-4">
                        <label className="block text-sm font-medium text-gray-700">Selecciona Fecha</label>
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                            <CustomCalendar
                                value={selectedDate ? parse(selectedDate, 'yyyy-MM-dd', new Date()) : null}
                                onChange={(date) => {
                                    setSelectedDate(format(date, 'yyyy-MM-dd'));
                                    // Reset slot when date changes
                                    setSelectedSlot("");
                                    setAvailableSlots([]);
                                }}
                                doctorId={selectedDoctor}
                            />
                        </div>
                    </div>

                    {/* Available Slots Section (appears when date is selected) */}
                    {selectedDoctor && selectedDate && (
                        <div className="space-y-3 animate-in fade-in slide-in-from-top-4 duration-300">
                            <div className="flex items-center gap-2 text-gray-800">
                                <Clock className="w-5 h-5 text-lime-600" />
                                <h3 className="font-medium">Horarios Disponibles para el {format(parse(selectedDate, 'yyyy-MM-dd', new Date()), "d 'de' MMMM", { locale: es })}</h3>
                            </div>

                            {isFetchingSlots ? (
                                <div className="p-8 text-center bg-gray-50 rounded-lg border border-gray-100">
                                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-lime-600 mb-2"></div>
                                    <p className="text-sm text-gray-500">Buscando horarios...</p>
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
                                                relative px-4 py-3 text-sm font-semibold rounded-xl border transition-all duration-200 flex flex-col items-center gap-1
                                                ${selectedSlot === slot.start
                                                    ? "bg-lime-600 text-white border-lime-600 shadow-lg scale-105 ring-2 ring-lime-200"
                                                    : slot.available
                                                        ? "bg-white text-gray-700 border-gray-200 hover:border-lime-500 hover:text-lime-700 hover:bg-lime-50 hover:shadow-md"
                                                        : "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed"}
                                            `}
                                        >
                                            <span className="text-base">{slot.start}</span>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-6 bg-red-50 text-red-700 rounded-xl border border-red-100 flex items-center justify-center gap-2">
                                    <AlertCircle className="w-5 h-5" />
                                    <span>No hay horarios disponibles para esta fecha.</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Reason */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Motivo de consulta</label>
                        <textarea
                            rows={3}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Describe brevemente tus síntomas..."
                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-lime-500 focus:ring-lime-500 px-4 py-2 border bg-white/50 backdrop-blur-sm transition-all duration-200"
                        />
                    </div>

                    <div className="pt-4 flex gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.back()}
                            className="flex-1"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            isLoading={isLoading}
                            disabled={!selectedSlot}
                            className="flex-1"
                        >
                            Confirmar Cita
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
