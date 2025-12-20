import { NextResponse } from "next/server";
import prisma from "@/infrastructure/database/prisma/client";
import { z } from "zod";
import bcrypt from "bcryptjs";

const createPatientSchema = z.object({
    nombres: z.string().min(2),
    apellidos: z.string().min(2),
    documentoIdentidad: z.string().min(5),
    fechaNacimiento: z.string().optional().or(z.literal("")),
    sexo: z.string().optional(),
    telefono: z.string().optional(),
    correo: z.string().email().optional().or(z.literal("")),
    direccion: z.string().optional(),
    estado: z.enum(["ACTIVO", "INACTIVO", "BLOQUEADO", "FALLECIDO"]),

    // User creation
    email: z.string().email().optional().or(z.literal("")),
    password: z.string().optional(),
    usuarioEstado: z.enum(["ACTIVO", "INACTIVO", "BLOQUEADO"]).default("ACTIVO"),
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const result = createPatientSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { error: "Datos inválidos", details: result.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const data = result.data;

        // Check if document already exists
        const existingPatient = await prisma.paciente.findFirst({
            where: { documentoIdentidad: data.documentoIdentidad }
        });
        if (existingPatient) {
            return NextResponse.json(
                { error: "Ya existe un paciente con este documento de identidad." },
                { status: 409 }
            );
        }

        await prisma.$transaction(async (tx) => {
            let usuarioId: bigint | null = null;

            // 1. Create User if email and password provided
            if (data.email && data.password && data.email.trim() !== "") {
                // Check if email taken
                const existingUser = await tx.usuario.findUnique({ where: { email: data.email } });
                if (existingUser) {
                    throw new Error("El email ya está registrado en el sistema.");
                }

                // Get Paciente Role ID
                const pacienteRol = await tx.rol.findUnique({ where: { nombre: 'PACIENTE' } });
                if (!pacienteRol) {
                    throw new Error("El rol 'PACIENTE' no está configurado en el sistema.");
                }

                const passwordHash = await bcrypt.hash(data.password, 10);
                const newUser = await tx.usuario.create({
                    data: {
                        email: data.email,
                        passwordHash,
                        rolId: pacienteRol.rolId,
                        estado: data.usuarioEstado as any,
                    }
                });
                usuarioId = newUser.usuarioId;
            }

            // 2. Create Patient
            await tx.paciente.create({
                data: {
                    nombres: data.nombres,
                    apellidos: data.apellidos,
                    documentoIdentidad: data.documentoIdentidad,
                    fechaNacimiento: data.fechaNacimiento ? new Date(data.fechaNacimiento) : null,
                    sexo: data.sexo,
                    telefono: data.telefono,
                    correo: data.correo || null,
                    direccion: data.direccion,
                    estado: data.estado as any,
                    usuarioId: usuarioId
                }
            });
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error creating patient:", error);
        return NextResponse.json(
            { error: error.message || "Error interno del servidor" },
            { status: 500 }
        );
    }
}
