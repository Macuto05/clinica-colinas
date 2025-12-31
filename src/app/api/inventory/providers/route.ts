import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma/client";

export async function GET(request: Request) {
    const url = new URL(request.url);
    const activeParam = url.searchParams.get("active");

    // Default to true unless 'all' is specified, or specific state requested
    const whereClause: any = {};
    if (activeParam !== "all") {
        whereClause.activo = activeParam === "false" ? false : true;
    }

    try {
        const suppliers = await prisma.proveedor.findMany({
            where: whereClause,
            orderBy: { nombre: 'asc' }
        });

        // Convert BigInt to string for JSON
        const serialized = JSON.stringify(suppliers, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        );

        return new NextResponse(serialized, {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });
    } catch (error) {
        console.error("Error fetching suppliers:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { nombre, rifNif, telefono, correo, direccion } = body;

        if (!nombre) {
            return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });
        }

        const newSupplier = await prisma.proveedor.create({
            data: {
                nombre,
                rifNif,
                telefono,
                correo,
                direccion,
                activo: true
            }
        });

        const serialized = JSON.stringify(newSupplier, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        );

        return new NextResponse(serialized, { status: 201 });

    } catch (error) {
        console.error("Error creating supplier:", error);
        return NextResponse.json({ error: "Error al crear proveedor" }, { status: 500 });
    }
}
