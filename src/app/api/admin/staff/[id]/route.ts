import { NextResponse } from "next/server";
import prisma from "@/infrastructure/database/prisma/client";
import { z } from "zod";
import bcrypt from "bcryptjs";

const updateStaffSchema = z.object({
    nombres: z.string().optional(),
    apellidos: z.string().optional(),
    documentoIdentidad: z.string().optional(),
    telefono: z.string().optional(),
    correoInstitucional: z.string().optional(),
    fechaIngreso: z.string().optional(),
    rolId: z.string().optional(),
    email: z.string().email().optional(),
    password: z.string().optional(),
    estadoLaboral: z.enum(["ACTIVO", "VACACIONES", "LICENCIA", "SUSPENDIDO", "RETIRADO"]).optional(),
});

export async function PUT(request: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params;
        const id = BigInt(params.id);
        const body = await request.json();
        const result = updateStaffSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { error: "Datos inválidos", details: result.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const data = result.data;

        // Find existing employee
        const employee = await prisma.empleado.findUnique({
            where: { empleadoId: id },
            include: { usuario: true }
        });

        if (!employee) {
            return NextResponse.json({ error: "Empleado no encontrado" }, { status: 404 });
        }

        // Transaction
        await prisma.$transaction(async (tx) => {
            // Update Empleado
            await tx.empleado.update({
                where: { empleadoId: id },
                data: {
                    nombres: data.nombres,
                    apellidos: data.apellidos,
                    documentoIdentidad: data.documentoIdentidad,
                    telefono: data.telefono,
                    correoInstitucional: data.correoInstitucional,
                    fechaIngreso: data.fechaIngreso ? new Date(data.fechaIngreso) : undefined,
                    estadoLaboral: data.estadoLaboral as any,
                }
            });

            // Update User if exists
            if (employee.usuarioId) {
                const updateData: any = {};
                if (data.email) updateData.email = data.email;
                if (data.rolId) updateData.rolId = BigInt(data.rolId);
                if (data.password && data.password.length >= 6) {
                    updateData.passwordHash = await bcrypt.hash(data.password, 10);
                }

                if (Object.keys(updateData).length > 0) {
                    await tx.usuario.update({
                        where: { usuarioId: employee.usuarioId },
                        data: updateData
                    });
                }
            }
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Error updating staff:", error);
        return NextResponse.json({ error: error.message || "Error interno" }, { status: 500 });
    }
}
