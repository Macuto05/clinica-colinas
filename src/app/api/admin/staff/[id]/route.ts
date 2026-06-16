import { NextResponse } from "next/server";
import prisma from "@/infrastructure/database/prisma/client";
import { z } from "zod";
import bcrypt from "bcryptjs";

const updateStaffSchema = z.object({
    nombres: z.string().min(2, "El nombre es requerido"),
    apellidos: z.string().min(2, "El apellido es requerido"),
    documentoIdentidad: z.string().min(5, "Documento de identidad requerido"),
    telefono: z.string().min(1, "Teléfono requerido"),
    correoInstitucional: z.string().email("Correo de contacto inválido"),
    fechaIngreso: z.string().min(1, "Fecha de ingreso requerida"),
    rolId: z.string().min(1, "El rol es requerido"),
    email: z.string().email("Email de acceso inválido"),
    password: z.string().optional(),
    estadoLaboral: z.enum(["ACTIVO", "VACACIONES", "LICENCIA", "SUSPENDIDO", "RETIRADO"]),
    usuarioEstado: z.enum(["ACTIVO", "INACTIVO", "BLOQUEADO"]),
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

export async function PUT(request: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params;
        const id = BigInt(params.id);
        const body = await request.json();
        const result = updateStaffSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error.issues[0].message },
                { status: 400 }
            );
        }

        const data = result.data;

        const employee = await prisma.empleado.findUnique({
            where: { empleadoId: id },
            include: { usuario: true }
        });

        if (!employee) {
            return NextResponse.json({ error: "Empleado no encontrado" }, { status: 404 });
        }

        await prisma.$transaction(async (tx) => {
            await tx.empleado.update({
                where: { empleadoId: id },
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

            if (employee.usuarioId) {
                const userUpdateData: any = {
                    email: data.email,
                    rolId: BigInt(data.rolId),
                    estado: data.usuarioEstado as any,
                };
                if (data.password && data.password.trim() !== "") {
                    userUpdateData.passwordHash = await bcrypt.hash(data.password, 10);
                }
                await tx.usuario.update({
                    where: { usuarioId: employee.usuarioId },
                    data: userUpdateData,
                });
            }
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Error updating staff:", error);
        return NextResponse.json({ error: error.message || "Error interno" }, { status: 500 });
    }
}
