"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CalendarClock, Clock, UserCheck, Calendar } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Calendar as CustomCalendar } from "@/components/ui/Calendar";
import { format, parse } from "date-fns";
import { es } from "date-fns/locale";
import { PatientSelector } from "@/app/recepcion/components/PatientSelector";

interface Speciality {
    id: number;
    name: string;
}

interface Doctor {
    id: number;
    firstName: string;
    lastName: string;
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

export default function AdminNewAppointmentPage() {
    const router = useRouter();

    const [selectedPatient, setSelectedPatient]     = useState<Patient | null>(null);
    const [specialities, setSpecialities]           = useState<Speciality[]>([]);
    const [doctors, setDoctors]                     = useState<Doctor[]>([]);
    const [availableSlots, setAvailableSlots]       = useState<TimeSlot[]>([]);
    const [selectedSpeciality, setSelectedSpeciality] = useState("");
    const [selectedDoctor, setSelectedDoctor]       = useState("");
    const [selectedDate, setSelectedDate]           = useState("");
    const [selectedSlot, setSelectedSlot]           = useState("");
    const [reason, setReason]                       = useState("");
    const [isLoading, setIsLoading]                 = useState(false);
    const [isFetchingSlots, setIsFetchingSlots]     = useState(false);
    const [error, setError]                         = useState<string | null>(null);

    useEffect(() => {
        fetch("/api/specialties")
            .then(r => r.ok ? r.json() : [])
            .then(setSpecialities)
            .catch(console.error);
    }, []);

    useEffect(() => {
        if (!selectedSpeciality) { setDoctors([]); return; }
        setSelectedDoctor(""); setSelectedDate(""); setSelectedSlot(""); setAvailableSlots([]);
        fetch(`/api/doctors?specialityId=${selectedSpeciality}`)
            .then(r => r.ok ? r.json() : [])
            .then((data: any[]) => setDoctors(data.map(d => ({ id: d.id, firstName: d.firstName, lastName: d.lastName }))))
            .catch(console.error);
    }, [selectedSpeciality]);

    useEffect(() => {
        if (!selectedDoctor || !selectedDate) { setAvailableSlots([]); return; }
        setIsFetchingSlots(true);
        fetch(`/api/appointments/slots?doctorId=${selectedDoctor}&date=${selectedDate}`)
            .then(r => r.ok ? r.json() : { slots: [] })
            .then(data => setAvailableSlots(data.slots || []))
            .catch(console.error)
            .finally(() => setIsFetchingSlots(false));
    }, [selectedDoctor, selectedDate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!selectedPatient) { setError("Debes seleccionar un paciente."); return; }
        if (!selectedDoctor || !selectedDate || !selectedSlot) { setError("Completa todos los campos de la cita."); return; }

        setIsLoading(true);
        try {
            const [h, m] = selectedSlot.split(":").map(Number);
            const end = new Date(); end.setHours(h, m + 30);
            const endTime = `${end.getHours().toString().padStart(2, "0")}:${end.getMinutes().toString().padStart(2, "0")}`;

            const res = await fetch("/api/appointments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    patientId: Number(selectedPatient.id),
                    doctorId: Number(selectedDoctor),
                    date: selectedDate,
                    startTime: selectedSlot,
                    endTime,
                    reason: reason || "Agendada por Administración",
                    type: "CONSULTA",
                    origin: "ADMIN",
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Error al agendar la cita");
            }

            router.push("/admin/citas?success=true");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const selectedDoctorObj = doctors.find(d => d.id.toString() === selectedDoctor);
    const selectedSpecialityObj = specialities.find(s => s.id.toString() === selectedSpeciality);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-6 bg-white/40 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/50 shadow-sm">
                <button
                    onClick={() => router.back()}
                    className="p-3 rounded-2xl bg-white/50 border border-white/60 text-gray-500 hover:text-gray-800 hover:bg-white/70 transition-all shadow-sm"
                >
                    <ArrowLeft size={20} />
                </button>
                <div className="p-4 bg-lime-500 text-white rounded-3xl shadow-lg shadow-lime-200/50 -rotate-3">
                    <CalendarClock size={28} strokeWidth={2.5} />
                </div>
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Nueva Cita Médica</h1>
                    <p className="text-gray-500 font-medium mt-1">Agenda una cita para cualquier paciente del sistema.</p>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="p-4 bg-red-50/50 backdrop-blur-md border border-red-200/50 text-red-700 rounded-2xl text-sm font-bold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* ─── Main Form ─── */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Step 1: Paciente */}
                    <section className="bg-white/40 backdrop-blur-md border border-white/50 rounded-[2rem] p-6 shadow-[0_4px_16px_0_rgba(0,0,0,0.02)]">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-7 h-7 rounded-full bg-lime-500 text-white flex items-center justify-center text-xs font-black">1</div>
                            <h2 className="text-sm font-black text-gray-700 uppercase tracking-[0.15em]">Seleccionar Paciente</h2>
                        </div>
                        <PatientSelector onSelect={setSelectedPatient} selectedPatient={selectedPatient} />
                        {!selectedPatient && (
                            <p className="text-xs text-gray-400 mt-2 ml-1">Busca por nombre o número de cédula.</p>
                        )}
                    </section>

                    {/* Step 2: Cita Details */}
                    {selectedPatient && (
                        <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-400">
                            <section className="bg-white/40 backdrop-blur-md border border-white/50 rounded-[2rem] p-6 shadow-[0_4px_16px_0_rgba(0,0,0,0.02)] space-y-6">
                                <div className="flex items-center gap-3 mb-1">
                                    <div className="w-7 h-7 rounded-full bg-lime-500 text-white flex items-center justify-center text-xs font-black">2</div>
                                    <h2 className="text-sm font-black text-gray-700 uppercase tracking-[0.15em]">Especialidad y Médico</h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <Select
                                        label="Especialidad"
                                        value={selectedSpeciality}
                                        onChange={e => setSelectedSpeciality(e.target.value)}
                                        placeholder="Selecciona especialidad"
                                        options={specialities.map(s => ({ value: s.id.toString(), label: s.name }))}
                                    />
                                    <Select
                                        label="Médico"
                                        value={selectedDoctor}
                                        onChange={e => { setSelectedDoctor(e.target.value); setSelectedDate(""); setSelectedSlot(""); }}
                                        disabled={!selectedSpeciality}
                                        placeholder={selectedSpeciality ? "Selecciona médico" : "Primero elige especialidad"}
                                        options={doctors.map(d => ({ value: d.id.toString(), label: `Dr. ${d.firstName} ${d.lastName}` }))}
                                    />
                                </div>
                            </section>

                            {selectedDoctor && (
                                <section className="bg-white/40 backdrop-blur-md border border-white/50 rounded-[2rem] p-6 shadow-[0_4px_16px_0_rgba(0,0,0,0.02)] space-y-5 animate-in fade-in duration-300">
                                    <div className="flex items-center gap-3 mb-1">
                                        <div className="w-7 h-7 rounded-full bg-lime-500 text-white flex items-center justify-center text-xs font-black">3</div>
                                        <h2 className="text-sm font-black text-gray-700 uppercase tracking-[0.15em]">Fecha y Hora</h2>
                                    </div>

                                    <div className="bg-white/50 backdrop-blur-sm rounded-3xl border border-white/60 shadow-inner p-4">
                                        <CustomCalendar
                                            value={selectedDate ? parse(selectedDate, "yyyy-MM-dd", new Date()) : null}
                                            onChange={date => { setSelectedDate(format(date, "yyyy-MM-dd")); setSelectedSlot(""); setAvailableSlots([]); }}
                                            doctorId={selectedDoctor}
                                        />
                                    </div>

                                    {selectedDate && (
                                        <div className="space-y-3 animate-in fade-in duration-200">
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-lime-600" />
                                                <span className="text-xs font-black text-gray-500 uppercase tracking-[0.15em]">
                                                    Horarios — {format(parse(selectedDate, "yyyy-MM-dd", new Date()), "d 'de' MMMM", { locale: es })}
                                                </span>
                                            </div>

                                            {isFetchingSlots ? (
                                                <div className="py-8 flex justify-center">
                                                    <div className="w-6 h-6 border-2 border-lime-500 border-t-transparent rounded-full animate-spin" />
                                                </div>
                                            ) : availableSlots.length > 0 ? (
                                                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                                                    {availableSlots.map((slot, i) => (
                                                        <button
                                                            key={i}
                                                            type="button"
                                                            disabled={!slot.available}
                                                            onClick={() => setSelectedSlot(slot.start)}
                                                            className={`py-2.5 text-xs font-bold rounded-2xl border transition-all ${
                                                                selectedSlot === slot.start
                                                                    ? "border-lime-500/80 bg-lime-50 text-lime-700 shadow-[0_4px_12px_rgba(132,204,22,0.2)] ring-2 ring-lime-400/20 scale-[1.03]"
                                                                    : slot.available
                                                                        ? "border-white/60 bg-white/40 text-gray-600 hover:bg-white/70 shadow-sm"
                                                                        : "bg-white/20 text-gray-300 border-white/20 cursor-not-allowed"
                                                            }`}
                                                        >
                                                            {slot.start}
                                                        </button>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="p-4 bg-amber-50/50 border border-amber-200/50 text-amber-700 rounded-2xl text-sm text-center font-medium">
                                                    No hay horarios disponibles para esta fecha.
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </section>
                            )}

                            {/* Motivo */}
                            {selectedSlot && (
                                <section className="bg-white/40 backdrop-blur-md border border-white/50 rounded-[2rem] p-6 shadow-[0_4px_16px_0_rgba(0,0,0,0.02)] animate-in fade-in duration-300">
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-[0.15em] mb-3">
                                        Motivo de Consulta <span className="normal-case font-medium text-gray-400">(opcional)</span>
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={reason}
                                        onChange={e => setReason(e.target.value)}
                                        placeholder="Nota para el médico..."
                                        className="w-full px-5 py-3.5 rounded-2xl bg-white/50 border border-white/60 focus:bg-white/80 focus:ring-4 focus:ring-lime-500/10 outline-none text-sm font-medium shadow-inner transition-all placeholder:text-gray-400 resize-none"
                                    />
                                </section>
                            )}

                            {/* Actions */}
                            <div className="flex justify-end gap-3 pt-2">
                                <Button type="button" variant="outline" onClick={() => router.back()}>
                                    Cancelar
                                </Button>
                                <Button
                                    type="submit"
                                    isLoading={isLoading}
                                    disabled={!selectedSlot || isLoading}
                                >
                                    Confirmar Cita
                                </Button>
                            </div>
                        </form>
                    )}
                </div>

                {/* ─── Summary Sidebar ─── */}
                <div className="hidden lg:block">
                    <div className="sticky top-6 bg-white/40 backdrop-blur-xl rounded-[2rem] border border-white/50 p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.06)] space-y-5">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] pb-4 border-b border-white/40 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-lime-500" />
                            Resumen
                        </h3>

                        {[
                            { label: "Paciente", value: selectedPatient ? `${selectedPatient.nombres} ${selectedPatient.apellidos}` : null },
                            { label: "Especialidad", value: selectedSpecialityObj?.name ?? null },
                            { label: "Médico", value: selectedDoctorObj ? `Dr. ${selectedDoctorObj.firstName} ${selectedDoctorObj.lastName}` : null },
                            {
                                label: "Fecha y Hora",
                                value: selectedDate
                                    ? `${format(parse(selectedDate, "yyyy-MM-dd", new Date()), "d MMM yyyy", { locale: es })}${selectedSlot ? ` · ${selectedSlot}` : ""}`
                                    : null
                            },
                        ].map(({ label, value }) => (
                            <div key={label}>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">{label}</p>
                                <p className={`text-sm font-bold mt-0.5 ${value ? "text-gray-900" : "text-gray-300"}`}>
                                    {value ?? "—"}
                                </p>
                            </div>
                        ))}

                        {!selectedPatient && (
                            <div className="bg-lime-50/50 border border-lime-200/50 text-lime-700 p-3 rounded-2xl text-xs leading-relaxed font-medium">
                                Selecciona un paciente para comenzar.
                            </div>
                        )}

                        {selectedSlot && (
                            <div className="bg-lime-50/60 border border-lime-300/40 text-lime-700 p-4 rounded-2xl text-xs font-bold text-center">
                                ✓ Listo para confirmar
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
