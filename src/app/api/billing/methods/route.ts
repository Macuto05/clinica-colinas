
import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma/client";

export async function GET() {
    try {
        const methods = await prisma.metodoPago.findMany({
            where: { activo: true },
        });
        // Convert BigInt to string
        const formatted = methods.map(m => ({
            id: m.metodoPagoId.toString(),
            nombre: m.nombre,
            descripcion: m.descripcion
        }));
        return NextResponse.json(formatted);
    } catch (error) {
        return NextResponse.json({ error: "Error fetching methods" }, { status: 500 });
    }
}
