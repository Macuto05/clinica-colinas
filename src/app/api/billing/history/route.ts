import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma/client";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const patientId = searchParams.get('patientId');

        if (!patientId) {
            return NextResponse.json({ error: "Missing patientId" }, { status: 400 });
        }

        const idBigInt = BigInt(patientId);

        // 1. Fetch Payments (Money out of pocket) â€” use direct pacienteId
        const pagos = await prisma.pago.findMany({
            where: {
                factura: { pacienteId: idBigInt }
            },
            include: {
                metodoPago: true,
                cuentaBancaria: true,
                factura: {
                    include: {
                        emergencia: {
                            select: {
                                medico: { include: { empleado: true } }
                            }
                        },
                        cita: {
                            include: {
                                medico: { include: { empleado: true } }
                            }
                        }
                    }
                }
            },
            orderBy: { fechaPago: 'desc' }
        });

        // 2. Fetch ALL Invoices â€” use direct pacienteId
        const facturasRaw = await prisma.factura.findMany({
            where: { pacienteId: idBigInt },
            include: {
                emergencia: {
                    select: {
                        medico: { include: { empleado: true } }
                    }
                },
                cita: {
                    include: {
                        medico: { include: { empleado: true } }
                    }
                },
                pagos: true
            },
            orderBy: { fechaEmision: 'desc' }
        });

        // 3. Filter In Memory
        const facturas = facturasRaw.filter(f => {
            if (['PENDIENTE', 'PARCIAL', 'ANULADA'].includes(f.estadoFactura)) return true;
            if (f.estadoFactura === 'PAGADA' && f.pagos.length === 0) return true;
            return false;
        });

        // 4. Get Exchange Rate
        const tasa = await prisma.tasaDeCambio.findFirst({ orderBy: { fecha: 'desc' } });
        const valorTasa = tasa ? Number(tasa.valor) : 0;

        // 5. Map to Split Structure
        const payments = [];
        const debts = [];

        const formatDestination = (p: any) => {
            if (p.cuentaBancaria) {
                const num = p.cuentaBancaria.numeroCuenta;
                const last4 = num ? num.slice(-4) : '';
                return `${p.cuentaBancaria.banco} (${last4})`;
            }
            if (p.canalPago === 'SEGURO') return 'Aseguradora';
            return '-';
        };

        // Uses emergencia or cita to determine concept
        const formatConcept = (factura: any) => {
            const isEmergency = !!factura.emergenciaId;
            const prefix = isEmergency ? 'Emergencia' : 'Consulta';
            const doctor = isEmergency
                ? factura.emergencia?.medico?.empleado
                : factura.cita?.medico?.empleado;
            if (doctor) {
                return `${prefix} - ${doctor.nombres} ${doctor.apellidos}`;
            }
            return isEmergency ? 'AtenciÃ³n de Emergencia' : 'Consulta MÃ©dica';
        };

        // Map Payments
        for (const p of pagos) {
            payments.push({
                id: `PAY-${p.pagoId}`,
                pagoId: p.pagoId.toString(),
                facturaId: p.facturaId.toString(),
                type: 'PAYMENT',
                date: p.fechaPago,
                concept: formatConcept(p.factura),
                method: p.metodoPago?.nombre || 'OTRO',
                destination: formatDestination(p),
                reference: p.referenciaExterna || '-',
                amountUsd: Number(p.monto),
                amountBs: Number(p.montoBs || 0),
                status: p.estadoPago,
                rawDate: p.fechaPago
            });
        }

        // Map Invoices (Debts)
        for (const f of facturas) {
            // Legacy Paid (Virtual Payment Record)
            if (f.estadoFactura === 'PAGADA') {
                payments.push({
                    id: `LEGACY-${f.facturaId}`,
                    pagoId: `LEGACY`,
                    facturaId: f.facturaId.toString(),
                    type: 'PAYMENT',
                    date: f.fechaEmision,
                    concept: formatConcept(f),
                    method: 'HISTÃ“RICO',
                    destination: '-',
                    reference: '-',
                    amountUsd: Number(f.total),
                    amountBs: Number(f.total) * valorTasa,
                    status: 'VALIDADO',
                    rawDate: f.fechaEmision
                });
                continue;
            }

            const amountTotal   = Number(f.total);
            const amountPending = f.estadoFactura === 'ANULADA' ? 0 : Number(f.saldoPendiente);

            debts.push({
                id: `INV-${f.facturaId}`,
                facturaId: f.facturaId.toString(),
                numeroFactura: f.numeroFactura || '-',
                type: 'DEBT',
                date: f.fechaEmision,
                concept: formatConcept(f),
                amountTotal,
                amountPending,
                amountInsured: Number((f as any).montoAsegurado || 0),
                status: f.estadoFactura,
                rawDate: f.fechaEmision
            });
        }

        payments.sort((a, b) => {
            const idA = a.pagoId === 'LEGACY' ? 0 : Number(a.pagoId);
            const idB = b.pagoId === 'LEGACY' ? 0 : Number(b.pagoId);
            return idB - idA;
        });

        debts.sort((a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime());

        // 6. Summaries
        const totalPagado = payments
            .filter(p => p.status === 'VALIDADO')
            .reduce((sum, p) => sum + p.amountUsd, 0);

        const totalPendiente = debts
            .filter(d => d.status === 'PENDIENTE' || d.status === 'PARCIAL')
            .reduce((sum, d) => sum + d.amountPending, 0);

        const safeResponse = JSON.parse(JSON.stringify({
            summary: { totalPagado, totalPendiente },
            debts,
            payments
        }, (key, value) => typeof value === 'bigint' ? value.toString() : value));

        return NextResponse.json(safeResponse);

    } catch (error: any) {
        console.error("Error fetching history:", error);
        return NextResponse.json({
            error: "Error interno",
            details: error.message,
        }, { status: 500 });
    }
}
