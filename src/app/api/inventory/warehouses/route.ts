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
                { descripcion: { contains: search, mode: "insensitive" } },
            ],
        };

        if (!showInactive) {
            where.activo = true;
        }

        const almacenes = await prisma.almacen.findMany({
            where,
            orderBy: {
                almacenId: "asc",
            },
            include: {
                stock: {
                    where: { cantidadActual: { gt: 0 } }
                }
            }
        });

        // Serialize BigInt
        const serialized = almacenes.map((almacen: any) => {
            // console.log(`Almacen ${almacen.nombre} stock count: ${almacen.stock?.length}`);
            return {
                almacenId: almacen.almacenId.toString(),
                nombre: almacen.nombre,
                descripcion: almacen.descripcion,
                activo: almacen.activo,
                totalItems: almacen.stock ? almacen.stock.length : 0
            };
        });

        return NextResponse.json(serialized);
    } catch (error) {
        console.error("Error fetching warehouses:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { nombre, descripcion, activo } = body;

        if (!nombre) {
            return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });
        }

        const newAlmacen = await prisma.almacen.create({
            data: {
                nombre,
                descripcion,
                activo: activo ?? true,
            },
        });

        return NextResponse.json({
            ...newAlmacen,
            almacenId: newAlmacen.almacenId.toString(),
        });
    } catch (error) {
        if ((error as any).code === 'P2002') {
            return NextResponse.json({ error: "Ya existe un almacén con este nombre." }, { status: 409 });
        }
        console.error("Error creating warehouse:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { almacenId, nombre, descripcion, activo } = body;

        if (!almacenId) {
            return NextResponse.json({ error: "Missing almacenId" }, { status: 400 });
        }

        const updated = await prisma.almacen.update({
            where: { almacenId: BigInt(almacenId) },
            data: {
                nombre,
                descripcion,
                activo,
            },
        });

        return NextResponse.json({
            ...updated,
            almacenId: updated.almacenId.toString(),
        });
    } catch (error) {
        if ((error as any).code === 'P2002') {
            return NextResponse.json({ error: "Ya existe un almacén con este nombre." }, { status: 409 });
        }
        console.error("Error updating warehouse:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
