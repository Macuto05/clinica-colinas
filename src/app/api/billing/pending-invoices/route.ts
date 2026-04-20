import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma/client";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const invoices = await prisma.factura.findMany({
            where: {
                estadoFactura: { in: ["EN_REVISION", "PENDIENTE", "PARCIAL"] }
            },
            include: {
                paciente: {
                    select: {
                        nombres: true,
                        apellidos: true,
                        documentoIdentidad: true
                    }
                },
                emergencia: {
                    select: {
                        emergenciaId: true,
                        motivoIngreso: true,
                        medicoId: true,
                        medico: {
                            include: {
                                empleado: { select: { nombres: true, apellidos: true } }
                            }
                        },
                        cartasAval: {
                            where: { estado: 'APROBADA' },
                            select: {
                                cartaAvalId: true,
                                codigoAval: true,
                                poliza: { select: { montoCobertura: true, numeroPoliza: true } }
                            },
                            orderBy: { fechaSolicitud: 'desc' },
                            take: 1
                        }
                    }
                },
                cita: {
                    select: {
                        tipoCita: true,
                        medico: {
                            include: {
                                empleado: { select: { nombres: true, apellidos: true } }
                            }
                        }
                    }
                }
            },
            orderBy: {
                fechaEmision: 'desc'
            }
        });

        const formattedInvoices = await Promise.all(invoices.map(async inv => {
            const isEmergency = !!inv.emergenciaId;

            // Get doctor from emergency or cita
            const doctor = isEmergency
                ? (inv as any).emergencia?.medico?.empleado
                : (inv as any).cita?.medico?.empleado;

            const doctorLabel = doctor
                ? `${isEmergency ? '🚨 Emg.' : 'Dr.'} ${doctor.nombres} ${doctor.apellidos}`
                : isEmergency ? '🚨 Emergencia' : 'No asignado';

            // Auto-generate invoice number for cita invoices that don't have one
            let numeroFactura = inv.numeroFactura;
            if (!numeroFactura && inv.citaId) {
                const now = new Date();
                const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
                const existingCount = await (prisma as any).factura.count({
                    where: { numeroFactura: { startsWith: `FCT-CIT-${yearMonth}` } }
                });
                numeroFactura = `FCT-CIT-${yearMonth}-${String(existingCount + 1).padStart(4, '0')}`;
                await (prisma as any).factura.update({
                    where: { facturaId: inv.facturaId },
                    data: { numeroFactura }
                });
            }

            const cartaAval = isEmergency ? ((inv as any).emergencia?.cartasAval?.[0] ?? null) : null;

            return {
                facturaId: inv.facturaId.toString(),
                numeroFactura,
                fechaEmision: inv.fechaEmision.toISOString(),
                paciente: `${inv.paciente.nombres} ${inv.paciente.apellidos}`,
                cedula: inv.paciente.documentoIdentidad || 'S/C',
                doctor: doctorLabel,
                total: Number(inv.total),
                montoAsegurado: Number((inv as any).montoAsegurado || 0),
                saldoPendiente: Number(inv.saldoPendiente),
                esEmergencia: isEmergency,
                estadoFactura: inv.estadoFactura,
                cartaAvalAprobada: !!cartaAval,
                cartaAvalId: cartaAval ? cartaAval.cartaAvalId.toString() : null,
                codigoAval: cartaAval?.codigoAval ?? null,
                limiteCobertura: cartaAval ? Number(cartaAval.poliza?.montoCobertura ?? 0) : 0,
            };
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
