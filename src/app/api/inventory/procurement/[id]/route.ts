import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma/client";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: idStr } = await params;
        const id = BigInt(idStr);
        const pedido = await prisma.pedidoCompra.findUnique({
            where: { pedidoId: id },
            include: {
                detalles: {
                    include: { insumo: true }
                },
                solicitante: true,
                aprobador: true
            }
        });

        if (!pedido) {
            return NextResponse.json({ error: "Pedido not found" }, { status: 404 });
        }

        const serialized = {
            ...pedido,
            pedidoId: pedido.pedidoId.toString(),
            usuarioSolicita: pedido.usuarioSolicita.toString(),
            usuarioAprueba: pedido.usuarioAprueba?.toString(),
            detalles: pedido.detalles.map((d: any) => ({
                ...d,
                detalleId: d.detalleId.toString(),
                pedidoId: d.pedidoId.toString(),
                insumoId: d.insumoId.toString(),
                insumo: {
                    ...d.insumo,
                    insumoId: d.insumo.insumoId.toString()
                }
            })),
            solicitante: {
                ...pedido.solicitante,
                usuarioId: pedido.solicitante.usuarioId.toString()
            },
            aprobador: pedido.aprobador ? {
                ...pedido.aprobador,
                usuarioId: pedido.aprobador.usuarioId.toString()
            } : null
        };

        return NextResponse.json(serialized);
    } catch (error) {
        console.error("Error fetching pedido:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: idStr } = await params;
        const id = BigInt(idStr);
        const body = await request.json();
        const { estado, usuarioAprueba, observaciones } = body;

        // Valid transitions
        if (!["APROBADO", "RECHAZADO"].includes(estado)) {
            return NextResponse.json({ error: "Invalid status" }, { status: 400 });
        }

        const updated = await prisma.pedidoCompra.update({
            where: { pedidoId: id },
            data: {
                estado,
                usuarioAprueba: usuarioAprueba ? BigInt(usuarioAprueba) : undefined,
                fechaAprobacion: new Date(),
                // Append observations if provided
                observaciones: observaciones
            }
        });

        return new NextResponse(JSON.stringify(updated, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error: any) {
        console.error("Error updating pedido status:", error);
        return NextResponse.json({
            error: error.message || "Internal Server Error",
            stack: error.stack
        }, { status: 500 });
    }
}
