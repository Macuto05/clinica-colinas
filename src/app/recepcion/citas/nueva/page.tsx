"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Calendar, Clock, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Calendar as CustomCalendar } from "@/components/ui/Calendar";
import { format, parse } from "date-fns";
import { es } from "date-fns/locale";
import { PatientSelector } from "../../components/PatientSelector";

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
    start: string;
    end: string;
    available: boolean;
}

interface Patient {
    id: string;
    nombres: string;
    apellidos: string;
    documento: string;
    contactEmail?: string;
}

export default function ReceptionNewAppointmentPage() {
    const router = useRouter();

    // Steps
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

    // Form States
    const [specialities, setSpecialities] = useState<Speciality[]>([]);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);

    const [selectedSpeciality, setSelectedSpeciality] = useState<string>("");
    const [selectedDoctor, setSelectedDoctor] = useState<string>("");
    const [selectedDate, setSelectedDate] = useState<string>("");
    const [selectedSlot, setSelectedSlot] = useState<string>("");
    const [reason, setReason] = useState("");

    // UI States
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingSlots, setIsFetchingSlots] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
            setSelectedDoctor("");
            setAvailableSlots([]);
            setSelectedSlot("");
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

    const fetchSlots = async (doctorId: string, date: string) => {
        setIsFetchingSlots(true);
        try {
            const response = await fetch(`/api/appointments/slots?doctorId=${doctorId}&date=${date}`);
            if (response.ok) {
                const data = await response.json();
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
            if (!selectedPatient) {
                throw new Error("Debes seleccionar un paciente");
            }
            if (!selectedDoctor || !selectedDate || !selectedSlot) {
                throw new Error("Por favor completa todos los campos de la cita");
            }

            const startTimeStr = selectedSlot;
            const [hours, minutes] = startTimeStr.split(':').map(Number);

            // Calculate End Time (30 mins default)
            const endObj = new Date();
            endObj.setHours(hours, minutes + 30);
            const endTimeStr = `${endObj.getHours().toString().padStart(2, '0')}:${endObj.getMinutes().toString().padStart(2, '0')}`;

            const payload = {
                patientId: Number(selectedPatient.id),
                doctorId: Number(selectedDoctor),
                date: selectedDate, // YYYY-MM-DD
                startTime: startTimeStr,
                endTime: endTimeStr,
                reason: reason || "Agendada por Recepción",
                type: "CONSULTA",
                origin: "RECEPTION"
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

            // Success! Redirect to reception dashboard or agenda
            router.push("/recepcion?success=true");

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nueva Cita</h1>

            {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg flex items-center gap-2">
                    <AlertCircle size={20} />
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Form */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Step 1: Patient Selection */}
                    <section className="bg-white/40 backdrop-blur-md p-6 rounded-3xl border border-white/50 shadow-[0_4px_16px_0_rgba(0,0,0,0.02)]">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="bg-lime-100 dark:bg-lime-900/30 p-2 rounded-lg">
                                <UserCheck className="text-lime-600 dark:text-lime-400" size={20} />
                            </div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">1. Seleccionar Paciente</h2>
                        </div>

                        <PatientSelector
                            onSelect={setSelectedPatient}
                            selectedPatient={selectedPatient}
                        />
                        {!selectedPatient && (
                            <p className="text-sm text-gray-500 mt-2 ml-1">Busca por nombre o número de cédula.</p>
                        )}
                    </section>

                    {/* Step 2: Appointment Details - Only show if patient is selected */}
                    {selectedPatient && (
                        <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <section className="bg-white/40 backdrop-blur-md p-6 rounded-3xl border border-white/50 shadow-[0_4px_16px_0_rgba(0,0,0,0.02)] space-y-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                                        <Calendar className="text-blue-600 dark:text-blue-400" size={20} />
                                    </div>
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">2. Detalles de la Cita</h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Select
                                        label="Especialidad"
                                        value={selectedSpeciality}
                                        onChange={(e) => setSelectedSpeciality(e.target.value)}
                                        placeholder="Selecciona especialidad"
                                        options={specialities.map(s => ({ value: s.id.toString(), label: s.name }))}
                                    />

                                    <Select
                                        label="Médico"
                                        value={selectedDoctor}
                                        onChange={(e) => setSelectedDoctor(e.target.value)}
                                        disabled={!selectedSpeciality}
                                        placeholder="Selecciona médico"
                                        options={doctors.map(d => ({ value: d.id.toString(), label: `Dr. ${d.firstName} ${d.lastName}` }))}
                                    />
                                </div>

                                {/* Calendar & Slots */}
                                <div className="space-y-4 pt-2">
                                    <label className="block text-sm font-bold text-gray-500/80 uppercase tracking-wider mb-2">Fecha y Hora</label>
                                    <div className="bg-white/50 backdrop-blur-sm rounded-3xl border border-white/60 shadow-inner p-4">
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

                                {/* Slots Grid */}
                                {selectedDoctor && selectedDate && (
                                    <div className="space-y-3 animate-in fade-in">
                                        <div className="flex items-center gap-2 text-gray-800 dark:text-gray-200">
                                            <Clock className="w-4 h-4 text-lime-600" />
                                            <h3 className="font-medium text-sm">Horarios para el {format(parse(selectedDate, 'yyyy-MM-dd', new Date()), "d 'de' MMMM", { locale: es })}</h3>
                                        </div>

                                        {isFetchingSlots ? (
                                            <div className="py-8 text-center">
                                                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-lime-600"></div>
                                            </div>
                                        ) : availableSlots.length > 0 ? (
                                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                                                {availableSlots.map((slot, idx) => (
                                                    <button
                                                        key={idx}
                                                        type="button"
                                                        disabled={!slot.available}
                                                        onClick={() => setSelectedSlot(slot.start)}
                                                        className={`
                                                            px-2 py-3 text-sm font-bold rounded-2xl border transition-all
                                                            ${selectedSlot === slot.start
                                                                ? "border-lime-500/80 bg-lime-50 text-lime-700 shadow-[0_4px_12px_rgba(132,204,22,0.2)] ring-2 ring-lime-400/20 scale-[1.02]"
                                                                : slot.available
                                                                    ? "border-white/60 bg-white/40 text-gray-500 opacity-80 hover:opacity-100 hover:bg-white/60 shadow-sm"
                                                                    : "bg-white/20 text-gray-400 border-white/30 cursor-not-allowed"}
                                                        `}
                                                    >
                                                        {slot.start}
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded-lg text-sm text-center">
                                                No hay horarios disponibles.
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Reason */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-500/80 uppercase tracking-wider mb-2">Motivo (Opcional)</label>
                                    <textarea
                                        rows={2}
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        placeholder="Nota para el médico..."
                                        className="w-full px-5 py-3.5 rounded-2xl bg-white/50 border border-white/60 focus:bg-white/80 focus:ring-2 focus:ring-lime-500/50 outline-none text-sm font-medium shadow-inner transition-all placeholder:text-gray-400 resize-none"
                                    />
                                </div>

                                <div className="pt-4 border-t border-white/40 flex justify-end gap-3 mt-8">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => router.back()}
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        type="submit"
                                        isLoading={isLoading}
                                        disabled={!selectedSlot}
                                    >
                                        Confirmar Cita
                                    </Button>
                                </div>
                            </section>
                        </form>
                    )}
                </div>

                {/* Right Column: Summary Preview */}
                <div className="hidden lg:block">
                    <div className="sticky top-40 bg-white/40 backdrop-blur-xl rounded-[2.5rem] border border-white/50 p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.06)] space-y-6">
                        <h3 className="font-bold text-gray-900 border-b border-white/40 pb-4 text-lg tracking-tight">Resumen</h3>

                        <div className="space-y-4 text-sm">
                            <div>
                                <p className="text-gray-500 dark:text-gray-400">Paciente</p>
                                <p className="font-medium text-gray-900 dark:text-white">{selectedPatient ? `${selectedPatient.nombres} ${selectedPatient.apellidos}` : '-'}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 dark:text-gray-400">Especialidad</p>
                                <p className="font-medium text-gray-900 dark:text-white">{specialities.find(s => s.id.toString() === selectedSpeciality)?.name || '-'}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 dark:text-gray-400">Médico</p>
                                <p className="font-medium text-gray-900 dark:text-white">
                                    {(() => {
                                        const doc = doctors.find(d => d.id.toString() === selectedDoctor);
                                        return doc ? `Dr. ${doc.firstName} ${doc.lastName}` : '-';
                                    })()}
                                </p>
                            </div>
                            <div>
                                <p className="text-gray-500 dark:text-gray-400">Fecha y Hora</p>
                                <p className="font-medium text-gray-900 dark:text-white">
                                    {selectedDate ? format(parse(selectedDate, 'yyyy-MM-dd', new Date()), "d MMM yyyy", { locale: es }) : '-'}
                                    {selectedSlot ? ` a las ${selectedSlot}` : ''}
                                </p>
                            </div>
                        </div>

                        {!selectedPatient && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 p-3 rounded-lg text-xs leading-relaxed">
                                Selecciona un paciente para comenzar el agendamiento.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
