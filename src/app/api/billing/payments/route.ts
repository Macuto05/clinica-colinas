
import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma/client";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const statusParam = searchParams.get('status') || 'PENDIENTE';

        const search = searchParams.get('search');
        const dateRegister = searchParams.get('dateRegister');
        const datePayment = searchParams.get('datePayment');

        // Base Condition
        let whereCondition: any = { estadoPago: statusParam };
        if (statusParam === 'HISTORIAL') {
            whereCondition = {
                estadoPago: { in: ['VALIDADO', 'RECHAZADO'] }
            };
        }

        // Search Filter (Link to Patient via Invoice->Appointment)
        if (search) {
            whereCondition.factura = {
                cita: {
                    paciente: {
                        OR: [
                            { nombres: { contains: search, mode: 'insensitive' } },
                            { apellidos: { contains: search, mode: 'insensitive' } },
                            { documentoIdentidad: { contains: search, mode: 'insensitive' } }
                        ]
                    }
                }
            };
        }

        // Date Register Filter (Specific Day)
        // Date Register Filter (Specific Day VET: UTC-4)
        if (dateRegister) {
            // Parse YYYY-MM-DD as UTC Midnight
            const d = new Date(dateRegister);

            // Venezuela starts at 00:00 VET = 04:00 UTC
            const start = new Date(d);
            start.setUTCHours(4, 0, 0, 0);

            // Venezuela ends at 23:59:59 VET = 03:59:59 UTC Next Day
            const end = new Date(start);
            end.setDate(end.getDate() + 1);
            end.setMilliseconds(-1);

            whereCondition.fechaRegistro = {
                gte: start,
                lte: end
            };
        }

        // Date Payment Filter (Specific Day)
        // Date Payment Filter (Specific Day VET: UTC-4)
        if (datePayment) {
            // Parse YYYY-MM-DD as UTC Midnight
            const d = new Date(datePayment);

            // Venezuela starts at 00:00 VET = 04:00 UTC
            const start = new Date(d);
            start.setUTCHours(4, 0, 0, 0);

            // Venezuela ends at 23:59:59 VET = 03:59:59 UTC Next Day
            const end = new Date(start);
            end.setDate(end.getDate() + 1);
            end.setMilliseconds(-1);

            if (!whereCondition.fechaPago) whereCondition.fechaPago = {}; // Initialize if needed
            whereCondition.fechaPago = {
                gte: start,
                lte: end
            };
        }

        // Dynamic Limit: If filtering, allow more results. If default history, limit to 50.
        const isFiltering = !!(search || dateRegister || datePayment);
        const limit = (statusParam === 'HISTORIAL' && !isFiltering) ? 50 : undefined;

        console.log("Fetching Payments with params:", { statusParam, search, dateRegister, datePayment });

        const pagos = await prisma.pago.findMany({
            where: whereCondition,
            include: {
                metodoPago: true,
                cuentaBancaria: true,
                factura: {
                    include: {
                        cita: {
                            include: {
                                paciente: true
                            }
                        }
                    }
                }
            } as any,
            orderBy: { fechaRegistro: 'desc' },
            take: limit
        }) as any[];

        if (pagos.length > 0) {
            console.log("DEBUG: Sample Payment[0] Keys:", Object.keys(pagos[0]));
            console.log("DEBUG: Sample Payment[0] fechaRegistro:", pagos[0].fechaRegistro);
            console.log("DEBUG: Sample Payment[0] fechaPago:", pagos[0].fechaPago);
        }

        const formattedPagos = pagos.map(p => ({
            pagoId: p.pagoId.toString(),
            monto: Number(p.monto),
            montoBs: Number(p.montoBs || 0), // from DB
            tasa: Number(p.tasaCambio || 0), // from DB
            fecha: p.fechaPago,
            fechaRegistro: p.fechaRegistro, // System Timestamp
            metodo: p.metodoPago.nombre,
            referencia: p.referenciaExterna,
            // Format Bank Info
            // Format Bank Info
            bancoDepositado: (p as any).cuentaBancaria
                ? `${(p as any).cuentaBancaria.banco} (${(p as any).cuentaBancaria.numeroCuenta.slice(-4)})`
                : null, // Legacy notes removed from DB
            paciente: `${p.factura.cita.paciente.nombres} ${p.factura.cita.paciente.apellidos}`,
            cedula: p.factura.cita.paciente.documentoIdentidad,
            facturaId: p.facturaId.toString(),
            numeroFactura: p.factura.numeroFactura, // Include invoice number
            saldoFactura: Number(p.factura.saldoPendiente),
            estado: p.estadoPago, // Include status for frontend
            canal: p.canalPago // Expose payment channel
        }));

        return NextResponse.json(formattedPagos);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Error fetching payments" }, { status: 500 });
    }
}

