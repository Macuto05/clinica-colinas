import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma/client";

// @ts-ignore
BigInt.prototype.toJSON = function () { return this.toString() };

/* GET /api/insumos?search=X&almacenId=Y — Insumos con stock > 0 en un almacén */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const search    = searchParams.get("search") || "";
        const almacenId = searchParams.get("almacenId");

        const where: any = {
            activo: true,
        };

        if (search.trim()) {
            where.OR = [
                { nombre: { contains: search, mode: "insensitive" } },
                { codigo: { contains: search, mode: "insensitive" } },
            ];
        }

        // Get insumos that have stock > 0 in the specified almacen
        const stockWhere: any = { cantidadActual: { gt: 0 } };
        if (almacenId) {
            stockWhere.almacenId = BigInt(almacenId);
        }

        const insumos = await (prisma as any).insumo.findMany({
            where: {
                ...where,
                stock: { some: stockWhere },
            },
            include: {
                stock: {
                    where: stockWhere,
                    include: { almacen: { select: { nombre: true } } },
                },
            },
            take: 15,
            orderBy: { nombre: "asc" },
        });

        return NextResponse.json(
            insumos.map((i: any) => ({
                insumoId:    i.insumoId.toString(),
                codigo:      i.codigo,
                nombre:      i.nombre,
                marca:       i.marca,
                unidadMedida: i.unidadMedida,
                categoria:   i.categoria,
                stock: i.stock.map((s: any) => ({
                    almacenId:      s.almacenId.toString(),
                    almacenNombre:  s.almacen.nombre,
                    cantidadActual: parseFloat(s.cantidadActual.toString()),
                })),
                // Convenience: total stock across all almacenes in the query
                stockTotal: i.stock.reduce((acc: number, s: any) => acc + parseFloat(s.cantidadActual.toString()), 0),
            }))
        );
    } catch (error) {
        console.error("Error fetching insumos:", error);
        return NextResponse.json({ error: "Error al cargar insumos" }, { status: 500 });
    }
}
