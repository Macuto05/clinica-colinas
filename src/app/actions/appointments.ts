"use server";

import prisma from "@/infrastructure/database/prisma/client";
import { revalidatePath } from "next/cache";

export async function createAppointment(data: {
    doctorId: number;
    patientId: number;
    date: Date;
    time: string;
    reason?: string;
}) {
    try {
        // Basic validation
        if (!data.doctorId || !data.patientId || !data.date || !data.time) {
            return { success: false, error: "Faltan datos requeridos" };
        }

        // Calculate End Time (default 30 mins)
        const [hours, minutes] = data.time.split(':').map(Number);
        const startTime = new Date(data.date);
        startTime.setHours(hours, minutes, 0, 0); // Local time might be tricky with Dates in server actions, assuming UTC or consistent

        // Prisma expects DateTime for Time fields (1970-01-01 + time)
        const timeAsDate = new Date();
        timeAsDate.setUTCHours(hours, minutes, 0, 0);

        const endTimeAsDate = new Date(timeAsDate);
        endTimeAsDate.setUTCMinutes(minutes + 30);

        await prisma.citaMedica.create({
            data: {
                medicoId: BigInt(data.doctorId),
                pacienteId: BigInt(data.patientId),
                fechaCita: data.date,
                horaInicio: timeAsDate,
                horaFin: endTimeAsDate,
                motivoConsulta: data.reason,
                estadoCita: "PROGRAMADA",
                tipoCita: "CONSULTA",
                origenCita: "WEB",
                usuarioCreacion: BigInt(1) // Fallback as we don't have session user ID here easily without auth check
            }
        });

        revalidatePath("/dashboard/citas");
        return { success: true };
    } catch (error) {
        console.error("Error creating appointment:", error);
        return { success: false, error: "Error al crear la cita" };
    }
}
