/**
 * Domain Entity: LabOrder (SolicitudLaboratorio)
 * 
 * Represents a laboratory request linked to an appointment.
 * Maps to 'solicitud_laboratorio'.
 */

export enum LabOrderStatus {
    PENDING = 'PENDIENTE',
    APPROVED = 'APROBADA',
    REJECTED = 'RECHAZADA',
    ATTENDED = 'ATENDIDA',
}

export interface LabOrderDetailProps {
    id?: number;
    examId: number;
    examName: string; // Enriched
}

export interface LabOrderProps {
    id: number;
    appointmentId: number;
    requestedBy: number; // User Id
    requestDate: Date;
    status: LabOrderStatus;
    observations?: string;
    details?: LabOrderDetailProps[];
}

export class LabOrder {
    private props: LabOrderProps;

    constructor(props: LabOrderProps) {
        this.props = props;
    }

    get id(): number { return this.props.id; }
    get status(): LabOrderStatus { return this.props.status; }
    get exams(): LabOrderDetailProps[] { return this.props.details || []; }

    toJSON() { return { ...this.props }; }
}
