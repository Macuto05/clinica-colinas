
import { NextResponse } from 'next/server';
import prisma from '@/infrastructure/database/prisma/client';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        console.log("🛠️ Starting simplified repair...");

        // Find Gabriela by user name
        const user = await prisma.user.findFirst({
            where: { name: { contains: "Gabriela" } },
            include: { doctor: true }
        });

        if (!user) {
            return NextResponse.json({ error: "User Gabriela not found" }, { status: 404 });
        }

        if (!user.doctor) {
            return NextResponse.json({ error: "User has no doctor profile" }, { status: 404 });
        }

        // Force update the image
        const updatedDoctor = await prisma.doctor.update({
            where: { id: user.doctor.id },
            data: {
                imageUrl: "/images/doctors/Dra-Gabriela-NAtera-Oftalmologa_14-240x300.jpeg"
            }
        });

        console.log("✅ Updated doctor image:", updatedDoctor.imageUrl);

        // Debug Route - Refactored to avoid build errors with old models
        // const doctorCount = await prisma.medico.count();
        return NextResponse.json({ status: "Maintenance mode" });

    } catch (error: any) {
        console.error("Repair error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
