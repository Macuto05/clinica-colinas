import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma/client";

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> } // Params is a Promise in Next 15+
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { nombre, rifNif, telefono, correo, direccion } = body;

        const updated = await prisma.proveedor.update({
            where: { proveedorId: BigInt(id) },
            data: {
                nombre,
                rifNif,
                telefono,
                correo,
                direccion
            }
        });

        const serialized = JSON.stringify(updated, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        );

        return new NextResponse(serialized, { status: 200 });
    } catch (error) {
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
            data: { activo: Boolean(activo) }
        });

        const serialized = JSON.stringify(updated, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        );

        return new NextResponse(serialized, { status: 200 });
    } catch (error) {
        console.error("Error toggling provider status:", error);
        return NextResponse.json({ error: "Error al actualizar estado" }, { status: 500 });
    }
}
