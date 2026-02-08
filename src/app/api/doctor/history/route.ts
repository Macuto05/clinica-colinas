
import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma/client";
import { Prisma } from "@prisma/client";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("userId");
        const search = searchParams.get("search"); // Name or Document
        const date = searchParams.get("date"); // YYYY-MM-DD

        if (!userId || userId === 'undefined' || userId === 'null') {
            return NextResponse.json({ error: "Usuario no identificado" }, { status: 401 });
        }

        // 1. Get Doctor ID
        const doctor = await prisma.medico.findFirst({
            where: {
                empleado: {
                    usuarioId: BigInt(userId)
                }
            }
        });

        if (!doctor) {
            return NextResponse.json({ error: "Perfil médico no encontrado" }, { status: 403 });
        }

        // 2. Build Query Filters
        const whereClause: Prisma.CitaMedicaWhereInput = {
            medicoId: doctor.empleadoId,
            estadoCita: 'ATENDIDA', // Strict filter
        };

        // Filter by Date
        if (date) {
            const queryDate = new Date(date);
            const startOfDay = new Date(queryDate);
            startOfDay.setUTCHours(0, 0, 0, 0);

            const endOfDay = new Date(queryDate);
            endOfDay.setUTCHours(23, 59, 59, 999);

            whereClause.fechaCita = {
                gte: startOfDay,
                lte: endOfDay
            };
        }

        // Filter by Search (Name, Surname, Document)
        if (search) {
            whereClause.paciente = {
                OR: [
                    { nombres: { contains: search, mode: 'insensitive' } },
                    { apellidos: { contains: search, mode: 'insensitive' } },
                    { documentoIdentidad: { contains: search, mode: 'insensitive' } }
                ]
            };
        }

        // 3. Fetch Data
        const appointments = await prisma.citaMedica.findMany({
            where: whereClause,
            include: {
                paciente: true,
                diagnostico: true
            },
            orderBy: [
                { fechaCita: 'desc' },
                { horaInicio: 'desc' }
            ]
        });

        // 4. Format & Serialize
        const formatted = appointments.map(app => ({
            id: app.citaId.toString(),
            fecha: app.fechaCita.toISOString(),
            hora: (() => {
                const d = new Date(app.horaInicio);
                const hours = d.getUTCHours();
                const minutes = d.getUTCMinutes();
                const ampm = hours >= 12 ? 'PM' : 'AM';
                const formattedHour = hours % 12 || 12;
                return `${formattedHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${ampm}`;
            })(),
            paciente: {
                id: app.pacienteId.toString(),
                nombre: `${app.paciente.nombres} ${app.paciente.apellidos}`,
                documento: app.paciente.documentoIdentidad,
                edad: app.paciente.fechaNacimiento ? calculateAge(new Date(app.paciente.fechaNacimiento)) : 'N/A'
            },
            diagnostico: app.diagnostico ? app.diagnostico.descripcion : "Sin diagnóstico registrado"
        }));

        return NextResponse.json(formatted);

    } catch (error) {
        console.error("Error fetching history:", error);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}

function calculateAge(birthday: Date) {
    const ageDifMs = Date.now() - birthday.getTime();
    const ageDate = new Date(ageDifMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
}
