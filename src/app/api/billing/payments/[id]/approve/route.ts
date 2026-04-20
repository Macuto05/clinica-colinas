
import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma/client";

// @ts-ignore
BigInt.prototype.toJSON = function () { return this.toString() };

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;
        const pagoId = BigInt(id);
        const { usuarioId } = await req.json(); // Admin executing approval

        // Transaction to ensure data integrity
        const result = await prisma.$transaction(async (tx) => {
            // 1. Get Payment
            const pago = await tx.pago.findUnique({
                where: { pagoId },
                include: { factura: true }
            });

            if (!pago) throw new Error("Payment not found");
            if (pago.estadoPago === 'VALIDADO') throw new Error("Payment already validated");

            // 2. Update Payment Status
            const updatedPago = await tx.pago.update({
                where: { pagoId },
                data: {
                    estadoPago: 'VALIDADO',
                    // usuarioValidacion: usuarioId // If we had this field, we'd set it
                }
            });

            // 3. Update Invoice Balance (accounting for insurance coverage)
            const invoiceTotal = Number(pago.factura.total);
            const insuredAmount = Number(pago.factura.montoAsegurado || 0);
            const paymentAmount = Number(pago.monto);

            // Get ALL validated payments for this invoice (already includes the one we just validated above)
            const allValidatedPayments = await tx.pago.findMany({
                where: { facturaId: pago.facturaId, estadoPago: 'VALIDADO' }
            });
            const totalValidatedPayments = allValidatedPayments.reduce((sum, p) => sum + Number(p.monto), 0);

            // New balance = total - insured - all validated payments
            const newBalance = Math.max(0, invoiceTotal - insuredAmount - totalValidatedPayments);

            // Determine new Invoice Status
            let newStatus = pago.factura.estadoFactura;
            if (newBalance <= 0.01) { // Floating point tolerance
                newStatus = 'PAGADA';
            } else {
                newStatus = 'PARCIAL';
            }

            const updatedFactura = await (tx as any).factura.update({
                where: { facturaId: pago.facturaId },
                data: {
                    saldoPendiente: newBalance,
                    estadoFactura: newStatus
                }
            });

            // 4. AUTOMATIC EMERGENCY PROGRESSION
            // If the invoice is fully paid, mark emergency as ATENDIDO and confirm payment verification.
            if (newStatus === 'PAGADA' && updatedFactura.emergenciaId) {
                try {
                    const emergency = await (tx as any).emergencia.findUnique({
                        where: { emergenciaId: updatedFactura.emergenciaId }
                    });
                    if (emergency) {
                        const updateData: any = { verificacionPago: 'CONFIRMADO' };
                        if (emergency.estadoEmergencia === 'ALTA') {
                            updateData.estadoEmergencia = 'ATENDIDO';
                        }
                        await (tx as any).emergencia.update({
                            where: { emergenciaId: emergency.emergenciaId },
                            data: updateData
                        });
                    }
                } catch (e) {
                    console.error("Failed to progress emergency status:", e);
                }
            }

            return { pagoId: updatedPago.pagoId.toString() };
        }, {
            maxWait: 5000, // Wait 5s for a connection
            timeout: 20000 // Allow 20s for the transaction
        });

        return NextResponse.json({ success: true, ...result });

    } catch (error: any) {
        console.error("Payment Approval Error:", error);
        return NextResponse.json({
            error: error.message || "Error approving payment",
            details: error.toString()
        }, { status: 500 });
    }
}
