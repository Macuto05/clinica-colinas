import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma/client";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get("search") || "";
        const showInactive = searchParams.get("showInactive") === "true";

        const where: any = {
            OR: [
                { nombre: { contains: search, mode: "insensitive" } },
                { codigo: { contains: search, mode: "insensitive" } },
            ],
        };

        if (!showInactive) {
            where.activo = true;
        }

        const insumos = await prisma.insumo.findMany({
            where,
            include: {
                stock: {
                    select: {
                        cantidadActual: true,
                    },
                },
            },
            orderBy: {
                insumoId: "asc",
            },
        });

        const formattedInsumos = insumos.map((insumo) => {
            const totalStock = insumo.stock.reduce((acc, s) => acc + Number(s.cantidadActual), 0);
            return {
                ...insumo,
                insumoId: insumo.insumoId.toString(), // BigInt serialization
                totalStock,
            };
        });

        return NextResponse.json(formattedInsumos);
    } catch (error) {
        console.error("Error fetching supplies:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { codigo, nombre, descripcion, unidadMedida, categoria, marca } = body;

        // Basic validation
        if (!codigo || !nombre || !unidadMedida || !categoria) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const duplicateCodigo = await prisma.insumo.findFirst({ where: { codigo } });
        if (duplicateCodigo) {
            return NextResponse.json({ error: `Ya existe un insumo con el código "${codigo}". Usa un código diferente.` }, { status: 409 });
        }

        const newInsumo = await prisma.insumo.create({
            data: {
                codigo,
                nombre,
                descripcion,
                unidadMedida,
                categoria,
                marca: marca || "Genérico",
                activo: true,
            },
        });

        return NextResponse.json({
            ...newInsumo,
            insumoId: newInsumo.insumoId.toString(),
        });
    } catch (error) {
        // Handle unique constraint violations
        if ((error as any).code === 'P2002') {
            return NextResponse.json({ error: "El código ya existe." }, { status: 409 });
        }
        console.error("Error creating supply:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { insumoId, codigo, nombre, descripcion, unidadMedida, categoria, marca, activo } = body;

        if (!insumoId) {
            return NextResponse.json({ error: "Missing insumoId" }, { status: 400 });
        }

        if (codigo) {
            const duplicateCodigo = await prisma.insumo.findFirst({
                where: { codigo, insumoId: { not: BigInt(insumoId) } },
            });
            if (duplicateCodigo) {
                return NextResponse.json({ error: `Ya existe otro insumo con el código "${codigo}". Usa un código diferente.` }, { status: 409 });
            }
        }

        const updatedInsumo = await prisma.insumo.update({
            where: { insumoId: BigInt(insumoId) },
            data: {
                codigo,
                nombre,
                descripcion,
                unidadMedida,
                categoria,
                marca: marca || "Genérico",
                activo: activo,
            },
        });

        return NextResponse.json({
            ...updatedInsumo,
            insumoId: updatedInsumo.insumoId.toString(),
        });
    } catch (error) {
        if ((error as any).code === 'P2002') {
            return NextResponse.json({ error: "El código ya existe." }, { status: 409 });
        }
        console.error("Error updating supply:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
