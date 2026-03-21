/**
 * Prisma Doctor Repository Implementation
 */

import { Doctor } from '@/domain/entities/Doctor';
import { IDoctorRepository } from '@/domain/repositories/IDoctorRepository';
import prisma from '../client';
import { Medico, Empleado } from '@prisma/client';

export class PrismaDoctorRepository implements IDoctorRepository {

    private mapToDomain(medico: Medico & { empleado: Empleado; especialidad: { nombre: string } }): Doctor {
        return new Doctor({
            id: Number(medico.empleadoId),
            specialty: medico.especialidad.nombre,
            collegiateNumber: medico.numeroColegiatura || undefined,
            professionalLicense: medico.licenciaProfesional || undefined,
            isActive: medico.activo,
            firstName: medico.empleado.nombres,
            lastName: medico.empleado.apellidos,
        });
    }

    async create(doctor: Doctor): Promise<Doctor> {
        // Find specialty first to get its ID (assuming name passed)
        // Or specific logic. Simplified:
        const specialtyRecord = await prisma.especialidad.findUnique({
            where: { nombre: doctor.specialty }
        });
        if (!specialtyRecord) throw new Error("Specialty not found");

        const createdEmpleado = await prisma.empleado.create({
            data: {
                nombres: doctor.firstName,
                apellidos: doctor.lastName,
                medico: {
                    create: {
                        especialidadId: specialtyRecord.especialidadId,
                        numeroColegiatura: doctor.collegiateNumber,
                        licenciaProfesional: doctor.professionalLicense,
                        activo: doctor.isActive,
                    }
                }
            },
            include: {
                medico: {
                    include: {
                        especialidad: true
                    }
                }
            }
        });

        if (!createdEmpleado.medico) {
            throw new Error("Error creating doctor relation");
        }

        const fullMedico = {
            ...createdEmpleado.medico,
            empleado: createdEmpleado,
            especialidad: createdEmpleado.medico.especialidad
        };

        return this.mapToDomain(fullMedico as any);
    }

    async findById(id: number): Promise<Doctor | null> {
        const medico = await prisma.medico.findUnique({
            where: { empleadoId: id },
            include: { empleado: true, especialidad: true }
        });

        if (!medico) return null;
        return this.mapToDomain(medico);
    }

    async findByUserId(userId: number): Promise<Doctor | null> {
        const medico = await prisma.medico.findFirst({
            where: {
                empleado: {
                    usuarioId: userId
                }
            },
            include: { empleado: true, especialidad: true }
        });

        if (!medico) return null;
        return this.mapToDomain(medico);
    }

    async findBySpeciality(specialityId: number | string): Promise<Doctor[]> {
        const doctors = await prisma.medico.findMany({
            where: {
                especialidadId: BigInt(specialityId),
                activo: true
            },
            include: { empleado: true, especialidad: true }
        });

        return doctors.map(d => this.mapToDomain(d));
    }

    async findAll(): Promise<Doctor[]> {
        const doctors = await prisma.medico.findMany({
            where: { activo: true }, // Also filter all active here as per request "Show active doctors"
            include: { empleado: true, especialidad: true }
        });

        return doctors.map(d => this.mapToDomain(d));
    }

    async update(id: number, data: Partial<Doctor>): Promise<Doctor> {
        // Handle specialty update if needed (requires lookup)
        let specialtyIdUpdate = undefined;
        if (data.specialty) {
            const sp = await prisma.especialidad.findUnique({ where: { nombre: data.specialty } });
            if (sp) specialtyIdUpdate = sp.especialidadId;
        }

        const updated = await prisma.medico.update({
            where: { empleadoId: id },
            data: {
                especialidadId: specialtyIdUpdate,
                numeroColegiatura: data.collegiateNumber,
                licenciaProfesional: data.professionalLicense,
                activo: data.isActive
            },
            include: { empleado: true, especialidad: true }
        });

        return this.mapToDomain(updated);
    }

    async delete(id: number): Promise<void> {
        await prisma.medico.delete({
            where: { empleadoId: id },
        });
    }
}
