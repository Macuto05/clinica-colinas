"use server";

import prisma from "@/infrastructure/database/prisma/client";

export async function getActiveSpecialties() {
    try {
        // Find specialties that have at least one doctor
        // Active specialties logic simplified as there is no direct relation in current schema
        const activeSpecialties = await prisma.especialidad.findMany({
            where: {
                activa: true
            },
            select: {
                nombre: true
            }
        });

        // Return just the names
        return activeSpecialties.map(s => s.nombre);
    } catch (error) {
        console.error("Error fetching active specialties:", error);
        return [];
    }
}
