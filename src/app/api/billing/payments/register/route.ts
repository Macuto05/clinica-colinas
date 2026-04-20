
import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma/client";

// @ts-ignore
BigInt.prototype.toJSON = function () { return this.toString() };

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { facturaId, monto, metodoPagoId, referencia, cuentaDestinoId, usuarioId, fechaPago } = body;

        // Validation
        if (!facturaId || !monto || !metodoPagoId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Verify Invoice exists
        const factura = await prisma.factura.findUnique({ where: { facturaId: BigInt(facturaId) } });
        if (!factura) {
            return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
        }

        // Fetch Bank Info if provided
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

        const canalPago = (body.canalPago as string) || 'ONLINE';

        // --- PRESENCIAL (CAJA): Validates immediately and updates invoice balance ---
        if (canalPago === 'PRESENCIAL') {
            const result = await prisma.$transaction(async (tx) => {
                // 1. Create payment as VALIDADO directly
                const pago = await tx.pago.create({
                    data: {
                        facturaId: BigInt(facturaId),
                        monto: parseFloat(monto),
                        montoBs: montoBs,
                        tasaCambio: exchangeRate,
                        fechaPago: fechaPago ? new Date(fechaPago) : new Date(),
                        fechaRegistro: new Date(),
                        estadoPago: 'VALIDADO',
                        canalPago: 'PRESENCIAL',
                        usuarioRegistro: BigInt(usuarioId),
                        metodoPagoId: BigInt(metodoPagoId),
                        referenciaExterna: referencia || null,
                        cuentaBancariaId: cuentaId,
                    }
                });

                // 2. Recalculate invoice balance from all validated payments
                const allValidatedPayments = await tx.pago.findMany({
                    where: { facturaId: BigInt(facturaId), estadoPago: 'VALIDADO' }
                });
                const totalValidated = allValidatedPayments.reduce((sum, p) => sum + Number(p.monto), 0);

                const invoiceTotal = Number(factura.total);
                const insuredAmount = Number((factura as any).montoAsegurado || 0);
                const newBalance = Math.max(0, invoiceTotal - insuredAmount - totalValidated);

                let newStatus: string;
                if (newBalance <= 0.01) {
                    newStatus = 'PAGADA';
                } else {
                    newStatus = 'PARCIAL';
                }

                await (tx as any).factura.update({
                    where: { facturaId: BigInt(facturaId) },
                    data: {
                        saldoPendiente: newBalance,
                        estadoFactura: newStatus,
                    }
                });

                // 3. If fully paid and linked to an emergency in ALTA, mark as ATENDIDO
                if (newStatus === 'PAGADA' && (factura as any).emergenciaId) {
                    try {
                        const emergency = await (tx as any).emergencia.findUnique({
                            where: { emergenciaId: (factura as any).emergenciaId }
                        });
                        if (emergency && emergency.estadoEmergencia === 'ALTA') {
                            await (tx as any).emergencia.update({
                                where: { emergenciaId: emergency.emergenciaId },
                                data: { estadoEmergencia: 'ATENDIDO' }
                            });
                        }
                    } catch (e) {
                        console.error("Failed to progress emergency status:", e);
                    }
                }

                return { pagoId: pago.pagoId.toString() };
            }, {
                maxWait: 5000,
                timeout: 20000
            });

            return NextResponse.json({ success: true, pagoId: result.pagoId });
        }

        // --- ONLINE / SEGURO: Creates as PENDIENTE for manual validation ---
        let paymentData: any = {
            facturaId: BigInt(facturaId),
            monto: parseFloat(monto),
            fechaPago: fechaPago ? new Date(fechaPago) : new Date(),
            estadoPago: 'PENDIENTE',
            canalPago: canalPago,
            usuarioRegistro: BigInt(usuarioId),
            metodoPagoId: BigInt(metodoPagoId)
        };

        if (canalPago === 'SEGURO') {
            paymentData.montoBs = null;
            paymentData.tasaCambio = null;
            paymentData.referenciaExterna = referencia || "SEGURO";
            paymentData.cuentaBancariaId = null;
        } else {
            // ONLINE
            paymentData.montoBs = montoBs;
            paymentData.tasaCambio = exchangeRate;
            paymentData.referenciaExterna = referencia || null;
            paymentData.cuentaBancariaId = cuentaId;
        }

        const pago = await prisma.pago.create({
            data: {
                ...paymentData,
                fechaRegistro: new Date()
            }
        });

        return NextResponse.json({ success: true, pagoId: pago.pagoId.toString() });

    } catch (error: any) {
        console.error("Payment Register Error:", error);
        return NextResponse.json({
            error: error.message || "Error registering payment",
            details: error.toString()
        }, { status: 500 });
    }
}
