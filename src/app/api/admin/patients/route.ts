import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/infrastructure/database/prisma/client";
import { JWTService } from "@/infrastructure/services/JWTService";

const createPatientSchema = z.object({
    nombres: z.string().min(2, "El nombre es requerido"),
    apellidos: z.string().min(2, "El apellido es requerido"),
    documentoIdentidad: z.string().min(5, "Documento de identidad requerido"),
    fechaNacimiento: z.string().optional(),
    sexo: z.string().optional(),
    telefono: z.string().optional(),
    correo: z.string().email().optional().or(z.literal("")),
    direccion: z.string().optional(),
    email: z.string().email("Email de acceso inválido").optional().or(z.literal("")),
    password: z.string().optional(),
}).superRefine((data, ctx) => {
    if (data.email && !data.password) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "La contraseña es requerida cuando se proporciona el correo de acceso", path: ["password"] });
    }
    if (data.password) {
        if (data.password.length < 8)
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "La contraseña debe tener al menos 8 caracteres", path: ["password"] });
        if (!/[A-Z]/.test(data.password))
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "La contraseña debe tener al menos una letra mayúscula", path: ["password"] });
        if (!/[0-9]/.test(data.password))
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "La contraseña debe tener al menos un número", path: ["password"] });
    }
});

export async function POST(req: NextRequest) {
    try {
        const token = req.cookies.get("auth-token")?.value;
        if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        const payload = await JWTService.verifyToken(token);
        if (!payload) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

        const body = await req.json();
        const validation = createPatientSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
        }

        const data = validation.data;

        const result = await prisma.$transaction(async (tx) => {
            let usuarioId: bigint | null = null;

            if (data.email && data.password) {
                const existing = await tx.usuario.findUnique({ where: { email: data.email } });
                if (existing) throw new Error("Ya existe un usuario con ese correo electrónico");

                const pacienteRole = await tx.rol.findUnique({ where: { nombre: "PACIENTE" } });
                if (!pacienteRole) throw new Error("Rol PACIENTE no encontrado en el sistema");

                const passwordHash = await bcrypt.hash(data.password, 10);
                const usuario = await tx.usuario.create({
                    data: { rolId: pacienteRole.rolId, email: data.email, passwordHash, estado: "ACTIVO" },
                });
                usuarioId = usuario.usuarioId;
            }

            return tx.paciente.create({
                data: {
                    usuarioId,
                    nombres: data.nombres,
                    apellidos: data.apellidos,
                    documentoIdentidad: data.documentoIdentidad || null,
                    fechaNacimiento: data.fechaNacimiento ? new Date(data.fechaNacimiento) : null,
                    sexo: data.sexo || null,
                    telefono: data.telefono || null,
                    correo: data.correo || null,
                    direccion: data.direccion || null,
                    estado: "ACTIVO",
                },
            });
        });

        return NextResponse.json({ success: true, patient: { id: result.pacienteId.toString() } }, { status: 201 });
    } catch (error) {
        console.error("Error creating patient:", error);
        const message = error instanceof Error ? error.message : "Error interno del servidor";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        const token = req.cookies.get("auth-token")?.value;
        if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        const payload = await JWTService.verifyToken(token);
        if (!payload) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

        const patients = await prisma.paciente.findMany({
            where: { estado: "ACTIVO" },
            select: {
                pacienteId: true,
                nombres: true,
                apellidos: true,
            },
            orderBy: { nombres: "asc" },
        });

        return NextResponse.json({
            patients: patients.map(p => ({
                pacienteId: p.pacienteId.toString(),
                nombres: p.nombres,
                apellidos: p.apellidos,
            })),
        });
    } catch (error) {
        console.error("Error fetching patients:", error);
        return NextResponse.json({ error: "Error al cargar pacientes" }, { status: 500 });
    }
}
