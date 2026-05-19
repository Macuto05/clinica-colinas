import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/infrastructure/database/prisma/client";
import { startOfDay, endOfDay, parseISO } from "date-fns";
import { JWTService } from "@/infrastructure/services/JWTService";

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
                },
                tipoCita: { not: 'EMERGENCIA' }
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

export async function POST(req: NextRequest) {
    try {
        const token = req.cookies.get("auth-token")?.value;
        if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        const payload = await JWTService.verifyToken(token);
        if (!payload) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

        const body = await req.json();
        const { pacienteId, medicoId, fechaCita, horaInicio, horaFin, motivoConsulta } = body;

        if (!pacienteId || !medicoId || !fechaCita || !horaInicio) {
            return NextResponse.json({ error: "Campos requeridos faltantes" }, { status: 400 });
        }

        // Parse date and time
        const cita_date = new Date(fechaCita);
        const [hours, minutes] = horaInicio.split(':').map(Number);
        const hora_inicio = new Date(cita_date);
        hora_inicio.setHours(hours, minutes, 0, 0);

        // Default end time (1 hour later)
        const hora_fin = horaFin
            ? (() => {
                const [h, m] = horaFin.split(':').map(Number);
                const end = new Date(cita_date);
                end.setHours(h, m, 0, 0);
                return end;
            })()
            : new Date(hora_inicio.getTime() + 60 * 60 * 1000);

        // Create the appointment
        const cita = await prisma.citaMedica.create({
            data: {
                pacienteId: BigInt(pacienteId),
                medicoId: BigInt(medicoId),
                fechaCita: cita_date,
                horaInicio: hora_inicio,
                horaFin: hora_fin,
                motivoConsulta: motivoConsulta || null,
                estadoCita: 'PROGRAMADA',
                tipoCita: 'CONSULTA',
                origenCita: 'RECEPCION',
                usuarioCreacion: BigInt((payload as any).userId),
            },
            include: {
                paciente: { select: { nombres: true, apellidos: true } },
                medico: {
                    include: {
                        empleado: { select: { nombres: true, apellidos: true } }
                    }
                }
            }
        });

        return NextResponse.json({
            id: cita.citaId.toString(),
            patientName: `${cita.paciente.nombres} ${cita.paciente.apellidos}`,
            doctorName: `${cita.medico.empleado.nombres} ${cita.medico.empleado.apellidos}`,
            date: cita.fechaCita.toISOString(),
            startTime: cita.horaInicio.toISOString(),
            status: cita.estadoCita,
        }, { status: 201 });
    } catch (error: any) {
        console.error("Error creating appointment:", error);
        if (error.code === 'P2002') {
            return NextResponse.json({ error: "Ya existe una cita en este horario para el médico" }, { status: 409 });
        }
        return NextResponse.json({ error: "Error al crear la cita" }, { status: 500 });
    }
}
