/**
 * Use Case: Register User
 * 
 * Handles user registration.
 * Coordinates creation of Usuario + Profile (Paciente/Medico).
 */

import bcrypt from 'bcryptjs';
import { User, Role, UserStatus } from '@/domain/entities/User';
import { IUserRepository } from '@/domain/repositories/IUserRepository';
import { RegisterUserDTO } from '@/application/dto/RegisterUserDTO';
import prisma from '@/infrastructure/database/prisma/client'; // Direct Prisma usage for Transaction
import { PacienteEstado, EmpleadoEstadoLaboral } from '@prisma/client';

export class RegisterUser {
    constructor(private userRepository: IUserRepository) { }

    async execute(data: RegisterUserDTO): Promise<User> {
        // 1. Check if email exists
        const emailExists = await this.userRepository.emailExists(data.email);
        if (emailExists) throw new Error('Email already registered');

        // 1b. Check if ID Card exists
        if (data.idCard) {
            const idExists = await this.userRepository.idCardExists(data.idCard);
            if (idExists) throw new Error('Cédula ya registrada en el sistema');
        }

        // 1c. Check if Phone exists
        if (data.phone) {
            const phoneExists = await this.userRepository.phoneExists(data.phone);
            if (phoneExists) throw new Error('Teléfono ya registrado en el sistema');
        }

        // 1d. Check if Contact Email exists (if different from login email, though usually checked separately)
        if (data.contactEmail) {
            // Optional: check if contact email overlaps with login email of others? 
            // For now strictly check contact email usage.
            const contactEmailExists = await this.userRepository.contactEmailExists(data.contactEmail);
            if (contactEmailExists) throw new Error('Correo de contacto ya registrado');
        }

        // 2. Hash password
        const passwordHash = await bcrypt.hash(data.password, 10);

        // 3. Determine Role
        // We need to fetch Role ID from DB based on string. 
        // For this refactor, we assume a helper or look it up.
        // Or we rely on the DB seed IDs if they are static, but better to query.
        const roleName = data.role || 'PACIENTE';
        const role = await prisma.rol.findUnique({ where: { nombre: roleName } });
        if (!role) throw new Error(`Role ${roleName} not found`);

        // 4. Transactional Create
        // We use prisma transaction here because our Repository 'create' was too generic/complex to implement easily without splitting.
        const newUser = await prisma.$transaction(async (tx) => {
            // A. Create Usuario
            const usuario = await tx.usuario.create({
                data: {
                    email: data.email,
                    passwordHash: passwordHash,
                    rolId: role.rolId,
                    estado: 'ACTIVO'
                }
            });

            // B. Create Profile
            if (roleName === 'PACIENTE') {
                await tx.paciente.create({
                    data: {
                        usuarioId: usuario.usuarioId,
                        nombres: data.firstName,
                        apellidos: data.lastName,
                        documentoIdentidad: data.idCard,
                        telefono: data.phone,
                        direccion: data.address,
                        fechaNacimiento: data.birthDate,
                        sexo: data.sex,
                        correo: data.contactEmail,
                        estado: PacienteEstado.ACTIVO
                    }
                });
            } else if (['MEDICO', 'ENFERMERIA', 'ADMIN', 'RECEPCION'].includes(roleName)) {
                const empleado = await tx.empleado.create({
                    data: {
                        usuarioId: usuario.usuarioId,
                        nombres: data.firstName,
                        apellidos: data.lastName,
                        documentoIdentidad: data.idCard,
                        telefono: data.phone,
                        // direccion: Not in Empleado schema
                        estadoLaboral: EmpleadoEstadoLaboral.ACTIVO
                    }
                });

                // C. Special logic for Medico
                if (roleName === 'MEDICO') {
                    if (!data.specialty) throw new Error('Specialty required for Doctors');

                    const specialty = await tx.especialidad.findFirst({
                        where: { nombre: data.specialty }
                    });
                    
                    if (!specialty) {
                        throw new Error(`Specialty '${data.specialty}' not found`);
                    }

                    await tx.medico.create({
                        data: {
                            empleadoId: empleado.empleadoId,
                            especialidadId: specialty.especialidadId,
                            numeroColegiatura: data.collegiateNumber,
                            activo: true
                        }
                    });
                }
            }

            return usuario;
        });

        // 5. Return Domain Entity
        // We can just fetch it again to get full enriched object
        const finalUser = await this.userRepository.findById(Number(newUser.usuarioId));
        if (!finalUser) throw new Error('User created but not found');
        return finalUser;
    }
}
