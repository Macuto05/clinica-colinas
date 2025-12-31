import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma/client";

export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        console.log("PATCH stock/minimo body:", body); // Debug log

        const { insumoId, almacenId, stockMinimo } = body;

        // Validation
        if (!insumoId || !almacenId || stockMinimo === undefined || stockMinimo === null) {
            console.error("Missing data:", { insumoId, almacenId, stockMinimo });
            return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
        }

        const minVal = Number(stockMinimo);
        if (isNaN(minVal)) {
            console.error("Invalid number for stockMinimo:", stockMinimo);
            return NextResponse.json({ error: "Valor no numérico" }, { status: 400 });
        }

        // Upsert ensures that if stock record doesn't exist (e.g. newly created wh), it gets created
        const stock = await prisma.stock.upsert({
            where: {
                uq_stock: {
                    insumoId: BigInt(insumoId),
                    almacenId: BigInt(almacenId)
                }
            },
            update: {
                stockMinimo: minVal
            },
            create: {
                insumoId: BigInt(insumoId),
                almacenId: BigInt(almacenId),
                cantidadActual: 0,
                stockMinimo: minVal
            }
        });

        console.log("Updated stock:", stock);

        return NextResponse.json({
            success: true,
            stockMinimo: Number(stock.stockMinimo) // Ensure primitive number return
        });

    } catch (error) {
        console.error("Error updating stock min:", error);
        return NextResponse.json({ error: "Error interno al guardar" }, { status: 500 });
    }
}
