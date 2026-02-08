
import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma/client";

export async function GET() {
    try {
        const config = await prisma.configuracion.findUnique({
            where: { clave: "PRECIO_CONSULTA" }
        });

        const tasa = await prisma.tasaDeCambio.findFirst({
            orderBy: { fecha: 'desc' }
        });

        return NextResponse.json({
            precioConsulta: config ? parseFloat(config.valor) : 0,
            tasa: tasa ? parseFloat(tasa.valor.toString()) : 0
        });
    } catch (error) {
        return NextResponse.json({ error: "Error fetching config" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const body = await req.json();
        const { precioConsulta } = body;

        if (precioConsulta === undefined || precioConsulta < 0) {
            return NextResponse.json({ error: "Invalid price" }, { status: 400 });
        }

        const config = await prisma.configuracion.upsert({
            where: { clave: "PRECIO_CONSULTA" },
            update: { valor: precioConsulta.toString(), actualizadoEn: new Date() },
            create: {
                clave: "PRECIO_CONSULTA",
                valor: precioConsulta.toString(),
                descripcion: "Precio base de la consulta médica en USD"
            }
        });

        return NextResponse.json({ success: true, valor: config.valor });
    } catch (error) {
        return NextResponse.json({ error: "Error updating config" }, { status: 500 });
    }
}
