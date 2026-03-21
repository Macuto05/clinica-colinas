/**
 * Prisma Appointment Repository Implementation
 */

import { Appointment, AppointmentStatus, AppointmentType, AppointmentOrigin } from '@/domain/entities/Appointment';
import { IAppointmentRepository } from '@/domain/repositories/IAppointmentRepository';
import prisma from '../client';
import { CitaEstado, CitaTipo, CitaOrigen } from '@prisma/client';

export class PrismaAppointmentRepository implements IAppointmentRepository {

    // Mapper Helper
    private mapToDomain(cita: any): Appointment {
        // Needs proper type casting or strict typing from Prisma Client generated types
        // Including relations: paciente, medico (empleado -> usuario)

        let patientName = undefined;
        let doctorName = undefined;

        if (cita.paciente) {
            patientName = `${cita.paciente.nombres} ${cita.paciente.apellidos}`;
        }

        if (cita.medico && cita.medico.empleado) {
            doctorName = `${cita.medico.empleado.nombres} ${cita.medico.empleado.apellidos}`;
        }

        // Map Enums
        // We assume 1:1 mapping of strings or strictly formatted 
        // Status
        let status = AppointmentStatus.PENDING;
        if (cita.estadoCita === CitaEstado.CONFIRMADA) status = AppointmentStatus.CONFIRMED;
        if (cita.estadoCita === CitaEstado.ATENDIDA) status = AppointmentStatus.ATTENDED;
        if (cita.estadoCita === CitaEstado.CANCELADA) status = AppointmentStatus.CANCELLED;
        if (cita.estadoCita === CitaEstado.NO_ASISTIO) status = AppointmentStatus.NO_SHOW;

        // Type
        let type = AppointmentType.CONSULTATION;
        if (cita.tipoCita === CitaTipo.CONTROL) type = AppointmentType.CONTROL;
        if (cita.tipoCita === CitaTipo.ESPECIALIDAD) type = AppointmentType.SPECIALTY;
        if (cita.tipoCita === CitaTipo.OTRA) type = AppointmentType.OTHER;

        // Origin
        let origin = AppointmentOrigin.WEB;
        if (cita.origenCita === CitaOrigen.RECEPCION) origin = AppointmentOrigin.RECEPTION;

        // Date & Time
        // Prisma stores Time as DateTime (usually 1970-01-01 + time)
        // We convert to HH:MM string for Domain
        const formatTime = (date: Date) => {
            const h = date.getUTCHours().toString().padStart(2, '0');
            const m = date.getUTCMinutes().toString().padStart(2, '0');
            return `${h}:${m}`;
        };

        return new Appointment({
            id: Number(cita.citaId),
            patientId: Number(cita.pacienteId),
            doctorId: Number(cita.medicoId),
            date: cita.fechaCita,
            startTime: formatTime(cita.horaInicio),
            endTime: formatTime(cita.horaFin),
            reason: cita.motivoConsulta || undefined,
            notes: cita.observaciones || undefined,
            status,
            type,
            origin,
            createdAt: cita.fechaCreacion,
            createdBy: Number(cita.usuarioCreacion),
            patientName,
            doctorName
        });
    }

    async create(appointment: Appointment): Promise<Appointment> {
        // Reverse Map Enums
        let estadoCita: CitaEstado = CitaEstado.PROGRAMADA;
        if (appointment.status === AppointmentStatus.CONFIRMED) estadoCita = CitaEstado.CONFIRMADA;

        // Helper to Create DateTime from Time String (dummy date)
        const toDateTime = (timeStr: string) => {
            const [h, m] = timeStr.split(':').map(Number);
            const d = new Date();
            d.setUTCHours(h, m, 0, 0);
            return d;
        };

        // 1. Fetch Consultation Price (Config)
        let precioConsulta = 50.00; // Fallback default
        try {
            const config = await prisma.configuracion.findUnique({ where: { clave: 'PRECIO_CONSULTA' } });
            if (config) {
                precioConsulta = parseFloat(config.valor);
            } else {
                // Auto-initialize if missing (Self-Healing)
                await prisma.configuracion.create({
                    data: { clave: 'PRECIO_CONSULTA', valor: '50.00', descripcion: 'Precio base de la consulta médica en USD' }
                });
            }
        } catch (e) {
            console.error('Error fetching billing config, using default 50.00', e);
        }

        const created = await prisma.citaMedica.create({
            data: {
                pacienteId: appointment.patientId,
                medicoId: appointment.doctorId,
                fechaCita: appointment.date,
                horaInicio: toDateTime(appointment.startTime),
                horaFin: toDateTime(appointment.endTime),
                motivoConsulta: appointment.reason,
                estadoCita: estadoCita,
                tipoCita: CitaTipo.CONSULTA,
                usuarioCreacion: 1,
                // Automatic Invoice Creation
                factura: {
                    create: {
                        usuarioEmision: 1, // Default Issuer (System/Admin)
                        total: precioConsulta,
                        saldoPendiente: precioConsulta,
                        estadoFactura: 'PENDIENTE',
                        detalles: {
                            create: {
                                tipoItem: 'SERVICIO',
                                descripcion: 'Consulta Médica General',
                                cantidad: 1,
                                precioUnitario: precioConsulta,
                                importe: precioConsulta
                            }
                        }
                    }
                }
            },
            include: {
                paciente: true,
                medico: { include: { empleado: true } }
            }
        });

        return this.mapToDomain(created);
    }

