/**
 * Specialties Section - Server Component
 * 
 * Fetches specialties directly from the database using Next.js 16 Server Component pattern.
 * Following best practices:
 * - async/await pattern with Prisma
 * - Direct database access on server (no API route needed)
 * - Automatic memoization via fetch
 * - Type-safe with Prisma
 */

import prisma from "@/infrastructure/database/prisma/client";
import SpecialtiesClient from "@/components/SpecialtiesClient";

// Server Component - fetches data from database
export default async function Specialties() {
    // Fetch specialties directly from database
    // Next.js 16 automatically memoizes this query if called multiple times
    const specialtiesData = await prisma.especialidad.findMany({
        orderBy: {
            nombre: 'asc',
        },
        select: {
            especialidadId: true,
            nombre: true,
            descripcion: true,
            icono: true,
        },
    });

    // Map Spanish DB fields to English Props expected by Client Component
    const specialties = specialtiesData.map(s => ({
        id: Number(s.especialidadId),
        name: s.nombre,
        description: s.descripcion,
        icon: s.icono
    }));

    // Pass data to Client Component for interactivity
    return <SpecialtiesClient specialties={specialties} />;
}
