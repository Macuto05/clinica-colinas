import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma/client";
import { JWTService } from "@/infrastructure/services/JWTService";

// @ts-ignore
BigInt.prototype.toJSON = function () { return this.toString() };

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const token = req.cookies.get("auth-token")?.value;
        if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        const payload = await JWTService.verifyToken(token);
        if (!payload) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

        const rawUserId = payload.userId ?? payload.sub;
        if (!rawUserId) return NextResponse.json({ error: "Token inválido: sin userId" }, { status: 401 });
        const usuarioId = BigInt(rawUserId);
        const { id } = await params;
        const facturaId = BigInt(id);

        // Fetch exchange rate and first bank account outside transaction (read-only)
        const [tasaRecord, primeraCuenta] = await Promise.all([
            (prisma as any).tasaDeCambio.findFirst({
                orderBy: { fecha: 'desc' }
            }),
            (prisma as any).cuentaBancaria.findFirst({
                where: { activa: true },
                orderBy: { cuentaId: 'asc' }
            })
        ]);
        const tasaActual = tasaRecord ? Number(tasaRecord.valor) : 0;

        if (tasaActual <= 0) {
            return NextResponse.json(
                { error: "No hay tasa de cambio registrada. Configúrala en Caja → Configuración antes de procesar el seguro." },
                { status: 400 }
            );
        }
        if (!primeraCuenta) {
            return NextResponse.json(
                { error: "No hay cuentas bancarias activas registradas. Configúralas en Caja → Configuración antes de procesar el seguro." },
                { status: 400 }
            );
        }

        const result = await (prisma as any).$transaction(async (tx: any) => {
            // 1. Get invoice with emergency and carta aval
            const factura = await tx.factura.findUnique({
                where: { facturaId },
                include: {
                    emergencia: {
                        include: {
                            cartasAval: {
                                where: { estado: 'APROBADA' },
                                include: { poliza: { select: { montoCobertura: true, numeroPoliza: true } } },
                                orderBy: { fechaSolicitud: 'desc' },
                                take: 1
                            }
                        }
                    }
                }
            });

            if (!factura) throw new Error("Factura no encontrada");
            if (!factura.emergenciaId) throw new Error("Solo aplica para facturas de emergencia");
            if (!['PENDIENTE', 'PARCIAL'].includes(factura.estadoFactura)) {
                throw new Error("La factura debe estar en estado PENDIENTE o PARCIAL");
            }

            const cartaAval = factura.emergencia?.cartasAval?.[0];
            if (!cartaAval) throw new Error("No existe una Carta Aval APROBADA para esta emergencia");

            const limiteCobertura = Number(cartaAval.poliza?.montoCobertura ?? 0);
            if (limiteCobertura <= 0) throw new Error("El plan de cobertura no tiene monto definido");

            const saldoPendiente = Number(factura.saldoPendiente);
            const montoPago = Math.min(limiteCobertura, saldoPendiente);
            const saldoRestante = Math.max(0, saldoPendiente - montoPago);
            const nuevoEstado = saldoRestante <= 0.001 ? 'PAGADA' : 'PARCIAL';

            // 2. Create insurance payment record (already validated — no manual verification needed)
            // Ensure "SEGURO" payment method exists
            const metodoPagoSeguro = await tx.metodoPago.upsert({
                where: { nombre: 'SEGURO' },
                update: {},
                create: { nombre: 'SEGURO', descripcion: 'Pago cubierto por aseguradora vía Carta Aval' }
            });

            const montoBs = tasaActual > 0 ? montoPago * tasaActual : null;

            await tx.pago.create({
                data: {
                    facturaId,
                    usuarioRegistro: usuarioId,
                    monto: montoPago,
                    montoBs: montoBs,
                    tasaCambio: tasaActual > 0 ? tasaActual : null,
                    estadoPago: 'VALIDADO',
                    canalPago: 'SEGURO',
                    metodoPagoId: metodoPagoSeguro.metodoPagoId,
                    referenciaExterna: cartaAval.codigoAval || `AVAL-${cartaAval.cartaAvalId}`,
                    fechaPago: new Date(),
                    ...(primeraCuenta ? { cuentaBancariaId: primeraCuenta.cuentaId } : {})
                }
            });

            // 3. Update invoice balance, insurance amount, and status
            await tx.factura.update({
                where: { facturaId },
                data: {
                    montoAsegurado: montoPago,
                    saldoPendiente: saldoRestante,
                    estadoFactura: nuevoEstado,
                }
            });

            // 4. If fully paid, mark emergency as ATENDIDO + confirm payment verification
            if (nuevoEstado === 'PAGADA' && factura.emergenciaId) {
                await tx.emergencia.update({
                    where: { emergenciaId: factura.emergenciaId },
                    data: { estadoEmergencia: 'ATENDIDO', tipoPago: 'ASEGURADO', verificacionPago: 'CONFIRMADO' }
                });
            } else if (factura.emergenciaId) {
                await tx.emergencia.update({
                    where: { emergenciaId: factura.emergenciaId },
                    data: { tipoPago: 'ASEGURADO' }
                });
            }

            return { montoPago, saldoRestante, nuevoEstado };
        });

        const msg = result.nuevoEstado === 'PAGADA'
            ? `Cobertura aplicada: $${result.montoPago.toFixed(2)} — Factura pagada en su totalidad.`
            : `Cobertura aplicada: $${result.montoPago.toFixed(2)} — Saldo restante $${result.saldoRestante.toFixed(2)} queda a cargo del paciente.`;

        return NextResponse.json({ success: true, ...result, message: msg });

    } catch (error: any) {
        console.error("Error en pago por seguro:", error);
        return NextResponse.json({ error: error.message || "Error interno" }, { status: 500 });
    }
}
