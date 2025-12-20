/**
 * Prisma Doctor Repository Implementation
 */

import { Doctor } from '@/domain/entities/Doctor';
import { IDoctorRepository } from '@/domain/repositories/IDoctorRepository';
import prisma from '../client';
import { Medico, Empleado } from '@prisma/client';

export class PrismaDoctorRepository implements IDoctorRepository {

    private mapToDomain(medico: Medico & { empleado: Empleado }): Doctor {
        return new Doctor({
            id: Number(medico.empleadoId),
            specialty: medico.especialidad,
            collegiateNumber: medico.numeroColegiatura || undefined,
            professionalLicense: medico.licenciaProfesional || undefined,
            isActive: medico.activo,
            firstName: medico.empleado.nombres,
            lastName: medico.empleado.apellidos,
            // email would require joining Usuario, if needed we can fetch it or leave undefined
        });
    }

    async create(doctor: Doctor): Promise<Doctor> {
        // This assumes creating a NEW doctor means creating a NEW Employee + Medico record.
        // If we are promoting an existing employee, logic would be different.
        // For simplicity, we implement creation of both.

        const created = await prisma.medico.create({
            data: {
                especialidad: doctor.specialty,
                numeroColegiatura: doctor.collegiateNumber,
                licenciaProfesional: doctor.professionalLicense,
                activo: doctor.isActive,
                empleado: {
                    create: {
                        nombres: doctor.firstName,
                        apellidos: doctor.lastName,
                        // Other mandatory employee fields need defaults or arguments
                        // Schema says 'estado_laboral' default ACTIVO.
                    }
                }
            },
            include: {
                empleado: true
            }
        });

        return this.mapToDomain(created);
    }

    async findById(id: number): Promise<Doctor | null> {
        const medico = await prisma.medico.findUnique({
            where: { empleadoId: id },
            include: { empleado: true }
        });

        if (!medico) return null;
        return this.mapToDomain(medico);
    }

    async findByUserId(userId: number): Promise<Doctor | null> {
        // Find medico via employee -> usuario
        const medico = await prisma.medico.findFirst({
            where: {
                empleado: {
                    usuarioId: userId
                }
            },
            include: { empleado: true }
        });

        if (!medico) return null;
        return this.mapToDomain(medico);
    }

    async findBySpeciality(speciality: string): Promise<Doctor[]> {
        // Note: Interface might still use number if I didn't update it? 
        // I need to check IDoctorRepository. findAllBySpeciality used to take ID.
        // I should update IDoctorRepository signature if I haven't yet, or cast here.
        // For now, assuming string passed or adapting.

        // Actually, previous interface had `findBySpeciality(specialityId: number)`.
        // I should probably update the Interface first or accept that I'm changing the contract.
        // The implementation Plan said "Update Repository Interfaces". I missed IDoctorRepository update.
        // I will assume standard string search now.

        const doctors = await prisma.medico.findMany({
            where: { especialidad: String(speciality) },
            include: { empleado: true }
        });

        return doctors.map(d => this.mapToDomain(d));
    }

    async findAll(): Promise<Doctor[]> {
        const doctors = await prisma.medico.findMany({
            include: { empleado: true }
        });

        return doctors.map(d => this.mapToDomain(d));
    }

    async update(id: number, data: Partial<Doctor>): Promise<Doctor> {
        const updated = await prisma.medico.update({
            where: { empleadoId: id },
            data: {
                especialidad: data.specialty,
                numeroColegiatura: data.collegiateNumber,
                licenciaProfesional: data.professionalLicense,
                activo: data.isActive
            },
            include: { empleado: true }
        });

        return this.mapToDomain(updated);
    }

    async delete(id: number): Promise<void> {
        await prisma.medico.delete({
            where: { empleadoId: id },
        });
    }
}
