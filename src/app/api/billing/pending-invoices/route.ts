import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma/client";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const invoices = await prisma.factura.findMany({
            where: {
                estadoFactura: "PENDIENTE"
            },
            include: {
                cita: {
                    select: {
                        fechaCita: true,
                        paciente: {
                            select: {
                                nombres: true,
                                apellidos: true,
                                documentoIdentidad: true
                            }
                        },
                        medico: {
                            include: {
                                empleado: {
                                    select: {
                                        nombres: true,
                                        apellidos: true
                                    }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: {
                fechaEmision: 'desc'
            }
        });

        const formattedInvoices = invoices.map(inv => ({
            facturaId: inv.facturaId.toString(),
            numeroFactura: inv.numeroFactura,
            fechaEmision: inv.fechaEmision.toISOString(),
            paciente: inv.cita?.paciente ? `${inv.cita.paciente.nombres} ${inv.cita.paciente.apellidos}` : 'Desconocido',
            cedula: inv.cita?.paciente?.documentoIdentidad || 'S/C',
            doctor: inv.cita?.medico?.empleado ? `Dr. ${inv.cita.medico.empleado.nombres} ${inv.cita.medico.empleado.apellidos}` : 'No asignado',
            total: Number(inv.total),
            montoAsegurado: Number((inv as any).montoAsegurado || 0),
            saldoPendiente: Number(inv.saldoPendiente)
        }));

        return NextResponse.json(formattedInvoices);
    } catch (error) {
        console.error("Error fetching pending invoices:", error);
        return NextResponse.json(
            { error: "Error al cargar facturas pendientes" },
            { status: 500 }
        );
    }
}
