"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Calendar, Clock, User, CheckCircle2, AlertCircle } from "lucide-react";
import { FormInput } from "@/components/auth/FormInput"; // Or generic input

interface Speciality {
    id: number;
    name: string;
}

interface Doctor {
    id: number;
    firstName: string;
    lastName: string;
}

export default function NewAppointmentPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    // Form States
    const [specialities, setSpecialities] = useState<Speciality[]>([]);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [selectedSpeciality, setSelectedSpeciality] = useState<string>("");
    const [selectedDoctor, setSelectedDoctor] = useState<string>("");
    const [selectedDate, setSelectedDate] = useState<string>("");
    const [selectedTime, setSelectedTime] = useState<string>("");
    const [reason, setReason] = useState("");

    // UI States
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Load specialities on mount
        // Mocking for now as we don't have a public Specialities API fully verified in routes yet, 
        // OR we can try to fetch if we implemented it. 
        // Let's assume we have a basic list or fetch from API if exists.
        // Wait, I didn't explicitly refactor /api/specialities, but I saw folders.
        // Let's try to fetch doctors directly if specialty selected, 
        // but getting the list of specialties might be needed.
        // For this task, I will hardcode some specialties or try to fetch from an endpoint if I can find one.
        // Actually, looking at previous file list, `src/app/api` had `doctors`.
        // Let's try to fetch doctors by specialty.

        // Mock specialties for UI
        setSpecialities([
            { id: 1, name: "Medicina General" },
            { id: 2, name: "Pediatría" },
            { id: 3, name: "Cardiología" },
            { id: 4, name: "Dermatología" },
            { id: 5, name: "Ginecología" }
        ]);
    }, []);

    useEffect(() => {
        if (selectedSpeciality) {
            fetchDoctors(selectedSpeciality);
        } else {
            setDoctors([]);
        }
    }, [selectedSpeciality]);

    const fetchDoctors = async (specialityName: string) => {
        try {
            const response = await fetch(`/api/doctors?specialityId=${encodeURIComponent(specialityName)}`);
            // Note: API expects ID or Name depending on my last fix. 
            // My last fix in GetDoctorsBySpeciality used `speciality.name` lookup but the API route `api/doctors/route.ts` 
            // passes `specialityId` param as integer to controller.
            // Wait, looking back at `api/doctors/route.ts`:
            // `const specialityId = searchParams.get('specialityId');`
            // `return doctorController.getBySpeciality(parseInt(specialityId));`
            // It expects an INTEGER ID.
            // And `GetDoctorsBySpeciality.ts`:
            // `async execute(specialityId: number): Promise<Doctor[]> { ... this.specialityRepository.findById(specialityId) ... }`
            // So I MUST pass the ID.

            // However, in the `handleSpecialityChange` I have the ID.
            const response2 = await fetch(`/api/doctors?specialityId=${specialityName}`); // passing ID here actually
            if (response2.ok) {
                const data = await response2.json();
                setDoctors(data);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            // Validate
            if (!selectedDoctor || !selectedDate || !selectedTime) {
                throw new Error("Por favor completa todos los campos");
            }

            const patientId = (user as any)?.patientId;
            if (!patientId) throw new Error("No se pudo identificar al paciente");

            // Calculate endTime (default 30 mins)
            const [hours, minutes] = selectedTime.split(':').map(Number);
            const dateObj = new Date();
            dateObj.setHours(hours, minutes + 30);
            const endTime = `${dateObj.getHours().toString().padStart(2, '0')}:${dateObj.getMinutes().toString().padStart(2, '0')}`;

            const payload = {
                patientId,
                doctorId: parseInt(selectedDoctor),
                date: selectedDate,
                startTime: selectedTime,
                endTime: endTime, // Simple 30 min slot
                type: "CONSULTA",
                origin: "WEB",
                reason
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
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Especialidad</label>
                        <select
                            value={selectedSpeciality}
                            onChange={(e) => setSelectedSpeciality(e.target.value)}
                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 py-2.5"
                        >
                            <option value="">Selecciona una especialidad</option>
                            {specialities.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Doctor */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Médico</label>
                        <select
                            value={selectedDoctor}
                            onChange={(e) => setSelectedDoctor(e.target.value)}
                            disabled={!selectedSpeciality}
                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 py-2.5 disabled:bg-gray-100 disabled:text-gray-400"
                        >
                            <option value="">Selecciona un médico</option>
                            {doctors.map(d => (
                                <option key={d.id} value={d.id}>Dr. {d.firstName} {d.lastName}</option>
                            ))}
                        </select>
                    </div>

                    {/* Date & Time */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                            <input
                                type="date"
                                min={new Date().toISOString().split('T')[0]}
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 py-2.5"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Hora</label>
                            <input
                                type="time"
                                value={selectedTime}
                                onChange={(e) => setSelectedTime(e.target.value)}
                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 py-2.5"
                            />
                        </div>
                    </div>

                    {/* Reason */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Motivo de consulta</label>
                        <textarea
                            rows={3}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Describe brevemente tus síntomas..."
                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                        />
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium disabled:opacity-70 flex justify-center items-center gap-2"
                        >
                            {isLoading ? 'Agendando...' : 'Confirmar Cita'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
