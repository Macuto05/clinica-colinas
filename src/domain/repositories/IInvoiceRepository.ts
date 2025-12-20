/**
 * Repository Interface: Invoice Repository
 */

import { Invoice } from '../entities/Invoice';

export interface IInvoiceRepository {
    create(invoice: Invoice): Promise<Invoice>;
    findById(id: number): Promise<Invoice | null>;
    findAll(): Promise<Invoice[]>;
    findByAppointmentId(appointmentId: number): Promise<Invoice | null>;
    updateStatus(id: number, status: string): Promise<Invoice>;
}
