import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { loginSchema } from "@/lib/validations/auth";
import { LoginUser } from "@/application/use-cases/auth/LoginUser";
import { PrismaUserRepository } from "@/infrastructure/database/prisma/repositories/PrismaUserRepository";
import { JWTService } from "@/infrastructure/services/JWTService";

export async function POST(request: NextRequest) {
    try {
        // Parse request body
        const body = await request.json();

        // Validate input
        const validationResult = loginSchema.safeParse(body);
        if (!validationResult.success) {
            return NextResponse.json(
                { error: validationResult.error.issues[0].message },
                { status: 400 }
            );
        }

        const { email, password } = validationResult.data;

        // Execute login use case
        const userRepository = new PrismaUserRepository();
        const loginUseCase = new LoginUser(userRepository);

        const user = await loginUseCase.execute({ email, password });

        // Generate JWT token
        const token = await JWTService.generateToken({
            userId: user.id,
            email: user.email,
            role: user.role,
        });

        // Set HttpOnly cookie for security
        (await cookies()).set({
            name: "auth-token",
            value: token,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: "/",
        });

        // Return user data (password is already excluded in toJSON)
        const userJson = user.toJSON();

        return NextResponse.json({
            success: true,
            user: userJson,
            token, // Also send in response for client storage if needed
        });

    } catch (error) {
        console.error("Login error:", error);

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
