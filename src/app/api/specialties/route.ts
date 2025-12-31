
import { NextResponse } from 'next/server';
import prisma from '@/infrastructure/database/prisma/client';

export async function GET() {
    try {
        const specialties = await prisma.especialidad.findMany({
            where: {
                activa: true
            },
            orderBy: {
                nombre: 'asc',
            },
        });

        // Map to frontend expectation if needed, or just return raw
        // Frontend expects: { id: number, name: string }
        const mapped = specialties.map(s => ({
            id: Number(s.especialidadId), // BigInt to Number
            name: s.nombre,
            description: s.descripcion
        }));

        return NextResponse.json(mapped);
    } catch (error) {
        console.error('Error fetching specialties:', error);
        return NextResponse.json(
            { error: 'Error fetching specialties' },
            { status: 500 }
        );
    }
}
