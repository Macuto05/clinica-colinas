
import { NextResponse } from "next/server";
import prisma from "@/infrastructure/database/prisma/client";

export async function GET() {
    try {
        const email = 'admin@clinica.com';
        const user = await prisma.usuario.findUnique({
            where: { email },
            include: { rol: true }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" });
        }

        return NextResponse.json({
            message: "User Analysis",
            email: user.email,
            role: user.rol?.nombre,
            roleType: typeof user.rol?.nombre,
            isStringAdmin: user.rol?.nombre === 'ADMINISTRADOR',
            rawUser: user
        });
    } catch (error) {
        return NextResponse.json({ error: String(error) });
    }
}
