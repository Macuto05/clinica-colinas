
import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma/client";

// @ts-ignore
BigInt.prototype.toJSON = function () { return this.toString() };

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;
        const pagoId = BigInt(id);
        const body = await req.json();

        // Destructure fields to populate
        const {
            metodoPagoId,
            montoBs,
            tasaCambio,
            referencia,
            cuentaDestinoId,
            usuarioId
        } = body;

        if (!metodoPagoId) {
            return NextResponse.json({ error: "Método de pago es requerido para completar" }, { status: 400 });
        }

        // Transaction
        const result = await prisma.$transaction(async (tx) => {
            // 1. Get Payment
            const pago = await tx.pago.findUnique({
                where: { pagoId },
                include: { factura: true }
            });

            if (!pago) throw new Error("Payment not found");
            if (pago.estadoPago === 'VALIDADO') throw new Error("Payment already validated");
            if (pago.canalPago !== 'PRESENCIAL') {
                // Technically we could allow updating Online payments too, but this is for Presencial completion
                // We'll proceed regardless, but usually this is for Presencial.
            }

            // 2. Update Payment Details & Validate
            const updatedPago = await tx.pago.update({
                where: { pagoId },
                data: {
                    metodoPagoId: BigInt(metodoPagoId),
                    montoBs: montoBs || null,
                    tasaCambio: tasaCambio || null,
                    referenciaExterna: referencia || null,
                    cuentaBancariaId: cuentaDestinoId ? parseInt(cuentaDestinoId) : null,
                    estadoPago: 'VALIDADO', // VALIDATE immediately
                    fechaPago: new Date(), // Update date to NOW as payment is being completed
                    // usuarioValidacion: BigInt(usuarioId) // Only if schema has this
                }
            });

            // 3. Update Invoice Balance (Same logic as approve)
            const currentBalance = Number(pago.factura.saldoPendiente);
            const paymentAmount = Number(pago.monto);
            const newBalance = currentBalance - paymentAmount;

            let newStatus = pago.factura.estadoFactura;
            if (newBalance <= 0.01) {
                newStatus = 'PAGADA';
            } else {
                newStatus = 'PARCIAL';
            }

            await tx.factura.update({
                where: { facturaId: pago.facturaId },
                data: {
                    saldoPendiente: newBalance,
                    estadoFactura: newStatus
                }
            });

            return { pagoId: updatedPago.pagoId.toString() };
        }, { timeout: 10000 });

        return NextResponse.json({ success: true, ...result });

    } catch (error: any) {
        console.error("Payment Completion Error:", error);
        return NextResponse.json({
            error: error.message || "Error completing payment",
            details: error.toString()
        }, { status: 500 });
    }
}
