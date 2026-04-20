import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma/client";

// URL oficial de DolarAPI para BCV
const DOLAR_API_URL = "https://ve.dolarapi.com/v1/dolares/oficial";

export async function GET() {
    try {
        const tasa = await prisma.tasaDeCambio.findFirst({
            orderBy: { fecha: 'desc' }
        });

        return NextResponse.json({
            tasa: tasa ? parseFloat(tasa.valor.toString()) : null,
            fechaActualizacion: tasa ? tasa.fecha : null,
            fuente: tasa ? tasa.fuente : null
        });
    } catch (error) {
        console.error("Error fetching Exchange Rate from DB:", error);
        return NextResponse.json({ error: "Error interno al obtener tasa" }, { status: 500 });
    }
}

export async function POST() {
    try {
        // 1. Obtener de la API Externa
        const response = await fetch(DOLAR_API_URL, { cache: "no-store" });
        if (!response.ok) {
            throw new Error(`DolarAPI respondiÃ³ con status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // La API de DolarAPI provee compra, venta y promedio. 
        // Para BCV, usamos promedio (oficial).
        const rateValue = data.promedio;

        if (!rateValue || isNaN(rateValue)) {
            throw new Error("El arreglo JSON del BCV no es vÃ¡lido o ha cambiado de estructura");
        }

        // 2. Insertar en la Base de Datos
        const nuevaTasa = await prisma.tasaDeCambio.create({
            data: {
                moneda: "USD",
                valor: rateValue,
                fuente: "BCV",
                esAutomatica: true,
                fecha: new Date(data.fechaActualizacion || new Date())
            }
        });

        return NextResponse.json({
            success: true,
            tasa: parseFloat(nuevaTasa.valor.toString()),
            fechaActualizacion: nuevaTasa.fecha,
            fuente: nuevaTasa.fuente
        });

    } catch (error: any) {
        console.error("Error sincronizando DolarAPI BCV:", error);
        return NextResponse.json({ error: "No se pudo sincronizar con BCV", detail: error.message }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const { valor } = await req.json();
        const num = Number(valor);
        if (!valor || isNaN(num) || num <= 0) {
            return NextResponse.json({ error: "Valor invÃ¡lido" }, { status: 400 });
        }

        const nueva = await prisma.tasaDeCambio.create({
            data: {
                moneda: "USD",
                valor: num,
                fuente: "Manual",
                esAutomatica: false,
                fecha: new Date()
            }
        });

        return NextResponse.json({
            success: true,
            tasa: parseFloat(nueva.valor.toString()),
            fechaActualizacion: nueva.fecha,
            fuente: nueva.fuente
        });
    } catch (error: any) {
        console.error("Error guardando tasa manual:", error);
        return NextResponse.json({ error: "Error al guardar tasa manual" }, { status: 500 });
    }
}
