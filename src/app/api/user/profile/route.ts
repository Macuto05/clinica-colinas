import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { PrismaUserRepository } from "@/infrastructure/database/prisma/repositories/PrismaUserRepository";
import { UpdateUserProfile } from "@/application/use-cases/user/UpdateUserProfile";
import { z } from "zod";
import { JWTService } from "@/infrastructure/services/JWTService";
import { prisma } from "@/infrastructure/database/prisma/client";

const updateProfileSchema = z.object({
    // Empty string means "no change" — treated as undefined downstream
    contactEmail: z.string().email("Email de contacto inválido").optional().or(z.literal('')),
    accessEmail: z.string().email("Email de acceso inválido").optional(),
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres").optional().or(z.literal('')),
    phone: z.string().optional(),
    address: z.string().optional(),
});

export async function PUT(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("auth-token");

        if (!token) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const payload = await JWTService.verifyToken(token.value);
        if (!payload || !payload.userId) {
            return NextResponse.json({ error: "Token inválido" }, { status: 401 });
        }

        const body = await req.json();
        const validation = updateProfileSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: "Datos inválidos", details: validation.error.format() }, { status: 400 });
        }

        const { contactEmail, accessEmail, password, phone, address } = validation.data;

        // Uniqueness checks for phone and contactEmail (excluding current patient)
        if (phone || contactEmail) {
            const currentPatient = await (prisma.paciente as any).findFirst({
                where: { usuarioId: BigInt(payload.userId) }
            });

            if (currentPatient) {
                if (phone) {
                    const dupPhone = await (prisma.paciente as any).findFirst({
                        where: { telefono: phone, pacienteId: { not: currentPatient.pacienteId } }
                    });
                    if (dupPhone) {
                        return NextResponse.json({ error: "El número de teléfono ya está registrado por otro paciente." }, { status: 409 });
                    }
                }

                if (contactEmail) {
                    const dupContact = await (prisma.paciente as any).findFirst({
                        where: { correo: contactEmail, pacienteId: { not: currentPatient.pacienteId } }
                    });
                    if (dupContact) {
                        return NextResponse.json({ error: "El correo de contacto ya está registrado por otro paciente." }, { status: 409 });
                    }
                }
            }
        }

        const userRepository = new PrismaUserRepository();
        const updateUserProfile = new UpdateUserProfile(userRepository);

        const updatedUser = await updateUserProfile.execute({
            userId: Number(payload.userId),
            contactEmail: contactEmail || undefined,
            accessEmail: accessEmail || undefined,
            password: password || undefined,
            phone: phone || undefined,
            address: address || undefined,
        });

        return NextResponse.json({
            success: true,
            user: {
                firstName: updatedUser.firstName,
                lastName: updatedUser.lastName,
                email: updatedUser.email,
                phone: updatedUser.phone,
                address: updatedUser.address,
                contactEmail: updatedUser.contactEmail
            }
        });

    } catch (error: any) {
        console.error("Profile update error:", error);
        return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 });
    }
}
