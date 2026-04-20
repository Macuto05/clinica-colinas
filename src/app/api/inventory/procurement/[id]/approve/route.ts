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

        // Fetch margin config BEFORE the transaction
        const margenConfig = await prisma.configuracion.findUnique({
            where: { clave: "MARGEN_INSUMOS" }
        });
        const margen = margenConfig ? parseFloat(margenConfig.valor) : 0;

        await prisma.$transaction(async (tx) => {
            for (const detalle of detalles) {
                if (!detalle.detalleId || !detalle.proveedorId) {
                    throw new Error("Cada detalle debe tener detalleId y proveedorId");
                }

                const costoUnitario = detalle.costoUnitario != null
                    ? parseFloat(detalle.costoUnitario)
                    : null;

                // 1. Update detail: provider + cost
                const updatedDetalle = await tx.pedidoCompraDetalle.update({
                    where: { detalleId: BigInt(detalle.detalleId) },
                    data: {
                        proveedorId: BigInt(detalle.proveedorId),
                        ...(costoUnitario !== null && { costoUnitario: costoUnitario })
                    },
                    select: { insumoId: true }
                });

                // 2. If cost provided, recalculate and update precioVenta on the Insumo
                if (costoUnitario !== null && costoUnitario > 0) {
                    const precioVenta = parseFloat(
                        (costoUnitario * (1 + margen / 100)).toFixed(4)
                    );
                    await tx.insumo.update({
                        where: { insumoId: updatedDetalle.insumoId },
                        data: { precioVenta: precioVenta }
                    });
                }
            }

            // 3. Update order header to APROBADO
            await tx.pedidoCompra.update({
                where: { pedidoId: pedidoId },
                data: {
                    estado: 'APROBADO',
                    usuarioAprueba: BigInt(usuarioId),
                    fechaAprobacion: new Date()
                }
            });
        });

        return NextResponse.json({
            success: true,
            message: "Pedido aprobado, proveedores y precios actualizados."
        });

    } catch (error: any) {
        console.error("Error approving order:", error);
        return NextResponse.json(
            { error: error.message || "Error al aprobar pedido" },
            { status: 500 }
        );
    }
}
