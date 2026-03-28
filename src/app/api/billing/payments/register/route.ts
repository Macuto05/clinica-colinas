
import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma/client";

// @ts-ignore
BigInt.prototype.toJSON = function () { return this.toString() };

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { facturaId, monto, metodoPagoId, referencia, bancoOrigen, cuentaDestinoId, usuarioId, fechaPago } = body;

        // Validation
        if (!facturaId || !monto || !metodoPagoId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Verify Invoice exists
        const factura = await prisma.factura.findUnique({ where: { facturaId: BigInt(facturaId) } });
        if (!factura) {
            return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
        }

        // Fetch Bank Info if provided (to validate existence)
        let cuentaId: number | null = null;
        if (cuentaDestinoId) {
            cuentaId = parseInt(cuentaDestinoId);
        }

        // Fetch Exchange Rate
        const tasa = await prisma.tasaDeCambio.findFirst({
            orderBy: { fecha: 'desc' }
        });
        const exchangeRate = tasa ? Number(tasa.valor) : 0;
        const montoBs = exchangeRate > 0 ? parseFloat(monto) * exchangeRate : 0;

        // Create Payment (Pending Verification)
        // Conditional data based on Channel
        let paymentData: any = {
            facturaId: BigInt(facturaId),
            monto: parseFloat(monto),
            fechaPago: fechaPago ? new Date(fechaPago) : new Date(),
            estadoPago: 'PENDIENTE',
            canalPago: (body.canalPago as any) || 'ONLINE',
            usuarioRegistro: BigInt(usuarioId), // Correct user ID
            metodoPagoId: BigInt(metodoPagoId) // Schema requires a value
        };

        if (paymentData.canalPago === 'PRESENCIAL') {
            paymentData.montoBs = null;
            paymentData.tasaCambio = null;
            paymentData.referenciaExterna = "PRESENCIAL";
            paymentData.cuentaBancariaId = null;
        } else if (paymentData.canalPago === 'SEGURO') {
            // Insurance payment: no exchange rate, no bank account
            paymentData.montoBs = null;
            paymentData.tasaCambio = null;
            paymentData.referenciaExterna = referencia || "SEGURO"; // Carta aval code
            paymentData.cuentaBancariaId = null;
        } else {
            // ONLINE Calculation
            paymentData.montoBs = montoBs;
            paymentData.tasaCambio = exchangeRate;
            paymentData.referenciaExterna = referencia || null;
            paymentData.cuentaBancariaId = cuentaId;
        }

        const pago = await prisma.pago.create({
            data: {
                ...paymentData,
                // Store System Date shifted to Venezuela Time (UTC-4) 
                // to prevent "Next Day" issues in raw DB view during late night.
                fechaRegistro: new Date()
            }
        });

        // Simple response to avoid serialization issues
        return NextResponse.json({ success: true, pagoId: pago.pagoId.toString() });

    } catch (error: any) {
        console.error("Payment Register Error:", error);
        return NextResponse.json({
            error: error.message || "Error registering payment",
            details: error.toString()
        }, { status: 500 });
    }
}
