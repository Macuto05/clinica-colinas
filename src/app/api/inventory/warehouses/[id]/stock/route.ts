import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma/client";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        console.log("Fetching stock for warehouse ID:", id); // DEBUG

        if (!id) {
            return NextResponse.json({ error: "Missing warehouse ID" }, { status: 400 });
        }

        const stocks = await prisma.stock.findMany({
            where: {
                almacenId: BigInt(id),
                // Removed gt: 0 check to debug if it's a filtering issue.
                // If the user wants to see ONLY available stock, we should probably add back gt: 0 or gte: 0.
                // But for now, let's see EVERYTHING.
            },
            include: {
                insumo: true
            },
            orderBy: {
                insumo: {
                    nombre: 'asc'
                }
            }
        });

        console.log("Stocks found:", stocks.length); // DEBUG

        // Format the response
        const formattedStock = stocks.map(item => ({
            insumoId: item.insumoId.toString(),
            codigo: item.insumo.codigo,
            nombre: item.insumo.nombre,
            marca: item.insumo.marca,
            categoria: item.insumo.categoria,
            unidadMedida: item.insumo.unidadMedida,
            cantidad: Number(item.cantidadActual), // Decimal to Number
            stockId: item.stockId.toString()
        }));

        return NextResponse.json(formattedStock);

    } catch (error) {
        console.error("Error fetching warehouse stock:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
