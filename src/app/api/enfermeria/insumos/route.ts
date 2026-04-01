import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma/client";

// @ts-ignore
BigInt.prototype.toJSON = function () { return this.toString() };

/**
 * GET /api/enfermeria/insumos?q=paracetamol
 * Returns insumos that have stock > 0, optionally filtered by name.
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const q = searchParams.get("q") || "";

        const insumos = await prisma.insumo.findMany({
            where: {
                activo: true,
                ...(q ? { nombre: { contains: q, mode: "insensitive" } } : {}),
                stock: { some: { cantidadActual: { gt: 0 } } },
            },
            include: {
                stock: {
                    select: { cantidadActual: true, almacenId: true },
                },
            },
            take: 30,
            orderBy: { nombre: "asc" },
        });

        const formatted = insumos.map((i: any) => ({
            insumoId:     i.insumoId.toString(),
            codigo:       i.codigo,
            nombre:       i.nombre,
            unidadMedida: i.unidadMedida,
            categoria:    i.categoria,
            stockTotal:   i.stock.reduce((acc: number, s: any) => acc + Number(s.cantidadActual), 0),
        }));

        return NextResponse.json(formatted);
    } catch (error) {
        console.error("Error fetching insumos for enfermeria:", error);
        return NextResponse.json({ error: "Error al cargar insumos" }, { status: 500 });
    }
}
