import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma/client";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const almacenId = searchParams.get("almacenId");
        const search = searchParams.get("search");

        console.log(`[GET /api/inventory/stocks] Searching stocks for Almacen: ${almacenId}, Search: ${search}`);

        const where: any = {};

        if (almacenId) {
            where.almacenId = BigInt(almacenId);
        }

        if (search) {
            where.insumo = {
                OR: [
                    { nombre: { contains: search, mode: 'insensitive' } },
                    { codigo: { contains: search, mode: 'insensitive' } }
                ]
            };
        }

        // Only show items with stock > 0 by default? 
        // Typically for transfers yes.
        where.cantidadActual = { gt: 0 };

        const stocks = await prisma.stock.findMany({
            where,
            include: {
                insumo: {
                    select: {
                        nombre: true,
                        codigo: true,
                        unidadMedida: true,
                        categoria: true
                    }
                }
            },
            take: 20
        });

        console.log(`[GET /api/inventory/stocks] Found ${stocks.length} items`);

        const serialized = JSON.stringify(stocks, (key, value) => {
            if (typeof value === 'bigint') return value.toString();
            if (typeof value === 'object' && value !== null && 's' in value && 'e' in value && 'd' in value) return value.toString(); // Decimal
            return value;
        });

        return new NextResponse(serialized, {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        console.error("Error fetching stocks:", error);
        return NextResponse.json({ error: "Error fetching stocks" }, { status: 500 });
    }
}
