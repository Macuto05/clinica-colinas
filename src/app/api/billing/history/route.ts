
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

        // 1. Fetch Payments (Money out of pocket)
        const pagos = await prisma.pago.findMany({
            where: {
                factura: {
                    cita: { pacienteId: idBigInt }
                }
            },
            include: {
                metodoPago: true,
                cuentaBancaria: true,
                factura: {
                    include: {
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

        // 2. Fetch ALL Invoices
        const facturasRaw = await prisma.factura.findMany({
            where: {
                cita: { pacienteId: idBigInt }
            },
            include: {
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

        // Helper to format Bank Destination
        const formatDestination = (p: any) => {
            if (p.cuentaBancaria) {
                const num = p.cuentaBancaria.numeroCuenta;
                const last4 = num ? num.slice(-4) : '';
                return `${p.cuentaBancaria.banco} (${last4})`;
            }
            return '-';
        };

        // Helper to format Concept
        const formatConcept = (cita: any) => {
            if (cita && cita.medico && cita.medico.empleado) {
                return `Consulta - ${cita.medico.empleado.nombres} ${cita.medico.empleado.apellidos}`;
            }
            return 'Consulta Médica';
        };

        // Map Payments
        for (const p of pagos) {
            payments.push({
                id: `PAY-${p.pagoId}`,
                pagoId: p.pagoId.toString(),
                facturaId: p.facturaId.toString(),
                type: 'PAYMENT',
                date: p.fechaPago,
                concept: formatConcept(p.factura?.cita),
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
                    concept: formatConcept(f.cita),
                    method: 'HISTÓRICO',
                    destination: '-',
                    reference: '-',
                    amountUsd: Number(f.total),
                    amountBs: Number(f.total) * valorTasa,
                    status: 'VALIDADO',
                    rawDate: f.fechaEmision
                });
                continue;
            }

            // 2. Map All Invoices to Debts (History of Invoices)
            // Includes Pending, Partial, Paid, and Annulled
            const amountTotal = Number(f.total);
            const amountPending = f.estadoFactura === 'ANULADA' ? 0 : Number(f.saldoPendiente);

            debts.push({
                id: `INV-${f.facturaId}`,
                facturaId: f.facturaId.toString(),
                numeroFactura: f.numeroFactura || '-',
                type: 'DEBT',
                date: f.fechaEmision,
                concept: formatConcept(f.cita),
                amountTotal: amountTotal,
                amountPending: amountPending, // 0 if Paid/Annulled
                amountInsured: Number((f as any).montoAsegurado || 0),
                status: f.estadoFactura,
                rawDate: f.fechaEmision
            });
        }

        // Sort both arrays
        // Payments: Sort by ID numeric descending
        payments.sort((a, b) => {
            const idA = a.pagoId === 'LEGACY' ? 0 : Number(a.pagoId);
            const idB = b.pagoId === 'LEGACY' ? 0 : Number(b.pagoId);
            return idB - idA;
        });

        // Debts: Maintain Date Descending (or Invoice ID Descending)
        debts.sort((a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime());

        // 6. Summaries
        const totalPagado = payments
            .filter(p => p.status === 'VALIDADO')
            .reduce((sum, p) => sum + p.amountUsd, 0);

        const totalPendiente = debts
            .filter(d => d.status === 'PENDIENTE' || d.status === 'PARCIAL')
            .reduce((sum, d) => sum + d.amountPending, 0);

        const safeResponse = JSON.parse(JSON.stringify({
            summary: {
                totalPagado,
                totalPendiente
            },
            debts,
            payments
        }, (key, value) => typeof value === 'bigint' ? value.toString() : value));

        return NextResponse.json(safeResponse);

    } catch (error: any) {
        console.error("Error fetching history:", error);
        return NextResponse.json({
            error: "Error interno",
            details: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
