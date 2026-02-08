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
                paciente: {
                    select: {
                        nombres: true,
                        apellidos: true,
                        documentoIdentidad: true
                    }
                },
                cita: {
                    select: {
                        fechaCita: true,
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
            paciente: inv.paciente ? `${inv.paciente.nombres} ${inv.paciente.apellidos}` : 'Desconocido',
            cedula: inv.paciente?.documentoIdentidad || 'S/C',
            doctor: inv.cita?.medico?.empleado ? `Dr. ${inv.cita.medico.empleado.nombres} ${inv.cita.medico.empleado.apellidos}` : 'No asignado',
            total: Number(inv.total),
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
