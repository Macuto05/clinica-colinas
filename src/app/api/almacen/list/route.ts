import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma/client";

// @ts-ignore
BigInt.prototype.toJSON = function () { return this.toString() };

/* GET /api/almacen/list — Lista todos los almacenes activos */
export async function GET(req: NextRequest) {
    try {
        const almacenes = await (prisma as any).almacen.findMany({
            where: { activo: true },
            select: {
                almacenId: true,
                nombre: true,
                descripcion: true,
            },
            orderBy: { nombre: "asc" },
        });

        return NextResponse.json(
            almacenes.map((a: any) => ({
                almacenId: a.almacenId.toString(),
                nombre: a.nombre,
                descripcion: a.descripcion,
            }))
        );
    } catch (error) {
        console.error("Error fetching almacenes:", error);
        return NextResponse.json({ error: "Error al cargar almacenes" }, { status: 500 });
    }
}
