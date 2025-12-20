"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { createAppointment } from "@/app/actions/appointments";

interface Schedule {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
}

interface Doctor {
    id: number;
    name: string;
    specialty: string;
    schedule: Schedule[];
}

interface User {
    id: number;
    name: string;
    email: string;
}

export default function AppointmentForm({ doctor, user }: { doctor: Doctor; user: User }) {
    const router = useRouter();
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [reason, setReason] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    // Simple validation and submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            if (!date || !time) {
                throw new Error("Por favor selecciona fecha y hora");
            }

            const result = await createAppointment({
                doctorId: doctor.id,
                patientId: user.id,
                date: new Date(date),
                time,
                reason
            });

            if (result.success) {
                setSuccess(true);
                // Redirect after brief delay
                setTimeout(() => {
                    router.push("/dashboard/citas");
                }, 2000);
            } else {
                setError(result.error || "Error al agendar la cita");
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="text-center py-12">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">¡Cita Agendada!</h3>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                    Su cita con el {doctor.name} ha sido confirmada.
                </p>
                <div className="mt-6">
                    <button
                        onClick={() => router.push("/dashboard/citas")}
                        className="rounded-full bg-lime-600 px-6 py-2 text-white hover:bg-lime-700"
                    >
                        Ver mis citas
                    </button>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Especialista
                </label>
                <div className="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-500 sm:text-sm dark:border-gray-700 dark:bg-zinc-900">
                    {doctor.name} - {doctor.specialty}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                    <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Fecha
                    </label>
                    <input
                        type="date"
                        id="date"
                        required
                        min={new Date().toISOString().split('T')[0]}
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-lime-500 focus:outline-none focus:ring-lime-500 sm:text-sm dark:border-gray-700 dark:bg-zinc-900 dark:text-white"
                    />
                </div>

                <div>
                    <label htmlFor="time" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Hora
                    </label>
                    <input
                        type="time"
                        id="time"
                        required
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-lime-500 focus:outline-none focus:ring-lime-500 sm:text-sm dark:border-gray-700 dark:bg-zinc-900 dark:text-white"
                    />
                </div>
            </div>

            <div>
                <label htmlFor="reason" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Motivo de la consulta
                </label>
                <textarea
                    id="reason"
                    rows={3}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-lime-500 focus:outline-none focus:ring-lime-500 sm:text-sm dark:border-gray-700 dark:bg-zinc-900 dark:text-white"
                    placeholder="Breve descripción de sus síntomas o motivo de visita..."
                />
            </div>

            {error && (
                <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">{error}</h3>
                        </div>
                    </div>
                </div>
            )}

            <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center rounded-full bg-lime-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-lime-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
                {loading ? "Agendando..." : "Confirmar Cita"}
            </button>
        </form>
    );
}
