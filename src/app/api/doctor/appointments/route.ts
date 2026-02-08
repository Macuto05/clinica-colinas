
import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma/client";

// Force Rebuild: 2026-01-31T21:20:00
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("userId"); // Ideally gets from session/token
        const date = searchParams.get("date") || new Date().toISOString().split('T')[0];

        if (!userId || userId === 'undefined' || userId === 'null') {
            console.error("[DoctorAPI] Invalid Request: Missing userId");
            return NextResponse.json({ error: "Usuario no identificado" }, { status: 401 });
        }

        try {
            BigInt(userId);
        } catch (e) {
            console.error(`[DoctorAPI] Invalid userId format: ${userId}`);
            return NextResponse.json({ error: "ID de usuario inválido" }, { status: 400 });
        }

        // 1. Get Doctor ID from User ID
        const doctor = await prisma.medico.findFirst({
            where: {
                empleado: {
                    usuarioId: BigInt(userId)
                }
            }
        });

        if (!doctor) {
            return NextResponse.json({ error: "No se encontró perfil médico asociado" }, { status: 403 });
        }

        // 2. Fetch Appointments
        // 2. Fetch Appointments
        // Calculate start and end of day to handle timezones robustly
        const queryDate = new Date(date);
        const startOfDay = new Date(queryDate);
        startOfDay.setUTCHours(0, 0, 0, 0);

        const endOfDay = new Date(queryDate);
        endOfDay.setUTCHours(23, 59, 59, 999);

        const appointments = await prisma.citaMedica.findMany({
            where: {
                medicoId: doctor.empleadoId,
                fechaCita: {
                    gte: startOfDay,
                    lte: endOfDay
                },
                estadoCita: 'CONFIRMADA' // Strict: Doctor only sees confirmed patients
            },
            include: {
                paciente: true,
                diagnostico: true,
                receta: {
                    include: { detalles: true }
                }
            },
            orderBy: {
                horaInicio: 'asc'
            }
        });

        console.log(`[DoctorAPI] Query Date: ${date} (${startOfDay.toISOString()} - ${endOfDay.toISOString()})`);
        console.log(`[DoctorAPI] Found ${appointments.length} appointments with buffer.`);

        // 3. Format Response
        const formatted = appointments.map(app => ({
            id: app.citaId.toString(),
            paciente: {
                id: app.paciente.pacienteId.toString(),
                nombre: `${app.paciente.nombres} ${app.paciente.apellidos}`,
                documento: app.paciente.documentoIdentidad,
                edad: app.paciente.fechaNacimiento ? calculateAge(new Date(app.paciente.fechaNacimiento)) : 'N/A'
            },
            hora: (() => {
                const d = new Date(app.horaInicio);
                const hours = d.getUTCHours();
                const minutes = d.getUTCMinutes();
                const ampm = hours >= 12 ? 'PM' : 'AM';
                const formattedHour = hours % 12 || 12;
                return `${formattedHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${ampm}`;
            })(),
            motivo: app.motivoConsulta,
            estado: app.estadoCita,
            tipo: app.tipoCita,
            yaAtendida: !!app.diagnostico,
            diagnostico: app.diagnostico ? {
                ...app.diagnostico,
                diagnosticoId: app.diagnostico.diagnosticoId.toString(),
                citaId: app.diagnostico.citaId.toString(),
                usuarioId: app.diagnostico.usuarioId.toString(),
                // Date is already Date object, JSON handles it
            } : null,
            receta: app.receta ? {
                ...app.receta,
                recetaId: app.receta.recetaId.toString(),
                citaId: app.receta.citaId.toString(),
                detalles: app.receta.detalles.map(d => ({
                    ...d,
                    detalleId: d.detalleId.toString(),
                    recetaId: d.recetaId.toString()
                }))
            } : null
        }));

        return NextResponse.json(formatted);

    } catch (error) {
        console.error("Error fetching doctor appointments:", error);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}

function calculateAge(birthday: Date) { // age util
    const ageDifMs = Date.now() - birthday.getTime();
    const ageDate = new Date(ageDifMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
}
