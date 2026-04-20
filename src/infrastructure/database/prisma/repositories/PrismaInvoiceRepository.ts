/**
 * Prisma Invoice Repository Implementation
 */

import { Invoice, InvoiceStatus, InvoiceItemProps } from '@/domain/entities/Invoice';
import { IInvoiceRepository } from '@/domain/repositories/IInvoiceRepository';
import prisma from '../client';
import { FacturaEstado } from '@prisma/client';

export class PrismaInvoiceRepository implements IInvoiceRepository {

    private mapToDomain(factura: any): Invoice {
        let status = InvoiceStatus.PENDING;
        if (factura.estadoFactura === FacturaEstado.PAGADA) status = InvoiceStatus.PAID;
        if (factura.estadoFactura === FacturaEstado.ANULADA) status = InvoiceStatus.VOID;

        const items: InvoiceItemProps[] = factura.detalles ? factura.detalles.map((d: any) => ({
            id: Number(d.detalleId),
            description: d.descripcion,
            quantity: Number(d.cantidad),
            unitPrice: Number(d.precioUnitario),
            amount: Number(d.importe),
            type: d.tipoItem
        })) : [];

        return new Invoice({
            id: Number(factura.facturaId),
            patientId: Number(factura.pacienteId),
            appointmentId: factura.citaId ? Number(factura.citaId) : undefined,
            emergencyId: factura.emergenciaId ? Number(factura.emergenciaId) : undefined,
            invoiceNumber: factura.numeroFactura || undefined,
            issueDate: factura.fechaEmision,
            status: status,
            subtotal: Number(factura.subtotal),
            discount: Number(factura.descuentoTotal),
            tax: Number(factura.impuestoTotal),
            total: Number(factura.total),
            balancePending: Number(factura.saldoPendiente),
            issuedBy: Number(factura.usuarioEmision),
            items: items
        });
    }

    async create(invoice: Invoice): Promise<Invoice> {
        const created = await prisma.factura.create({
            data: {
                pacienteId: invoice.patientId,
                citaId: invoice.appointmentId,
                emergenciaId: invoice.emergencyId,
                fechaEmision: invoice.issueDate,
                estadoFactura: FacturaEstado.PENDIENTE,
                subtotal: invoice.subtotal,
                descuentoTotal: invoice.discount,
                impuestoTotal: invoice.tax,
                total: invoice.total,
                saldoPendiente: invoice.total,
                usuarioEmision: 1, // HARDCODED for now, usually context user
                detalles: {
                    create: invoice.items.map(item => ({
                        tipoItem: item.type as any || 'SERVICIO',
                        descripcion: item.description,
                        cantidad: item.quantity,
                        precioUnitario: item.unitPrice,
                        importe: item.amount
                    }))
                }
            },
            include: { detalles: true }
        });

        return this.mapToDomain(created);
    }

    async findById(id: number): Promise<Invoice | null> {
        const factura = await prisma.factura.findUnique({
            where: { facturaId: id },
            include: { detalles: true }
        });
        if (!factura) return null;
        return this.mapToDomain(factura);
    }

    async findAll(): Promise<Invoice[]> {
        const facturas = await prisma.factura.findMany({
            include: { detalles: true }
        });
        return facturas.map(f => this.mapToDomain(f));
    }

    async findByAppointmentId(appointmentId: number): Promise<Invoice | null> {
        const factura = await prisma.factura.findFirst({
            where: { citaId: appointmentId },
            include: { detalles: true }
        });
        if (!factura) return null;
        return this.mapToDomain(factura);
    }

    async updateStatus(id: number, status: string): Promise<Invoice> {
        let newStatus: FacturaEstado = FacturaEstado.PENDIENTE;
        if (status === 'PAID') newStatus = FacturaEstado.PAGADA;
        if (status === 'VOID') newStatus = FacturaEstado.ANULADA;

        const updated = await prisma.factura.update({
            where: { facturaId: id },
            data: { estadoFactura: newStatus },
            include: { detalles: true }
        });
        return this.mapToDomain(updated);
    }
}
