import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma/client";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
    try {
        const { token, newPassword } = await request.json();

        if (!token || !newPassword) {
            return NextResponse.json({ error: "Token y contraseña son requeridos" }, { status: 400 });
        }

        if (newPassword.length < 8) {
            return NextResponse.json({ error: "La contraseña debe tener al menos 8 caracteres" }, { status: 400 });
        }

        // Validate token
        const record = await prisma.passwordResetToken.findUnique({
            where: { token },
        });

        if (!record) {
            return NextResponse.json({ error: "Enlace inválido" }, { status: 400 });
        }

        if (record.used) {
            return NextResponse.json({ error: "Este enlace ya fue utilizado" }, { status: 400 });
        }

        if (record.expiresAt < new Date()) {
            return NextResponse.json({ error: "El enlace ha expirado. Solicita uno nuevo." }, { status: 400 });
        }

        // Hash the new password
        const passwordHash = await bcrypt.hash(newPassword, 12);

        // Update password and mark token as used — atomic transaction
        await prisma.$transaction([
            prisma.usuario.update({
                where: { usuarioId: record.usuarioId },
                data: { passwordHash },
            }),
            prisma.passwordResetToken.update({
                where: { id: record.id },
                data: { used: true },
            }),
        ]);

        return NextResponse.json({
            success: true,
            message: "Contraseña actualizada correctamente",
        });
    } catch (error) {
        console.error("Password reset confirm error:", error);
        return NextResponse.json({ error: "Error al actualizar la contraseña" }, { status: 500 });
    }
}
