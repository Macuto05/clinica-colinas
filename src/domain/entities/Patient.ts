/**
 * Domain Entity: Patient
 * 
 * Represents a patient in the clinic.
 * Maps to 'paciente' table.
 */

export enum PatientStatus {
    ACTIVE = 'ACTIVO',
    INACTIVE = 'INACTIVO',
    BLOCKED = 'BLOQUEADO',
    DECEASED = 'FALLECIDO',
}

export interface PatientProps {
    id: number;
    userId?: number;
    firstName: string;
    lastName: string;
    documentId?: string;
    birthDate?: Date;
    sex?: string;
    phone?: string;
    email?: string;
    address?: string;
    status: PatientStatus;
}

export class Patient {
    private props: PatientProps;

    constructor(props: PatientProps) {
        this.validate(props);
        this.props = props;
    }

    private validate(props: PatientProps): void {
        if (!props.firstName) throw new Error('First name is required');
        if (!props.lastName) throw new Error('Last name is required');
    }

    get id(): number { return this.props.id; }
    get userId(): number | undefined { return this.props.userId; }
    get fullName(): string { return `${this.props.firstName} ${this.props.lastName}`; }
    get firstName(): string { return this.props.firstName; }
    get lastName(): string { return this.props.lastName; }
    get documentId(): string | undefined { return this.props.documentId; }
    get birthDate(): Date | undefined { return this.props.birthDate; }
    get sex(): string | undefined { return this.props.sex; }
    get phone(): string | undefined { return this.props.phone; }
    get email(): string | undefined { return this.props.email; }
    get address(): string | undefined { return this.props.address; }
    get status(): PatientStatus { return this.props.status; }

    isActive(): boolean { return this.props.status === PatientStatus.ACTIVE; }

    get age(): number | undefined {
        if (!this.props.birthDate) return undefined;
        const today = new Date();
        const birth = new Date(this.props.birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    }

    toJSON() {
        return { ...this.props, fullName: this.fullName, age: this.age };
    }
}
