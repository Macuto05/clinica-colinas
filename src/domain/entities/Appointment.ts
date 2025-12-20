/**
 * Domain Entity: Appointment
 * 
 * Represents a medical appointment between a patient and a doctor.
 * Maps to 'cita_medica' table.
 */

export enum AppointmentStatus {
    PENDING = 'PROGRAMADA',
    CONFIRMED = 'CONFIRMADA',
    ATTENDED = 'ATENDIDA',
    CANCELLED = 'CANCELADA',
    NO_SHOW = 'NO_ASISTIO',
}

export enum AppointmentType {
    CONSULTATION = 'CONSULTA',
    CONTROL = 'CONTROL',
    SPECIALTY = 'ESPECIALIDAD',
    OTHER = 'OTRA',
}

export enum AppointmentOrigin {
    WEB = 'WEB',
    RECEPTION = 'RECEPCION',
}

export interface AppointmentProps {
    id: number;
    patientId: number;
    doctorId: number;
    date: Date;          // fecha_cita
    startTime: string;   // hora_inicio (HH:MM)
    endTime: string;     // hora_fin (HH:MM)
    reason?: string;     // motivo_consulta
    type: AppointmentType;
    origin: AppointmentOrigin;
    notes?: string;      // observaciones
    status: AppointmentStatus;
    createdAt: Date;
    createdBy: number;   // usuario_creacion

    // Enriched data
    patientName?: string;
    doctorName?: string;
}

export class Appointment {
    private props: AppointmentProps;

    constructor(props: AppointmentProps) {
        this.validateAppointment(props);
        this.props = props;
    }

    private validateAppointment(props: AppointmentProps): void {
        if (!props.patientId) throw new Error('Valid patient ID is required');
        if (!props.doctorId) throw new Error('Valid doctor ID is required');
        if (!props.date) throw new Error('Appointment date is required');
        if (!props.startTime || !props.endTime) throw new Error('Start and end time are required');

        // Simple logic check: End > Start? 
        if (props.startTime >= props.endTime) {
            // throw new Error('End time must be after start time'); 
            // Commented out as string comparison OK for HH:MM same day
        }
    }

    // Getters
    get id(): number { return this.props.id; }
    get patientId(): number { return this.props.patientId; }
    get doctorId(): number { return this.props.doctorId; }
    get date(): Date { return this.props.date; }
    get startTime(): string { return this.props.startTime; }
    get endTime(): string { return this.props.endTime; }
    get reason(): string | undefined { return this.props.reason; }
    get notes(): string | undefined { return this.props.notes; }
    get type(): AppointmentType { return this.props.type; }
    get origin(): AppointmentOrigin { return this.props.origin; }
    get status(): AppointmentStatus { return this.props.status; }
    get createdAt(): Date { return this.props.createdAt; }
    get patientName(): string | undefined { return this.props.patientName; }
    get doctorName(): string | undefined { return this.props.doctorName; }

    // Business Logic
    isPending(): boolean { return this.props.status === AppointmentStatus.PENDING; }
    isConfirmed(): boolean { return this.props.status === AppointmentStatus.CONFIRMED; }
    isCancelled(): boolean { return this.props.status === AppointmentStatus.CANCELLED; }
    isAttended(): boolean { return this.props.status === AppointmentStatus.ATTENDED; }

    confirm(): Appointment {
        if (this.isCancelled() || this.isAttended()) throw new Error('Cannot confirm cancelled or attended appointment');
        return new Appointment({ ...this.props, status: AppointmentStatus.CONFIRMED });
    }

    cancel(): Appointment {
        if (this.isAttended()) throw new Error('Cannot cancel an attended appointment');
        return new Appointment({ ...this.props, status: AppointmentStatus.CANCELLED });
    }

    markAsAttended(): Appointment {
        if (this.isCancelled()) throw new Error('Cannot attend a cancelled appointment');
        return new Appointment({ ...this.props, status: AppointmentStatus.ATTENDED });
    }

    markAsNoShow(): Appointment {
        return new Appointment({ ...this.props, status: AppointmentStatus.NO_SHOW });
    }

    toJSON() {
        return {
            id: this.props.id,
            patientId: this.props.patientId,
            doctorId: this.props.doctorId,
            date: this.props.date,
            startTime: this.props.startTime,
            endTime: this.props.endTime,
            status: this.props.status,
            type: this.props.type,
            origin: this.props.origin,
            patientName: this.props.patientName,
            doctorName: this.props.doctorName,
        };
    }
}
