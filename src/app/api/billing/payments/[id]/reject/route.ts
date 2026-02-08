
import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma/client";

// @ts-ignore
BigInt.prototype.toJSON = function () { return this.toString() };

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;
        const pagoId = BigInt(id);
        const { usuarioId, motivo } = await req.json(); // Admin executing rejection + reason

        // Transaction to ensure data integrity
        const result = await prisma.$transaction(async (tx) => {
            // 1. Get Payment
            const pago = await tx.pago.findUnique({
                where: { pagoId },
                include: { factura: true }
            });

            if (!pago) throw new Error("Payment not found");
            if (pago.estadoPago !== 'PENDIENTE') throw new Error("Payment is not pending");

            // 2. Update Payment Status
            const updatedPago = await tx.pago.update({
                where: { pagoId },
                data: {
                    estadoPago: 'RECHAZADO',
                    // We could store rejection reason if we had a field for it, or just logs
                    // notas: motivo // Assuming 'notas' field exists or similar. If not, we skip.
                }
            });

            return { pagoId: updatedPago.pagoId.toString() };
        }, {
            maxWait: 5000,
            timeout: 10000
        });

        return NextResponse.json({ success: true, ...result });

    } catch (error: any) {
        console.error("Payment Rejection Error:", error);
        return NextResponse.json({
            error: error.message || "Error rejecting payment",
            details: error.toString()
        }, { status: 500 });
    }
}
