import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { JWTService } from "@/infrastructure/services/JWTService";
import { PrismaAppointmentRepository } from "@/infrastructure/database/prisma/repositories/PrismaAppointmentRepository";
import { PrismaUserRepository } from "@/infrastructure/database/prisma/repositories/PrismaUserRepository";

export async function GET(request: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("auth-token")?.value;

        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const payload = await JWTService.verifyToken(token);
        if (!payload) {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        }

        // Verify Admin Role
        const userRepo = new PrismaUserRepository();
        const user = await userRepo.findById(payload.userId);

        if (!user || user.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden: Admin access only" }, { status: 403 });
        }

        const appointmentRepo = new PrismaAppointmentRepository();
        const appointments = await appointmentRepo.findAllWithDetails();

        // Use toJSON to ensure clean output
        const data = appointments.map(apt => apt.toJSON());

        return NextResponse.json({ appointments: data });

    } catch (error) {
        console.error("[API/ADMIN/APPOINTMENTS] Error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
