import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { loginSchema } from "@/lib/validations/auth";
import { LoginUser } from "@/application/use-cases/auth/LoginUser";
import { PrismaUserRepository } from "@/infrastructure/database/prisma/repositories/PrismaUserRepository";
import { JWTService } from "@/infrastructure/services/JWTService";
import { logAuditoria } from "@/infrastructure/services/AuditService";

export async function POST(request: NextRequest) {
    try {
        // Parsear cuerpo de la solicitud
        const body = await request.json();

        // Validar entrada
        const validationResult = loginSchema.safeParse(body);
        if (!validationResult.success) {
            return NextResponse.json(
                { error: validationResult.error.issues[0].message },
                { status: 400 }
            );
        }

        const { email, password } = validationResult.data;

        // Ejecutar caso de uso de login
        const userRepository = new PrismaUserRepository();
        const loginUseCase = new LoginUser(userRepository);

        const user = await loginUseCase.execute({ email, password });

        // Generar token JWT incluyendo patientId si el usuario es un paciente
        const token = await JWTService.generateToken({
            userId: user.id,
            email: user.email,
            role: user.role,
            ...(user.patientId && { patientId: Number(user.patientId) }),
        });

        // Establecer cookie HttpOnly para seguridad
        (await cookies()).set({
            name: "auth-token",
            value: token,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: "/",
        });

        // Retornar datos del usuario (contraseña ya está excluida en toJSON)
        const userJson = user.toJSON();

        logAuditoria({
            usuarioId: user.id,
            nombreUsuario: user.email,
            rolUsuario: user.role,
            modulo: 'AUTH',
            accion: 'LOGIN',
            descripcion: `Inicio de sesión: ${user.email}`,
            entidadTipo: 'Usuario',
            entidadId: String(user.id),
            req: request,
        });

        return NextResponse.json({
            success: true,
            user: userJson,
        });

    } catch (error) {
        console.error("Error de login:", error);

        if (error instanceof Error) {
            return NextResponse.json(
                { error: error.message },
                { status: 401 }
            );
        }

        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
