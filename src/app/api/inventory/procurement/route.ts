import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma/client";

// Reverted local instance to prevent MaxClients error

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status"); // Filter by state

        const where: any = {};
        if (status) {
            where.estado = status;
        }

        console.log("Fetching procurement orders with status:", status);
        const pedidos = await prisma.pedidoCompra.findMany({
            where,
            include: {
                solicitante: {
                    select: {
                        usuarioId: true,
                        email: true,
                    }
                },
                aprobador: {
                    select: {
                        usuarioId: true,
                        email: true,
                    }
                },
                detalles: {
                    include: {
                        insumo: true
                    }
                }
            },
            orderBy: {
                fechaSolicitud: 'desc'
            }
        });

        console.log(`Found ${pedidos.length} orders.`);

        const serialized = pedidos.map(p => ({
            ...p,
            pedidoId: p.pedidoId.toString(),
            usuarioSolicita: p.usuarioSolicita.toString(),
            usuarioAprueba: p.usuarioAprueba?.toString(),
            detalles: p.detalles.map(d => ({
                ...d,
                detalleId: d.detalleId.toString(),
                pedidoId: d.pedidoId.toString(),
                insumoId: d.insumoId.toString(),
                proveedorId: d.proveedorId?.toString(),
                insumo: {
                    ...d.insumo,
                    insumoId: d.insumo.insumoId.toString()
                }
            })),
            solicitante: {
                ...p.solicitante,
                usuarioId: p.solicitante.usuarioId.toString()
            },
            aprobador: p.aprobador ? {
                ...p.aprobador,
                usuarioId: p.aprobador.usuarioId.toString()
            } : null
        }));

        return NextResponse.json(serialized);

    } catch (error) {
        console.error("Error fetching procurement orders:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { usuarioSolicita, items, observaciones } = body;
        // items: { insumoId: string, cantidad: number }[]

        if (!usuarioSolicita || !items || items.length === 0) {
            return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
        }

        // Debug: Check if model exists
        console.log("Prisma Models Available:", Object.keys(prisma));

        const pedido = await prisma.pedidoCompra.create({
            data: {
                usuarioSolicita: BigInt(usuarioSolicita),
                observaciones,
                estado: "PENDIENTE",
                detalles: {
                    create: items.map((item: any) => ({
                        insumoId: BigInt(item.insumoId),
                        cantidad: item.cantidad
                    }))
                }
            },
            include: {
                detalles: true
            }
        });

        // Manual serialization to avoid BigInt issues (TypeError: Do not know how to serialize a BigInt)
        // We do NOT use ...pedido or ...d here to prevent accidental BigInt leaks
        const serializedResponse = {
            pedidoId: pedido.pedidoId.toString(),
            usuarioSolicita: pedido.usuarioSolicita.toString(), // Required
            fechaSolicitud: pedido.fechaSolicitud,
            estado: pedido.estado,
            observaciones: pedido.observaciones,
            detalles: pedido.detalles.map(d => ({
                detalleId: d.detalleId.toString(),
                pedidoId: d.pedidoId.toString(),
                insumoId: d.insumoId.toString(),
                cantidad: d.cantidad // Decimal behaves well or as string
            }))
        };

        console.log("Pedido created successfully:", serializedResponse);
        return NextResponse.json(serializedResponse);

    } catch (error) {
        console.error("Error creating procurement order:", error);
        return NextResponse.json({
            error: "Internal Server Error",
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}
