import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma/client";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: idStr } = await params;
        const id = BigInt(idStr);
        const body = await req.json();
        const { nombres, apellidos, documentoIdentidad, telefono, correo, fechaNacimiento, direccion, sexo, correoAcceso, password } = body;

        // 1. Check Duplicate Patient Document
        if (documentoIdentidad) {
            const existing = await prisma.paciente.findFirst({
                where: {
                    documentoIdentidad,
                    pacienteId: { not: id }
                }
            });
            if (existing) {
                return NextResponse.json({ error: "Ya existe otro paciente con este documento" }, { status: 400 });
            }
        }

        // 2. Handle User Account Logic
        let usuarioIdToUpdate: bigint | null | undefined = undefined;

        // Get current patient to check if they already have a user
        const currentPatient = await prisma.paciente.findUnique({
            where: { pacienteId: id },
            include: { usuario: true }
        });

        if (!currentPatient) {
            return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404 });
        }

        // A. If providing Access Email
        if (correoAcceso) {
            // Check if email is being used by ANOTHER user
            const existingUser = await prisma.usuario.findUnique({
                where: { email: correoAcceso }
            });

            if (existingUser && existingUser.usuarioId !== currentPatient.usuarioId) {
                return NextResponse.json({ error: "El correo de acceso ya está registrado por otro usuario" }, { status: 400 });
            }

            const bcrypt = await import('bcryptjs');

            if (currentPatient.usuarioId) {
                // UPDATE Existing User
                const updateData: any = { email: correoAcceso };
                if (password && password.length > 0) {
                    if (password.length < 8) return NextResponse.json({ error: "Contraseña muy corta" }, { status: 400 });
                    updateData.passwordHash = await bcrypt.hash(password, 10);
                }

                await prisma.usuario.update({
                    where: { usuarioId: currentPatient.usuarioId },
                    data: updateData
                });
            } else {
                // CREATE New User (Link to Patient)
                if (!password || password.length < 8) {
                    return NextResponse.json({ error: "Contraseña requerida para crear usuario (min 8 chars)" }, { status: 400 });
                }

                const role = await prisma.rol.findUnique({ where: { nombre: 'PACIENTE' } });
                if (!role) return NextResponse.json({ error: "Rol PACIENTE no configurado" }, { status: 500 });

                const newUser = await prisma.usuario.create({
                    data: {
                        email: correoAcceso,
                        passwordHash: await bcrypt.hash(password, 10),
                        rolId: role.rolId,
                        estado: 'ACTIVO'
                    }
                });
                usuarioIdToUpdate = newUser.usuarioId;
            }
        }

        // 3. Update Patient
        const updatedPatient = await prisma.paciente.update({
            where: { pacienteId: id },
            data: {
                nombres,
                apellidos,
                documentoIdentidad,
                telefono,
                correo,
                fechaNacimiento: fechaNacimiento ? new Date(fechaNacimiento) : undefined,
                direccion,
                sexo,
                usuarioId: usuarioIdToUpdate // Only updates if we created a new one
            }
        });

        return NextResponse.json({
            success: true,
            patient: {
                id: updatedPatient.pacienteId.toString(),
                nombres: updatedPatient.nombres
            }
        });

    } catch (error) {
        console.error("Error updating patient:", error);
        return NextResponse.json({ error: "Error al actualizar paciente" }, { status: 500 });
    }
}
