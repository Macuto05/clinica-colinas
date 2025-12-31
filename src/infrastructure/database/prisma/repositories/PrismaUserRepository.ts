/**
 * Prisma User Repository Implementation
 * 
 * Implements IUserRepository using Prisma ORM.
 * Adapts the Domain 'User' entity to the Database 'usuario', 'empleado', 'paciente' tables.
 */

import { User, Role, UserStatus } from '@/domain/entities/User';
import { IUserRepository } from '@/domain/repositories/IUserRepository';
import prisma from '../client';
import { Usuario, Empleado, Paciente, Rol } from '@prisma/client';

export class PrismaUserRepository implements IUserRepository {

    // --- Mapper Helper ---
    private mapToDomain(usuario: Usuario & {
        rol: Rol,
        empleado?: Empleado | null,
        paciente?: Paciente | null
    }): User {
        let firstName = undefined;
        let lastName = undefined;
        let documentId = undefined;
        let phone = undefined;
        let address = undefined;
        let speciality = undefined;
        let birthDate = undefined;

        let employeeId = undefined;
        let patientId = undefined;

        // Map String Role from DB to Enum
        const role = usuario.rol.nombre;

        if (usuario.empleado) {
            firstName = usuario.empleado.nombres;
            lastName = usuario.empleado.apellidos;
            documentId = usuario.empleado.documentoIdentidad || undefined;
            phone = usuario.empleado.telefono || undefined;
            employeeId = Number(usuario.empleado.empleadoId);
            // email is on usuario
        } else if (usuario.paciente) {
            firstName = usuario.paciente.nombres;
            lastName = usuario.paciente.apellidos;
            documentId = usuario.paciente.documentoIdentidad || undefined;
            phone = usuario.paciente.telefono || undefined;
            address = usuario.paciente.direccion || undefined;
            birthDate = usuario.paciente.fechaNacimiento || undefined;
            patientId = Number(usuario.paciente.pacienteId);
            // new fields
            const paciente = usuario.paciente; // helper
            // We need to cast or ensure types if not inferred correctly but Prisma types should handle it
            // Assuming UserProps has sex/contactEmail added
            // @ts-ignore - dynamic property access if not fully typed in local strict check
            const sex = paciente.sexo || undefined;
            const contactEmail = paciente.correo || undefined;

            return new User({
                id: Number(usuario.usuarioId),
                email: usuario.email,
                passwordHash: usuario.passwordHash,
                role: role,
                status: usuario.estado as UserStatus,
                createdAt: usuario.fechaCreacion,
                lastAccess: usuario.ultimoAcceso,
                firstName,
                lastName,
                documentId,
                phone,
                address,
                speciality,
                birthDate,
                patientId,
                employeeId,
                sex,
                contactEmail
            });
        }

        return new User({
            id: Number(usuario.usuarioId),
            email: usuario.email,
            passwordHash: usuario.passwordHash,
            role: role,
            status: usuario.estado as UserStatus,
            createdAt: usuario.fechaCreacion,
            lastAccess: usuario.ultimoAcceso,
            firstName,
            lastName,
            documentId,
            phone,
            address,
            speciality,
            birthDate,
            patientId,
            employeeId
        });
    }

    async create(user: User): Promise<User> {
        // Creation logic is complex because it splits into Usuario + Empleado/Paciente
        // For simplicity in this refactor, we assume the Service Layer handles the transactional creation
        // or we implement a basic internal creation if 'user' entity has enough info.
        // HOWEVER, the IUserRepository.create contract usually expects to save a Domain User.
        // Given the DB structure, creating a User usually requires knowing if it's Employee or Patient.

        throw new Error("Method not implemented. User creation should be handled by specific services (RegisterPatient, RegisterEmployee) due to multi-table complexity.");
    }

    async findById(id: number): Promise<User | null> {
        const usuario = await prisma.usuario.findUnique({
            where: { usuarioId: id },
            include: {
                rol: true,
                empleado: true,
                paciente: true
            }
        });

        if (!usuario) return null;
        return this.mapToDomain(usuario);
    }

    async findByEmail(email: string): Promise<User | null> {
        const usuario = await prisma.usuario.findUnique({
            where: { email },
            include: {
                rol: true,
                empleado: true,
                paciente: true
            }
        });

        if (!usuario) return null;
        return this.mapToDomain(usuario);
    }

    async update(id: number, data: Partial<User>): Promise<User> {
        // Basic update for Usuario fields. 
        // Complex updates (Profile data) should ideally be separate or handled carefully.
        const updated = await prisma.usuario.update({
            where: { usuarioId: id },
            data: {
                email: data.email,
                // Updating password or status if provided in 'data' properties that match
            },
            include: {
                rol: true,
                empleado: true,
                paciente: true
            }
        });

        return this.mapToDomain(updated);
    }

    async delete(id: number): Promise<void> {
        await prisma.usuario.delete({
            where: { usuarioId: id },
        });
    }

    async findAll(role?: string): Promise<User[]> {
        const whereClause = role ? { rol: { nombre: role } } : undefined;

        const users = await prisma.usuario.findMany({
            where: whereClause,
            include: {
                rol: true,
                empleado: true,
                paciente: true
            }
        });

        return users.map(u => this.mapToDomain(u));
    }

    async emailExists(email: string): Promise<boolean> {
        const count = await prisma.usuario.count({
            where: { email },
        });
        return count > 0;
    }

    async idCardExists(idCard: string): Promise<boolean> {
        const patientCount = await prisma.paciente.count({
            where: { documentoIdentidad: idCard }
        });
        if (patientCount > 0) return true;

        const employeeCount = await prisma.empleado.count({
            where: { documentoIdentidad: idCard }
        });
        return employeeCount > 0;
    }

    async phoneExists(phone: string): Promise<boolean> {
        const patientCount = await prisma.paciente.count({
            where: { telefono: phone }
        });
        if (patientCount > 0) return true;

        const employeeCount = await prisma.empleado.count({
            where: { telefono: phone }
        });
        return employeeCount > 0;
    }

    async contactEmailExists(email: string): Promise<boolean> {
        const patientCount = await prisma.paciente.count({
            where: { correo: email }
        });
        return patientCount > 0;
    }
}
