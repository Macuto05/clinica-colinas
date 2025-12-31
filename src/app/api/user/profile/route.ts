import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { PrismaUserRepository } from "@/infrastructure/database/prisma/repositories/PrismaUserRepository";
import { UpdateUserProfile } from "@/application/use-cases/user/UpdateUserProfile";
import { z } from "zod";
import * as jose from "jose";

const updateProfileSchema = z.object({
    contactEmail: z.string().email().optional().or(z.literal('')),
    accessEmail: z.string().email().optional(),
    password: z.string().min(6).optional().or(z.literal('')),
    phone: z.string().optional(),
    address: z.string().optional(),
});

const JWT_SECRET = process.env.JWT_SECRET || "secreto-super-seguro";

export async function PUT(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("auth_token");

        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Verify/Decode JWT manually since lib/auth might not exist
        const secret = new TextEncoder().encode(JWT_SECRET);
        const { payload } = await jose.jwtVerify(token.value, secret);

        if (!payload || !payload.sub) {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        }

        const body = await req.json();
        const validation = updateProfileSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: "Invalid data", details: validation.error.format() }, { status: 400 });
        }

        const { contactEmail, accessEmail, password, phone, address } = validation.data;

        const userRepository = new PrismaUserRepository();
        const updateUserProfile = new UpdateUserProfile(userRepository);

        const updatedUser = await updateUserProfile.execute({
            userId: Number(payload.sub), // assuming sub is userId
            contactEmail: contactEmail || undefined,
            accessEmail: accessEmail || undefined,
            password: password || undefined,
            phone: phone || undefined,
            address: address || undefined,
        });

        // We might want to refresh the token if critical data changed, but for now just return success
        return NextResponse.json({
            success: true,
            user: {
                // Return safe user data
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
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
