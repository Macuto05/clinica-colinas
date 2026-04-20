
import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma/client";

export async function GET() {
    try {
        const [configConsulta, configMargen, tasa] = await Promise.all([
            prisma.configuracion.findUnique({ where: { clave: "PRECIO_CONSULTA" } }),
            prisma.configuracion.findUnique({ where: { clave: "MARGEN_INSUMOS" } }),
            prisma.tasaDeCambio.findFirst({ orderBy: { fecha: 'desc' } })
        ]);

        return NextResponse.json({
            precioConsulta: configConsulta ? parseFloat(configConsulta.valor) : 0,
            margenInsumos: configMargen ? parseFloat(configMargen.valor) : 0,
            tasa: tasa ? parseFloat(tasa.valor.toString()) : 0
        });
    } catch (error) {
        return NextResponse.json({ error: "Error fetching config" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const body = await req.json();
        const { precioConsulta, margenInsumos } = body;

        const updates: Promise<any>[] = [];

        if (precioConsulta !== undefined) {
            if (precioConsulta < 0) {
                return NextResponse.json({ error: "Invalid precioConsulta" }, { status: 400 });
            }
            updates.push(
                prisma.configuracion.upsert({
                    where: { clave: "PRECIO_CONSULTA" },
                    update: { valor: precioConsulta.toString(), actualizadoEn: new Date() },
                    create: {
                        clave: "PRECIO_CONSULTA",
                        valor: precioConsulta.toString(),
                        descripcion: "Precio base de la consulta mÃ©dica en USD"
                    }
                })
            );
        }

        if (margenInsumos !== undefined) {
            if (margenInsumos < 0) {
                return NextResponse.json({ error: "Invalid margenInsumos" }, { status: 400 });
            }
            updates.push(
                prisma.configuracion.upsert({
                    where: { clave: "MARGEN_INSUMOS" },
                    update: { valor: margenInsumos.toString(), actualizadoEn: new Date() },
                    create: {
                        clave: "MARGEN_INSUMOS",
                        valor: margenInsumos.toString(),
                        descripcion: "Porcentaje de ganancia sobre el costo de compra de insumos"
                    }
                })
            );
        }

        await Promise.all(updates);

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Error updating config" }, { status: 500 });
    }
}
