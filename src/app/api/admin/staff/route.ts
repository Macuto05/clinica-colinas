import { NextResponse } from "next/server";
import prisma from "@/infrastructure/database/prisma/client";
import { z } from "zod";
import bcrypt from "bcryptjs";

const staffApiSchema = z.object({
    nombres: z.string().min(2, "El nombre es requerido"),
    apellidos: z.string().min(2, "El apellido es requerido"),
    documentoIdentidad: z.string().min(5, "Documento de identidad requerido"),
    telefono: z.string().min(1, "Teléfono requerido"),
    correoInstitucional: z.string().email("Correo de contacto inválido"),
    fechaIngreso: z.string().min(1, "Fecha de ingreso requerida"),
    rolId: z.string().min(1, "El rol es requerido"),
    email: z.string().email("Email de acceso inválido"),
    password: z.string()
        .min(8, "La contraseña debe tener al menos 8 caracteres")
        .refine(p => /[A-Z]/.test(p), "La contraseña debe tener al menos una letra mayúscula")
        .refine(p => /[0-9]/.test(p), "La contraseña debe tener al menos un número"),
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const result = staffApiSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error.issues[0].message },
                { status: 400 }
            );
        }

        const data = result.data;

        const existingDoc = await prisma.empleado.findUnique({
            where: { documentoIdentidad: data.documentoIdentidad }
        });
        if (existingDoc) {
            return NextResponse.json({ error: "Ya existe un empleado con este documento" }, { status: 409 });
        }

        const existingUser = await prisma.usuario.findUnique({ where: { email: data.email } });
        if (existingUser) {
            return NextResponse.json({ error: "El email de usuario ya está registrado" }, { status: 409 });
        }

        await prisma.$transaction(async (tx) => {
            const passwordHash = await bcrypt.hash(data.password, 10);

            const newUser = await tx.usuario.create({
                data: {
                    email: data.email,
                    passwordHash,
                    rolId: BigInt(data.rolId),
                    estado: "ACTIVO",
                }
            });

            await tx.empleado.create({
                data: {
                    nombres: data.nombres,
                    apellidos: data.apellidos,
                    documentoIdentidad: data.documentoIdentidad,
                    telefono: data.telefono,
                    correoInstitucional: data.correoInstitucional,
                    fechaIngreso: new Date(data.fechaIngreso),
                    estadoLaboral: "ACTIVO",
                    usuarioId: newUser.usuarioId,
                }
            });
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Error creating staff:", error);
        return NextResponse.json({ error: error.message || "Error interno" }, { status: 500 });
    }
}
