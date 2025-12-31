import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma/client";

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { usuarioId, detalles } = body;

        if (!usuarioId || !detalles || !Array.isArray(detalles)) {
            return NextResponse.json(
                { error: "Datos faltantes: usuarioId o detalles" },
                { status: 400 }
            );
        }

        const pedidoId = BigInt(id);

        // Transaction to ensure atomicity
        await prisma.$transaction(async (tx) => {
            // 1. Update Details with Provider
            for (const detalle of detalles) {
                if (!detalle.detalleId || !detalle.proveedorId) {
                    throw new Error("Cada detalle debe tener detalleId y proveedorId");
                }

                await tx.pedidoCompraDetalle.update({
                    where: { detalleId: BigInt(detalle.detalleId) },
                    data: { proveedorId: BigInt(detalle.proveedorId) }
                });
            }

            // 2. Update Header Status
            await tx.pedidoCompra.update({
                where: { pedidoId: pedidoId },
                data: {
                    estado: 'APROBADO',
                    usuarioAprueba: BigInt(usuarioId),
                    fechaAprobacion: new Date()
                }
            });
        });

        return NextResponse.json({ success: true, message: "Pedido aprobado y proveedores asignados." });

    } catch (error: any) {
        console.error("Error approving order:", error);
        return NextResponse.json(
            { error: error.message || "Error al aprobar pedido" },
            { status: 500 }
        );
    }
}
