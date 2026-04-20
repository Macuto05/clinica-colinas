import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { registerSchema } from "@/lib/validations/auth";
import { RegisterUser } from "@/application/use-cases/auth/RegisterUser";
import { PrismaUserRepository } from "@/infrastructure/database/prisma/repositories/PrismaUserRepository";
import { JWTService } from "@/infrastructure/services/JWTService";
import { Role } from "@/domain/entities/User";

export async function POST(request: NextRequest) {
    try {
        // Parse request body
        const body = await request.json();

        // Validate input
        const validationResult = registerSchema.safeParse(body);
        if (!validationResult.success) {
            return NextResponse.json(
                { error: validationResult.error.issues[0].message },
                { status: 400 }
            );
        }

        const data = validationResult.data;

        // Execute register use case
        const userRepository = new PrismaUserRepository();
        const registerUseCase = new RegisterUser(userRepository);

        // Map form data to DTO
        // Note: The form has more fields than the basic User entity might initially support if not updated.
        // We need to ensure the User entity and Repository support these fields.
        // Based on previous context, User entity has phone, address, etc.

        // SEC-05: Force PACIENTE role — only admins can assign other roles via admin panel
        const user = await registerUseCase.execute({
            email: data.email,
            password: data.password,
            firstName: data.firstName,
            lastName: data.lastName,
            role: 'PACIENTE',
            phone: data.phone,
            address: data.address,
            idCard: data.idCard,
            birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
            sex: data.sex,
            contactEmail: data.contactEmail,
            specialty: data.specialty,
            collegiateNumber: data.collegiateNumber
        });

        // Generate JWT token
        const token = await JWTService.generateToken({
            userId: user.id,
            email: user.email,
            role: user.role,
        });

        // Set HttpOnly cookie
        (await cookies()).set({
            name: "auth-token",
            value: token,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: "/",
        });

        const { password: _, ...userWithoutPassword } = user;

        return NextResponse.json({
            success: true,
            user: userWithoutPassword,
        });

    } catch (error) {
        console.error("Register error:", error);

        if (error instanceof Error) {
            return NextResponse.json(
                { error: error.message },
                { status: 400 } // Bad request for validation/business logic errors
            );
        }

        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
