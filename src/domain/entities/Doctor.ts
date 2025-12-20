/**
 * Domain Entity: Doctor
 * 
 * Represents a doctor (Medico).
 * Mapping: 'medico' table + 'empleado' table (via inheritance or composition).
 */

export interface DoctorProps {
    id: number; // empleado_id (same as medico table PK)
    specialty: string;
    collegiateNumber?: string; // numero_colegiatura
    professionalLicense?: string; // licencia_profesional
    isActive: boolean;

    // Aggregated Employee/User data
    firstName: string;
    lastName: string;
    email?: string;
}

export class Doctor {
    private props: DoctorProps;

    constructor(props: DoctorProps) {
        this.validateDoctor(props);
        this.props = props;
    }

    private validateDoctor(props: DoctorProps): void {
        if (!props.specialty) throw new Error('Specialty is required');
    }

    get id(): number { return this.props.id; }
    get specialty(): string { return this.props.specialty; }
    get collegiateNumber(): string | undefined { return this.props.collegiateNumber; }
    get professionalLicense(): string | undefined { return this.props.professionalLicense; }
    get isActive(): boolean { return this.props.isActive; }

    get firstName(): string { return this.props.firstName; }
    get lastName(): string { return this.props.lastName; }
    get fullName(): string { return `${this.props.firstName} ${this.props.lastName}`; }

    toJSON() {
        return { ...this.props, fullName: this.fullName };
    }
}
