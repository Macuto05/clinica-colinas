
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import prisma from "@/infrastructure/database/prisma/client";

// Validation Schema for Update (Partial)
const updateDoctorSchema = z.object({
    nombres: z.string().min(2, "El nombre es requerido"),
    apellidos: z.string().min(2, "El apellido es requerido"),
    documentoIdentidad: z.string().min(5, "Documento de identidad requerido"),
    telefono: z.string().optional(),
    especialidad: z.string().min(1, "Especialidad requerida"),
    licenciaProfesional: z.string().optional(),
    numeroColegiatura: z.string().optional(),
    fechaIngreso: z.string().optional(),
    email: z.string().email("Email inválido"),
    password: z.string().optional(), // Optional for update
    activo: z.boolean().optional(),
    estadoLaboral: z.string().optional(), // EmpleadoEstadoLaboral
    usuarioEstado: z.string().optional(), // UsuarioEstado
});

export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ id: string }> } // Use Promise for params
) {
    // Await the params
    const resolvedParams = await context.params;
    const medId = resolvedParams.id; // This is actually the medico's empleadoId!

    try {
        const body = await request.json();

        // 1. Validate Input
        const validationResult = updateDoctorSchema.safeParse(body);
        if (!validationResult.success) {
            return NextResponse.json(
                { error: validationResult.error.issues[0].message },
                { status: 400 }
            );
        }

        const data = validationResult.data;
        const empleadoIdBigInt = BigInt(medId);

        // 2. Transaction
        const result = await prisma.$transaction(async (tx) => {
            // Get current doctor to find linked user
            const currentDoctor = await tx.medico.findUnique({
                where: { empleadoId: empleadoIdBigInt },
                include: { empleado: true }
            });

            if (!currentDoctor) {
                throw new Error("Médico no encontrado");
            }

            const usuarioId = currentDoctor.empleado.usuarioId;

            // A. Update Usuario (Email, Password, Estado)
            if (usuarioId) {
                const userUpdateData: any = {
                    email: data.email,
                    estado: data.estado as any,
                };

                if (data.password && data.password.trim() !== '') {
                    userUpdateData.passwordHash = await bcrypt.hash(data.password, 10);
                }

                await tx.usuario.update({
                    where: { usuarioId: usuarioId },
                    data: userUpdateData
                });
            }

            // B. Update Empleado
            const ingresoDate = data.fechaIngreso ? new Date(data.fechaIngreso) : undefined;

            await tx.empleado.update({
                where: { empleadoId: empleadoIdBigInt },
                data: {
                    nombres: data.nombres,
                    apellidos: data.apellidos,
                    documentoIdentidad: data.documentoIdentidad,
                    telefono: data.telefono,
                    fechaIngreso: ingresoDate,
                    // estadoLaboral can be inferred or passed, sticking to basic fields for now
                }
            });

            // C. Update Medico
            const updatedMedico = await tx.medico.update({
                where: { empleadoId: empleadoIdBigInt },
                data: {
                    especialidadId: BigInt(data.especialidad),
                    licenciaProfesional: data.licenciaProfesional,
                    numeroColegiatura: data.numeroColegiatura,
                    activo: data.activo !== undefined ? data.activo : currentDoctor.activo
                }
            });

            return updatedMedico;
        });

        return NextResponse.json({
            success: true,
            doctor: {
                id: result.empleadoId.toString()
            }
        });

    } catch (error) {
        console.error("Error updating doctor:", error);
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
