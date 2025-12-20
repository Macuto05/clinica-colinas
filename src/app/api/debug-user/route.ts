
import { NextResponse } from "next/server";
import prisma from "@/infrastructure/database/prisma/client";

export async function GET() {
    try {
        const email = 'admin@clinica.com';
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" });
        }

        return NextResponse.json({
            message: "User Analysis",
            email: user.email,
            role: user.role,
            roleType: typeof user.role,
            isStringAdmin: user.role === 'ADMIN',
            rawUser: user
        });
    } catch (error) {
        return NextResponse.json({ error: String(error) });
    }
}
