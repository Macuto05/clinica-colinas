import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma/client";
import { startOfDay, endOfDay, parseISO } from "date-fns";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const dateStr = searchParams.get("date");

        if (!dateStr) {
            return NextResponse.json({ error: "Fecha requerida" }, { status: 400 });
        }

        // Fix UTC Date Filtering:
        // We want to match the date provided (YYYY-MM-DD).
        // Since database uses @db.Date, we can try to match the date range in UTC.
        // We will create a UTC date for the start of the requested day.
        const start = new Date(dateStr);
        start.setUTCHours(0, 0, 0, 0);

        const end = new Date(dateStr);
        end.setUTCHours(23, 59, 59, 999);

        const appointments = await prisma.citaMedica.findMany({
            where: {
                fechaCita: {
                    gte: start,
                    lte: end
                }
            },
            include: {
                paciente: {
                    select: {
                        nombres: true,
                        apellidos: true,
                        documentoIdentidad: true,
                        telefono: true,
                        correo: true
                    }
                },
                medico: {
                    select: {
                        empleado: {
                            select: { nombres: true, apellidos: true }
                        },
                        especialidad: { select: { nombre: true } }
                    }
                },
                factura: {
                    select: {
                        estadoFactura: true,
                        saldoPendiente: true
                    }
                }
            },
            orderBy: {
                horaInicio: 'asc'
            }
        });

        // Format for Frontend
        // We format time manually to ensure it looks like "08:00" regardless of timezone
        const formatTime = (date: Date) => {
            if (!date) return "";
            return date.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'UTC' });
        };

        const formatted = appointments.map(apt => ({
            id: apt.citaId.toString(), // BigInt to String
            patientName: `${apt.paciente.nombres} ${apt.paciente.apellidos}`,
            patientDoc: apt.paciente.documentoIdentidad || 'S/I',
            patientPhone: apt.paciente.telefono || '',
            patientEmail: apt.paciente.correo || '',
            doctorName: `${apt.medico.empleado.nombres} ${apt.medico.empleado.apellidos}`,
            specialty: apt.medico.especialidad?.nombre || '',
            date: apt.fechaCita.toISOString(),
            startTime: formatTime(apt.horaInicio),
            endTime: formatTime(apt.horaFin),
            status: apt.estadoCita,
            reason: apt.motivoConsulta,
            type: apt.tipoCita,
            doctorId: apt.medicoId.toString(),
            isPaid: apt.factura ? (apt.factura.estadoFactura === 'PAGADA' || Number(apt.factura.saldoPendiente) <= 0) : false
        }));

        return NextResponse.json(formatted);
    } catch (error) {
        console.error("Error fetching reception agenda:", error);
        return NextResponse.json({ error: "Error al obtener agenda" }, { status: 500 });
    }
}
