
import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma/client";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const patientId = searchParams.get('patientId');

        if (!patientId) {
            return NextResponse.json({ error: "Missing patientId" }, { status: 400 });
        }

        const facturas = await prisma.factura.findMany({
            where: {
                cita: { pacienteId: BigInt(patientId) },
                estadoFactura: { in: ['PENDIENTE', 'PARCIAL'] }
            },
            include: {
                cita: true,
                pagos: {
                    where: { estadoPago: 'PENDIENTE' }
                }
            }
        });

        // Calculate total debt and pending verification
        let totalDeuda = 0;
        let totalEnRevision = 0;

        const formattedFacturas = facturas.map(f => {
            const deuda = Number(f.saldoPendiente);
            const enRevision = f.pagos.reduce((a, p) => a + Number(p.monto), 0);

            totalDeuda += deuda;
            totalEnRevision += enRevision;

            return {
                facturaId: f.facturaId.toString(),
                citaId: f.citaId.toString(),
                fecha: f.fechaEmision,
                total: Number(f.total),
                saldoPendiente: deuda,
                montoAsegurado: Number(f.montoAsegurado),
                enRevision: enRevision,
                estado: f.estadoFactura,
                descripcion: `Consulta del ${new Date(f.cita.fechaCita).toLocaleDateString()}`
            };
        });

        // Fetch Current Exchange Rate
        const tasa = await prisma.tasaDeCambio.findFirst({
            orderBy: { fecha: 'desc' }
        });
        const tasaActual = tasa ? Number(tasa.valor) : 0;
        const totalDeudaBs = totalDeuda * tasaActual;

        return NextResponse.json({
            totalDeuda,
            totalDeudaBs, // New field for Dashboard
            tasaActual,
            totalEnRevision,
            facturas: formattedFacturas
        });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Error fetching invoices" }, { status: 500 });
    }
}
