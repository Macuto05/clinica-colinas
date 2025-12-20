import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { JWTService } from "@/infrastructure/services/JWTService";
import { PrismaUserRepository } from "@/infrastructure/database/prisma/repositories/PrismaUserRepository";

export async function GET(request: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("auth-token")?.value;

        if (!token) {
            return NextResponse.json(
                { error: "Not authenticated" },
                { status: 401 }
            );
        }

        const payload = await JWTService.verifyToken(token);

        if (!payload) {
            return NextResponse.json(
                { error: "Invalid token" },
                { status: 401 }
            );
        }

        const userRepository = new PrismaUserRepository();
        const user = await userRepository.findById(payload.userId);

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        // Fix: Use toJSON() to get the flattened data structure and redundant password exclusion (toJSON already excludes it)
        const userJson = user.toJSON();

        return NextResponse.json({
            user: userJson,
        });

    } catch (error) {
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
