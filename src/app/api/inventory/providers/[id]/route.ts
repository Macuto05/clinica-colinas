import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma/client";

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { nombre, rifNif, telefono, correo, direccion } = body;

        if (!nombre?.trim() || !rifNif?.trim() || !telefono?.trim() || !correo?.trim() || !direccion?.trim()) {
            return NextResponse.json({ error: "Todos los campos son obligatorios" }, { status: 400 });
        }

        const proveedorIdBig = BigInt(id);

        const [dupNombre, dupRif, dupTelefono, dupCorreo] = await Promise.all([
            prisma.proveedor.findFirst({ where: { nombre: { equals: nombre, mode: "insensitive" }, proveedorId: { not: proveedorIdBig } } }),
            prisma.proveedor.findFirst({ where: { rifNif, proveedorId: { not: proveedorIdBig } } }),
            prisma.proveedor.findFirst({ where: { telefono, proveedorId: { not: proveedorIdBig } } }),
            prisma.proveedor.findFirst({ where: { correo: { equals: correo, mode: "insensitive" }, proveedorId: { not: proveedorIdBig } } }),
        ]);

        if (dupNombre) return NextResponse.json({ error: `Ya existe un proveedor con el nombre "${nombre}".`, field: "nombre" }, { status: 409 });
        if (dupRif) return NextResponse.json({ error: `Ya existe un proveedor con el RIF "${rifNif}".`, field: "rifNif" }, { status: 409 });
        if (dupTelefono) return NextResponse.json({ error: "Ya existe un proveedor registrado con ese teléfono.", field: "telefono" }, { status: 409 });
        if (dupCorreo) return NextResponse.json({ error: `Ya existe un proveedor registrado con el correo "${correo}".`, field: "correo" }, { status: 409 });

        const updated = await prisma.proveedor.update({
            where: { proveedorId: proveedorIdBig },
            data: { nombre, rifNif, telefono, correo, direccion },
        });

        const serialized = JSON.stringify(updated, (key, value) =>
            typeof value === "bigint" ? value.toString() : value
        );

        return new NextResponse(serialized, { status: 200, headers: { "Content-Type": "application/json" } });
    } catch (error) {
        if ((error as any).code === "P2002") {
            return NextResponse.json({ error: "El RIF ya está registrado.", field: "rifNif" }, { status: 409 });
        }
        console.error("Error updating provider:", error);
        return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { activo } = body;

        const updated = await prisma.proveedor.update({
            where: { proveedorId: BigInt(id) },
            data: { activo: Boolean(activo) },
        });

        const serialized = JSON.stringify(updated, (key, value) =>
            typeof value === "bigint" ? value.toString() : value
        );

        return new NextResponse(serialized, { status: 200, headers: { "Content-Type": "application/json" } });
    } catch (error) {
        console.error("Error toggling provider status:", error);
        return NextResponse.json({ error: "Error al actualizar estado" }, { status: 500 });
    }
}
