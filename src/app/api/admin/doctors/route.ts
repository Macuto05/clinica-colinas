
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import prisma from "@/infrastructure/database/prisma/client";
import { Role, UserStatus } from "@/domain/entities/User"; // Or use Prisma Enums directly if preferred

// Validation Schema
const createDoctorSchema = z.object({
    nombres: z.string().min(2, "El nombre es requerido"),
    apellidos: z.string().min(2, "El apellido es requerido"),
    documentoIdentidad: z.string().min(5, "Documento de identidad requerido"),
    telefono: z.string().optional(),
    especialidad: z.string().min(1, "Especialidad requerida"),
    licenciaProfesional: z.string().optional(), // Can be optional or required per business rule
    numeroColegiatura: z.string().optional(),
    fechaIngreso: z.string().optional(), // Date string from frontend
    email: z.string().email("Email inválido"),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // 1. Validate Input
        const validationResult = createDoctorSchema.safeParse(body);
        if (!validationResult.success) {
            return NextResponse.json(
                { error: validationResult.error.issues[0].message },
                { status: 400 }
            );
        }

        const data = validationResult.data;

        // 2. Check if user already exists
        const existingUser = await prisma.usuario.findUnique({
            where: { email: data.email }
        });
        if (existingUser) {
            return NextResponse.json(
                { error: "El correo electrónico ya está registrado." },
                { status: 409 }
            );
        }

        // 3. Transaction
        // We need the Role ID for Medico/DOCTOR. Assuming we can look it up or known ID.
        // Best practice: look up role by name.
        const doctorRole = await prisma.rol.findUnique({ where: { nombre: 'MEDICO' } }); // Or 'DOCTOR' depending on seed

        // Fallback or Error if role doesn't exist? 
        // Let's assume 'MEDICO' based on seeds or 'DOCTOR' based on domain enum. 
        // Ideally we check what's in DB. For now let's try to find 'MEDICO' first, then 'DOCTOR'.

        let finalRoleId: bigint | undefined;

        if (doctorRole) {
            finalRoleId = doctorRole.rolId;
        } else {
            const alternativeRole = await prisma.rol.findUnique({ where: { nombre: 'DOCTOR' } });
            if (alternativeRole) finalRoleId = alternativeRole.rolId;
        }

        if (!finalRoleId) {
            return NextResponse.json({ error: "Rol de MÉDICO no configurado en el sistema." }, { status: 500 });
        }


        const hashedPassword = await bcrypt.hash(data.password, 10);
        const ingresoDate = data.fechaIngreso ? new Date(data.fechaIngreso) : new Date();

        const result = await prisma.$transaction(async (tx) => {
            // A. Create Usuario
            const newUser = await tx.usuario.create({
                data: {
                    email: data.email,
                    passwordHash: hashedPassword,
                    rolId: finalRoleId!,
                    estado: 'ACTIVO', // Prisma Enum
                }
            });

            // B. Create Empleado
            const newEmployee = await tx.empleado.create({
                data: {
                    usuarioId: newUser.usuarioId,
                    nombres: data.nombres,
                    apellidos: data.apellidos,
                    documentoIdentidad: data.documentoIdentidad,
                    telefono: data.telefono,
                    fechaIngreso: ingresoDate,
                    estadoLaboral: 'ACTIVO', // Prisma Enum
                    // correoInstitucional removed
                }
            });

            // C. Create Medico Profile
            const newDoctor = await tx.medico.create({
                data: {
                    empleadoId: newEmployee.empleadoId,
                    especialidadId: BigInt(data.especialidad),
                    licenciaProfesional: data.licenciaProfesional,
                    numeroColegiatura: data.numeroColegiatura,
                    activo: true
                }
            });

            return { newUser, newEmployee, newDoctor };
        });

        return NextResponse.json({
            success: true,
            doctor: {
                id: result.newEmployee.empleadoId.toString(),
                name: `${result.newEmployee.nombres} ${result.newEmployee.apellidos}`,
                email: result.newUser.email
            }
        });

    } catch (error) {
        console.error("Error creating doctor:", error);
        if (error instanceof Error) {
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            );
        }
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}
