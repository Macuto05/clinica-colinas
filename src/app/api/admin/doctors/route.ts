import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/infrastructure/database/prisma/client";
import { JWTService } from "@/infrastructure/services/JWTService";

// @ts-ignore
BigInt.prototype.toJSON = function () { return this.toString() };

const createDoctorSchema = z.object({
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
    password: z.string()
        .min(8, "La contraseña debe tener al menos 8 caracteres")
        .refine(p => /[A-Z]/.test(p), "La contraseña debe tener al menos una letra mayúscula")
        .refine(p => /[0-9]/.test(p), "La contraseña debe tener al menos un número"),
});

export async function POST(req: NextRequest) {
    try {
        const token = req.cookies.get("auth-token")?.value;
        if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        const payload = await JWTService.verifyToken(token);
        if (!payload) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

        const body = await req.json();
        const validation = createDoctorSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
        }

        const data = validation.data;

        const result = await prisma.$transaction(async (tx) => {
            const medicoRole = await tx.rol.findUnique({ where: { nombre: "MEDICO" } });
            if (!medicoRole) throw new Error("Rol MEDICO no encontrado en el sistema");

            const existingUser = await tx.usuario.findUnique({ where: { email: data.email } });
            if (existingUser) throw new Error("Ya existe un usuario con ese correo electrónico");

            const passwordHash = await bcrypt.hash(data.password, 10);

            const usuario = await tx.usuario.create({
                data: {
                    rolId: medicoRole.rolId,
                    email: data.email,
                    passwordHash,
                    estado: "ACTIVO",
                },
            });

            const empleado = await tx.empleado.create({
                data: {
                    usuarioId: usuario.usuarioId,
                    nombres: data.nombres,
                    apellidos: data.apellidos,
                    documentoIdentidad: data.documentoIdentidad || null,
                    telefono: data.telefono || null,
                    correoInstitucional: data.correoInstitucional || null,
                    fechaIngreso: data.fechaIngreso ? new Date(data.fechaIngreso) : null,
                    estadoLaboral: "ACTIVO",
                },
            });

            const medico = await tx.medico.create({
                data: {
                    empleadoId: empleado.empleadoId,
                    especialidadId: BigInt(data.especialidad),
                    licenciaProfesional: data.licenciaProfesional || null,
                    numeroColegiatura: data.numeroColegiatura || null,
                    activo: true,
                },
            });

            return medico;
        });

        return NextResponse.json({ success: true, doctor: { id: result.empleadoId.toString() } }, { status: 201 });
    } catch (error) {
        console.error("Error creating doctor:", error);
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

        const doctors = await prisma.medico.findMany({
            where: { activo: true },
            include: {
                empleado: {
                    select: {
                        empleadoId: true,
                        nombres: true,
                        apellidos: true,
                    }
                },
                especialidad: {
                    select: {
                        nombre: true,
                    }
                }
            },
            orderBy: { empleado: { nombres: 'asc' } },
        });

        return NextResponse.json({
            doctors: doctors.map(d => ({
                empleadoId: d.empleadoId.toString(),
                empleado: d.empleado,
                especialidad: d.especialidad,
            })),
        });
    } catch (error) {
        console.error("Error fetching doctors:", error);
        return NextResponse.json({ error: "Error al cargar médicos" }, { status: 500 });
    }
}
