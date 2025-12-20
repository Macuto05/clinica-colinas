import { NextResponse } from "next/server";
import prisma from "@/infrastructure/database/prisma/client";
import { z } from "zod";

const updatePatientSchema = z.object({
    nombres: z.string().min(2),
    apellidos: z.string().min(2),
    documentoIdentidad: z.string().min(5),
    fechaNacimiento: z.string().optional().or(z.literal("")),
    sexo: z.string().optional(),
    telefono: z.string().optional(),
    correo: z.string().email().optional().or(z.literal("")),
    direccion: z.string().optional(),
    estado: z.enum(["ACTIVO", "INACTIVO", "BLOQUEADO", "FALLECIDO"]),
    email: z.string().email().optional().or(z.literal("")),
    usuarioEstado: z.enum(["ACTIVO", "INACTIVO", "BLOQUEADO"]),
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
                { error: "Datos inválidos", details: result.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const data = result.data;

        await prisma.$transaction(async (tx) => {
            // 1. Update Patient
            const updatedPatient = await tx.paciente.update({
                where: { pacienteId: id },
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
                },
            });

            // 2. Update User (if exists)
            if (updatedPatient.usuarioId) {
                // Check if email is being changed and if it's already taken
                /* 
                   Simpler logic: Try update, if unique constraint fails, Prisma throws. 
                   But let's assume we want to update status mainly.
                   If email is provided and different, we try to update it.
                */
                const updateData: any = {
                    estado: data.usuarioEstado as any
                };

                if (data.email) {
                    updateData.email = data.email;
                }

                await tx.usuario.update({
                    where: { usuarioId: updatedPatient.usuarioId },
                    data: updateData,
                });
            }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error updating patient:", error);
        if (error.code === 'P2002') {
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
