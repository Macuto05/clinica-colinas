import { NextResponse } from "next/server";
import prisma from "@/infrastructure/database/prisma/client";
import { z } from "zod";
import bcrypt from "bcryptjs";

const staffApiSchema = z.object({
    nombres: z.string(),
    apellidos: z.string(),
    documentoIdentidad: z.string(),
    telefono: z.string().optional(),
    correoInstitucional: z.string().optional(),
    fechaIngreso: z.string().optional(),
    rolId: z.string(), // We get it as string from frontend
    email: z.string().email(),
    password: z.string().min(6),
    estadoLaboral: z.enum(["ACTIVO", "VACACIONES", "LICENCIA", "SUSPENDIDO", "RETIRADO"]),
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const result = staffApiSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { error: "Datos inválidos", details: result.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const data = result.data;

        // Validations
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

        // Transaction
        await prisma.$transaction(async (tx) => {
            const passwordHash = await bcrypt.hash(data.password, 10);

            // 1. Create User
            const newUser = await tx.usuario.create({
                data: {
                    email: data.email,
                    passwordHash,
                    rolId: BigInt(data.rolId),
                    estado: 'ACTIVO'
                }
            });

            // 2. Create Empleado
            await tx.empleado.create({
                data: {
                    nombres: data.nombres,
                    apellidos: data.apellidos,
                    documentoIdentidad: data.documentoIdentidad,
                    telefono: data.telefono,
                    correoInstitucional: data.correoInstitucional || null,
                    fechaIngreso: data.fechaIngreso ? new Date(data.fechaIngreso) : null,
                    estadoLaboral: data.estadoLaboral as any,
                    usuarioId: newUser.usuarioId
                }
            });
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Error creating staff:", error);
        return NextResponse.json({ error: error.message || "Error interno" }, { status: 500 });
    }
}
