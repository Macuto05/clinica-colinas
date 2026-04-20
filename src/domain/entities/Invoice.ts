/**
 * Domain Entity: Invoice (Factura)
 * 
 * Represents a financial invoice for a medical appointment.
 * Maps to 'factura' table.
 */

export enum InvoiceStatus {
    PENDING = 'PENDIENTE',
    PARTIAL = 'PARCIAL',
    PAID = 'PAGADA',
    VOID = 'ANULADA',
}

export interface InvoiceItemProps {
    id?: number;
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
    type: 'SERVICIO' | 'INSUMO' | 'EXAMEN' | 'OTRO';
}

export interface InvoiceProps {
    id: number;
    patientId: number;
    appointmentId?: number;
    emergencyId?: number;
    invoiceNumber?: string;
    issueDate: Date;
    status: InvoiceStatus;
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
    balancePending: number;
    observations?: string;
    issuedBy: number; // User ID
    items?: InvoiceItemProps[];
}

export class Invoice {
    private props: InvoiceProps;

    constructor(props: InvoiceProps) {
        this.props = props;
    }

    get id(): number { return this.props.id; }
    get patientId(): number { return this.props.patientId; }
    get appointmentId(): number | undefined { return this.props.appointmentId; }
    get emergencyId(): number | undefined { return this.props.emergencyId; }
    get invoiceNumber(): string | undefined { return this.props.invoiceNumber; }
    get issueDate(): Date { return this.props.issueDate; }
    get subtotal(): number { return this.props.subtotal; }
    get discount(): number { return this.props.discount; }
    get tax(): number { return this.props.tax; }
    get total(): number { return this.props.total; }
    get status(): InvoiceStatus { return this.props.status; }
    get items(): InvoiceItemProps[] { return this.props.items || []; }

    isPaid(): boolean { return this.props.status === InvoiceStatus.PAID; }

    calculateTotals(): void {
        // Logic to recalculate totals from items
        if (!this.props.items) return;
        const sub = this.props.items.reduce((acc, item) => acc + item.amount, 0);
        this.props.subtotal = sub;
        this.props.total = sub - this.props.discount + this.props.tax;
        this.props.balancePending = this.isPaid() ? 0 : this.props.total; // Simplified
    }

    toJSON() { return { ...this.props }; }
}
