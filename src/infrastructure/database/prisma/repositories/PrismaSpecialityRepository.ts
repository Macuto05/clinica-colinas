/**
 * Prisma Speciality Repository Implementation
 */

import { Speciality } from '@/domain/entities/Speciality';
import { ISpecialityRepository } from '@/domain/repositories/ISpecialityRepository';
import prisma from '../client';

export class PrismaSpecialityRepository implements ISpecialityRepository {
    async create(speciality: Speciality): Promise<Speciality> {
        const created = await prisma.especialidad.create({
            data: {
                nombre: speciality.name,
                descripcion: speciality.description,
            },
        });

        return new Speciality({
            id: created.id,
            name: created.nombre,
            description: created.descripcion || undefined,
        });
    }

    async findById(id: number): Promise<Speciality | null> {
        const speciality = await prisma.especialidad.findUnique({
            where: { id },
        });

        if (!speciality) return null;

        return new Speciality({
            id: speciality.id,
            name: speciality.nombre,
            description: speciality.descripcion || undefined,
        });
    }

    async findByName(name: string): Promise<Speciality | null> {
        const speciality = await prisma.especialidad.findUnique({
            where: { nombre: name },
        });

        if (!speciality) return null;

        return new Speciality({
            id: speciality.id,
            name: speciality.nombre,
            description: speciality.descripcion || undefined,
        });
    }

    async findAll(): Promise<Speciality[]> {
        const specialities = await prisma.especialidad.findMany({
            orderBy: { nombre: 'asc' },
        });

        return specialities.map(
            (spec) =>
                new Speciality({
                    id: spec.id,
                    name: spec.nombre,
                    description: spec.descripcion || undefined,
                })
        );
    }

    async update(id: number, data: Partial<Speciality>): Promise<Speciality> {
        const updated = await prisma.especialidad.update({
            where: { id },
            data: {
                nombre: data.name,
                descripcion: data.description,
            },
        });

        return new Speciality({
            id: updated.id,
            name: updated.nombre,
            description: updated.descripcion || undefined,
        });
    }

    async delete(id: number): Promise<void> {
        await prisma.especialidad.delete({
            where: { id },
        });
    }
}
