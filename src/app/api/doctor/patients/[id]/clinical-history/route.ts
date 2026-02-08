import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Adjust path if needed

// Helper to serialize BigInt
const bigIntReplacer = (key: string, value: any) => {
    if (typeof value === 'bigint') {
        return value.toString();
    }
    return value;
};

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const pacienteId = parseInt(id);
        if (isNaN(pacienteId)) {
            return NextResponse.json({ error: "ID de paciente inválido" }, { status: 400 });
        }

        const historia = await prisma.historiaClinica.findUnique({
            where: { pacienteId: pacienteId }
        });

        // Initialize empty if not found, but return structure so UI doesn't crash
        if (!historia) {
            return NextResponse.json({ contenido: {} });
        }

        // Serialize BigInts if any (ID is Int, pacienteId is BigInt)
        const json = JSON.stringify(historia, bigIntReplacer);
        return new NextResponse(json, {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error("Error fetching clinical history:", error);
        return NextResponse.json({ error: "Error al obtener historia clínica" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const pacienteId = parseInt(id);
        const body = await req.json();
        // Body expected: { contenido: { ... }, updatedById: ... }

        if (isNaN(pacienteId)) {
            return NextResponse.json({ error: "ID de paciente inválido" }, { status: 400 });
        }

        const { contenido, updatedById } = body;

        const historia = await prisma.historiaClinica.upsert({
            where: { pacienteId: pacienteId },
            update: {
                contenido: contenido,
                updatedById: updatedById ? parseInt(updatedById) : null
            },
            create: {
                pacienteId: pacienteId,
                contenido: contenido || {},
                updatedById: updatedById ? parseInt(updatedById) : null
            }
        });

        const json = JSON.stringify(historia, bigIntReplacer);
        return new NextResponse(json, {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error("Error updating clinical history:", error);
        return NextResponse.json({ error: "Error al guardar historia clínica" }, { status: 500 });
    }
}
