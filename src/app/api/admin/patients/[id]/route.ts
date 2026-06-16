import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/infrastructure/database/prisma/client";
import { z } from "zod";

const updatePatientSchema = z.object({
    nombres: z.string().min(2, "El nombre es requerido"),
    apellidos: z.string().min(2, "El apellido es requerido"),
    documentoIdentidad: z.string().min(5, "Documento de identidad requerido"),
    fechaNacimiento: z.string().min(1, "Fecha de nacimiento requerida"),
    sexo: z.string().min(1, "Sexo requerido"),
    telefono: z.string().min(1, "Teléfono requerido"),
    correo: z.string().email("Correo de contacto inválido"),
    direccion: z.string().min(1, "Dirección requerida"),
    estado: z.enum(["ACTIVO", "INACTIVO", "BLOQUEADO", "FALLECIDO"]),
    email: z.string().email("Email de acceso inválido"),
    usuarioEstado: z.enum(["ACTIVO", "INACTIVO", "BLOQUEADO"]),
    password: z.string().optional(),
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
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idParam } = await params;
        const id = BigInt(idParam);
        const body = await request.json();
        const result = updatePatientSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error.issues[0].message },
                { status: 400 }
            );
        }

        const data = result.data;

        await prisma.$transaction(async (tx) => {
            const updatedPatient = await tx.paciente.update({
                where: { pacienteId: id },
                data: {
                    nombres: data.nombres,
                    apellidos: data.apellidos,
                    documentoIdentidad: data.documentoIdentidad,
                    fechaNacimiento: new Date(data.fechaNacimiento),
                    sexo: data.sexo,
                    telefono: data.telefono,
                    correo: data.correo,
                    direccion: data.direccion,
                    estado: data.estado as any,
                },
            });

            if (updatedPatient.usuarioId) {
                const userUpdateData: any = {
                    email: data.email,
                    estado: data.usuarioEstado as any,
                };
                if (data.password && data.password.trim() !== "") {
                    userUpdateData.passwordHash = await bcrypt.hash(data.password, 10);
                }
                await tx.usuario.update({
                    where: { usuarioId: updatedPatient.usuarioId },
                    data: userUpdateData,
                });
            }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error updating patient:", error);
        if (error.code === "P2002") {
            return NextResponse.json(
                { error: "El documento o email ya está en uso." },
                { status: 409 }
            );
        }
        return NextResponse.json(
            { error: error.message || "Error interno del servidor" },
            { status: 500 }
        );
    }
}
