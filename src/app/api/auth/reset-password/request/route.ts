import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma/client";
import { EmailService } from "@/infrastructure/services/EmailService";
import crypto from "crypto";

export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json();

        if (!email || typeof email !== "string") {
            return NextResponse.json({ error: "Email requerido" }, { status: 400 });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Find the user — always return 200 to avoid user enumeration
        const usuario = await prisma.usuario.findUnique({
            where: { email: normalizedEmail },
            include: {
                empleado: { select: { nombres: true, apellidos: true } },
                paciente: { select: { nombres: true, apellidos: true } },
            },
        });

        if (usuario) {
            // Invalidate any existing tokens for this user
            await prisma.passwordResetToken.updateMany({
                where: { usuarioId: usuario.usuarioId, used: false },
                data: { used: true },
            });

            // Generate a secure token
            const token = crypto.randomBytes(32).toString("hex");
            const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

            await prisma.passwordResetToken.create({
                data: {
                    token,
                    usuarioId: usuario.usuarioId,
                    expiresAt,
                },
            });

            // Get display name
            const nombre =
                usuario.empleado
                    ? `${usuario.empleado.nombres} ${usuario.empleado.apellidos}`
                    : usuario.paciente
                    ? `${usuario.paciente.nombres} ${usuario.paciente.apellidos}`
                    : undefined;

            // Send email (non-blocking failure — don't expose errors to client)
            try {
                await EmailService.sendPasswordResetEmail(normalizedEmail, token, nombre);
            } catch (emailErr) {
                console.error("Email send failed:", emailErr);
            }
        }

        // Always return success to prevent email enumeration
        return NextResponse.json({
            success: true,
            message: "Si el correo está registrado, recibirás un enlace en breve.",
        });
    } catch (error) {
        console.error("Password reset request error:", error);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}
