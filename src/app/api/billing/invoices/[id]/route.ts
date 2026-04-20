import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma/client";

// @ts-ignore
BigInt.prototype.toJSON = function () { return this.toString() };

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const factId = BigInt(id);

        const factura = await (prisma as any).factura.findUnique({
            where: { facturaId: factId },
            include: {
                detalles: true,
                paciente: true,
                emergencia: {
                    include: {
                        medico: {
                            include: { empleado: true, especialidad: true }
                        }
                    }
                },
                cita: {
                    include: {
                        medico: {
                            include: { empleado: true }
                        }
                    }
                }
            }
        });

        if (!factura) return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 });

        // Auto-generate invoice number for cita invoices that don't have one yet
        if (!factura.numeroFactura && factura.citaId) {
            const now = new Date();
            const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
            const existingCount = await (prisma as any).factura.count({
                where: { numeroFactura: { startsWith: `FCT-CIT-${yearMonth}` } }
            });
            const newNumber = `FCT-CIT-${yearMonth}-${String(existingCount + 1).padStart(4, '0')}`;
            await (prisma as any).factura.update({
                where: { facturaId: factId },
                data: { numeroFactura: newNumber }
            });
            factura.numeroFactura = newNumber;
        }

        return NextResponse.json(JSON.parse(JSON.stringify(factura)));
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Error al obtener factura" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await req.json();
        const factId = BigInt(id);

        const { detalles, subtotal, total, saldoPendiente, observaciones } = body;

        // Sync with CargoCuentaPaciente if items are removed/added?
        // For now, let's just update the Factura and its details.
        
        await (prisma as any).$transaction(async (tx: any) => {
            // 1. Delete current details
            await tx.facturaDetalle.deleteMany({
                where: { facturaId: factId }
            });

            // 2. Insert new details
            await tx.facturaDetalle.createMany({
                data: detalles.map((d: any) => ({
                    facturaId: factId,
                    tipoItem: d.tipoItem,
                    descripcion: d.descripcion,
                    cantidad: d.cantidad,
                    precioUnitario: d.precioUnitario,
                    importe: d.importe,
                    referenciaId: d.referenciaId ? BigInt(d.referenciaId) : null
                }))
            });

            // 3. Update Factura totals
            await tx.factura.update({
                where: { facturaId: factId },
                data: {
                    subtotal,
                    total,
                    saldoPendiente,
                    observaciones
                }
            });
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Error al actualizar factura" }, { status: 500 });
    }
}
