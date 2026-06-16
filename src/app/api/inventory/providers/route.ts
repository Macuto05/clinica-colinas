import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma/client";

export async function GET(request: Request) {
    const url = new URL(request.url);
    const activeParam = url.searchParams.get("active");

    const whereClause: any = {};
    if (activeParam !== "all") {
        whereClause.activo = activeParam === "false" ? false : true;
    }

    try {
        const suppliers = await prisma.proveedor.findMany({
            where: whereClause,
            orderBy: { nombre: "asc" },
        });

        const serialized = JSON.stringify(suppliers, (key, value) =>
            typeof value === "bigint" ? value.toString() : value
        );

        return new NextResponse(serialized, { status: 200, headers: { "Content-Type": "application/json" } });
    } catch (error) {
        console.error("Error fetching suppliers:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { nombre, rifNif, telefono, correo, direccion } = body;

        if (!nombre?.trim() || !rifNif?.trim() || !telefono?.trim() || !correo?.trim() || !direccion?.trim()) {
            return NextResponse.json({ error: "Todos los campos son obligatorios" }, { status: 400 });
        }

        const [dupNombre, dupRif, dupTelefono, dupCorreo] = await Promise.all([
            prisma.proveedor.findFirst({ where: { nombre: { equals: nombre, mode: "insensitive" } } }),
            prisma.proveedor.findFirst({ where: { rifNif } }),
            prisma.proveedor.findFirst({ where: { telefono } }),
            prisma.proveedor.findFirst({ where: { correo: { equals: correo, mode: "insensitive" } } }),
        ]);

        if (dupNombre) return NextResponse.json({ error: `Ya existe un proveedor con el nombre "${nombre}".`, field: "nombre" }, { status: 409 });
        if (dupRif) return NextResponse.json({ error: `Ya existe un proveedor con el RIF "${rifNif}".`, field: "rifNif" }, { status: 409 });
        if (dupTelefono) return NextResponse.json({ error: "Ya existe un proveedor registrado con ese teléfono.", field: "telefono" }, { status: 409 });
        if (dupCorreo) return NextResponse.json({ error: `Ya existe un proveedor registrado con el correo "${correo}".`, field: "correo" }, { status: 409 });

        const newSupplier = await prisma.proveedor.create({
            data: { nombre, rifNif, telefono, correo, direccion, activo: true },
        });

        const serialized = JSON.stringify(newSupplier, (key, value) =>
            typeof value === "bigint" ? value.toString() : value
        );

        return new NextResponse(serialized, { status: 201, headers: { "Content-Type": "application/json" } });
    } catch (error) {
        if ((error as any).code === "P2002") {
            return NextResponse.json({ error: "El RIF ya está registrado.", field: "rifNif" }, { status: 409 });
        }
        console.error("Error creating supplier:", error);
        return NextResponse.json({ error: "Error al crear proveedor" }, { status: 500 });
    }
}