    async findById(id: number): Promise<Appointment | null> {
        const cita = await prisma.citaMedica.findUnique({
            where: { citaId: id },
            include: {
                paciente: true,
                medico: { include: { empleado: true } }
            }
        });

        if (!cita) return null;
        return this.mapToDomain(cita);
    }

    async findByPatientId(patientId: number): Promise<Appointment[]> {
        const citas = await prisma.citaMedica.findMany({
            where: { pacienteId: patientId },
            include: {
                paciente: true,
                medico: { include: { empleado: true } }
            },
            orderBy: { fechaCita: 'desc' },
        });

        return citas.map(c => this.mapToDomain(c));
    }

    async findByDoctorId(doctorId: number): Promise<Appointment[]> {
        const citas = await prisma.citaMedica.findMany({
            where: { medicoId: doctorId },
            include: {
                paciente: true,
                medico: { include: { empleado: true } }
            },
            orderBy: { fechaCita: 'desc' },
        });

        return citas.map(c => this.mapToDomain(c));
    }

    async findByDateRange(startDate: Date, endDate: Date): Promise<Appointment[]> {
        const citas = await prisma.citaMedica.findMany({
            where: {
                fechaCita: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            include: {
                paciente: true,
                medico: { include: { empleado: true } }
            },
            orderBy: { fechaCita: 'asc' },
        });

        return citas.map(c => this.mapToDomain(c));
    }

    async findByDoctorAndDate(doctorId: number, date: Date): Promise<Appointment[]> {
        const citas = await prisma.citaMedica.findMany({
            where: {
                medicoId: doctorId,
                fechaCita: date, // Exact date match as it's a Date type in DB
            },
            include: {
                paciente: true,
                medico: { include: { empleado: true } }
            },
            orderBy: { horaInicio: 'asc' },
        });

        return citas.map(c => this.mapToDomain(c));
    }

    async update(id: number, data: Partial<Appointment>): Promise<Appointment> {
        const updateData: any = {};
        if (data.status) {
            if (data.status === AppointmentStatus.CONFIRMED) updateData.estadoCita = CitaEstado.CONFIRMADA;
            else if (data.status === AppointmentStatus.CANCELLED) updateData.estadoCita = CitaEstado.CANCELADA;
            else if (data.status === AppointmentStatus.ATTENDED) updateData.estadoCita = CitaEstado.ATENDIDA;
        }
        if (data.reason) updateData.motivoConsulta = data.reason;

        const updated = await prisma.citaMedica.update({
            where: { citaId: id },
            data: updateData,
            include: {
                paciente: true,
                medico: { include: { empleado: true } }
            }
        });

        return this.mapToDomain(updated);
    }

    async delete(id: number): Promise<void> {
        await prisma.citaMedica.delete({
            where: { citaId: id },
        });
    }

    async isTimeSlotAvailable(doctorId: number, date: Date, startTime: string, endTime: string): Promise<boolean> {
        // Complex overlap check
        // We need to convert string HH:MM to comparable time
        // However, Prisma/Postgres queries might require raw SQL or careful comparison if TIME type

        // Simple overlap logic:
        // (StartA <= EndB) and (EndA >= StartB)
        // Since we store Time as DateTime in Prisma (usually), we might need date parts.

        // For now, let's fetch appointments for that doctor on that date and check in-memory
        const appointments = await this.findByDoctorAndDate(doctorId, date);

        // Convert check times to minutes from midnight
        const toMins = (t: string) => {
            const [h, m] = t.split(':').map(Number);
            return h * 60 + m;
        };

        const startMins = toMins(startTime);
        const endMins = toMins(endTime);

        for (const apt of appointments) {
            const aptStart = toMins(apt.startTime);
            const aptEnd = toMins(apt.endTime);

            // Allow adjacent? Usually no.
            // If strictly overlapping:
            if (Math.max(startMins, aptStart) < Math.min(endMins, aptEnd)) {
                return false;
            }
        }

        return true;
    }

    async findAllWithDetails(): Promise<Appointment[]> {
        const citas = await prisma.citaMedica.findMany({
            include: {
                paciente: true,
                medico: { include: { empleado: true } }
            },
            orderBy: { fechaCita: 'desc' }
        });

        return citas.map(c => this.mapToDomain(c));
    }
}
