import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import prisma from "@/infrastructure/database/prisma/client";

const updateDoctorSchema = z.object({
    nombres: z.string().min(2, "El nombre es requerido"),
    apellidos: z.string().min(2, "El apellido es requerido"),
    documentoIdentidad: z.string().min(5, "Documento de identidad requerido"),
    telefono: z.string().min(1, "Teléfono requerido"),
    especialidad: z.string().min(1, "Especialidad requerida"),
    correoInstitucional: z.string().email("Correo de contacto inválido"),
    licenciaProfesional: z.string().min(1, "Licencia profesional requerida"),
    numeroColegiatura: z.string().min(1, "Número de colegiatura requerido"),
    fechaIngreso: z.string().min(1, "Fecha de ingreso requerida"),
    email: z.string().email("Email de acceso inválido"),
    password: z.string().optional(),
    activo: z.boolean(),
    estadoLaboral: z.string().min(1, "Estado laboral requerido"),
    usuarioEstado: z.string().min(1, "Estado de usuario requerido"),
}).superRefine((data, ctx) => {
    if (data.password) {
        if (data.password.length < 8)
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "La contraseña debe tener al menos 8 caracteres", path: ["password"] });
        if (!/[A-Z]/.test(data.password))
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "La contraseña debe tener al menos una letra mayúscula", path: ["password"] });
        if (!/[0-9]/.test(data.password))
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "La contraseña debe tener al menos un número", path: ["password"] });
    }
});

export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const resolvedParams = await context.params;
    const medId = resolvedParams.id;

    try {
        const body = await request.json();

        const validationResult = updateDoctorSchema.safeParse(body);
        if (!validationResult.success) {
            return NextResponse.json(
                { error: validationResult.error.issues[0].message },
                { status: 400 }
            );
        }

        const data = validationResult.data;
        const empleadoIdBigInt = BigInt(medId);

        const result = await prisma.$transaction(async (tx) => {
            const currentDoctor = await tx.medico.findUnique({
                where: { empleadoId: empleadoIdBigInt },
                include: { empleado: true }
            });

            if (!currentDoctor) throw new Error("Médico no encontrado");

            const usuarioId = currentDoctor.empleado.usuarioId;

            if (usuarioId) {
                const userUpdateData: any = {
                    email: data.email,
                    estado: data.usuarioEstado as any,
                };
                if (data.password && data.password.trim() !== "") {
                    userUpdateData.passwordHash = await bcrypt.hash(data.password, 10);
                }
                await tx.usuario.update({ where: { usuarioId }, data: userUpdateData });
            }

            await tx.empleado.update({
                where: { empleadoId: empleadoIdBigInt },
                data: {
                    nombres: data.nombres,
                    apellidos: data.apellidos,
                    documentoIdentidad: data.documentoIdentidad,
                    telefono: data.telefono,
                    correoInstitucional: data.correoInstitucional,
                    fechaIngreso: new Date(data.fechaIngreso),
                    estadoLaboral: data.estadoLaboral as any,
                }
            });

            const updatedMedico = await tx.medico.update({
                where: { empleadoId: empleadoIdBigInt },
                data: {
                    especialidadId: BigInt(data.especialidad),
                    licenciaProfesional: data.licenciaProfesional,
                    numeroColegiatura: data.numeroColegiatura,
                    activo: data.activo,
                }
            });

            return updatedMedico;
        });

        return NextResponse.json({ success: true, doctor: { id: result.empleadoId.toString() } });
    } catch (error) {
        console.error("Error updating doctor:", error);
        const message = error instanceof Error ? error.message : "Error interno del servidor";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
