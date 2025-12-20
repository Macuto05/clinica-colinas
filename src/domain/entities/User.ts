/**
 * Domain Entity: User
 * 
 * Represents a user in the clinic system.
 * Maps to the 'usuario' table in the database, but aggregates profile information
 * from 'empleado' or 'paciente' tables for business logic convenience.
 */

// Matching database enums
export enum UserStatus {
    ACTIVE = 'ACTIVO',
    INACTIVE = 'INACTIVO',
    BLOCKED = 'BLOQUEADO',
}

// Keeping legacy Role enum for code compatibility, but mapped to DB roles
export enum Role {
    PATIENT = 'PACIENTE',
    DOCTOR = 'MEDICO',
    ADMIN = 'ADMIN',
    NURSE = 'ENFERMERIA',
    LAB = 'LABORATORIO',
    INVENTORY = 'FARMACIA', // Mapped from 'INVENTORY' to 'FARMACIA' based on seed
    RECEPTION = 'RECEPCION',
}

export interface UserProps {
    id: number; // usuario_id
    email: string;
    passwordHash: string;
    role: Role | string; // rol (nombre)
    status: UserStatus;
    createdAt: Date;
    lastAccess?: Date | null;

    // Profile Fields (Aggregated from Empleado/Paciente)
    firstName?: string; // nombres
    lastName?: string;  // apellidos
    documentId?: string; // documento_identidad
    phone?: string;
    address?: string; // direccion (only in Paciente and Empleado)
    patientId?: number; // Linked Paciente ID
    employeeId?: number; // Linked Empleado ID

    // Legacy support
    birthDate?: Date | null; // only Paciente
    speciality?: string; // only Medico
}

export class User {
    private props: UserProps;

    constructor(props: UserProps) {
        this.validateUser(props);
        this.props = props;
    }

    private validateUser(props: UserProps): void {
        if (!props.email || !this.isValidEmail(props.email)) {
            throw new Error('Valid email is required');
        }
        // Password hash is internal, minimal validation of format if needed
    }

    private isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Getters
    get id(): number {
        return this.props.id;
    }

    get email(): string {
        return this.props.email;
    }

    get name(): string {
        // Compound name for compatibility
        if (this.props.firstName && this.props.lastName) {
            return `${this.props.firstName} ${this.props.lastName}`;
        }
        return this.props.firstName || this.props.email; // Fallback
    }

    get firstName(): string | undefined {
        return this.props.firstName;
    }

    get lastName(): string | undefined {
        return this.props.lastName;
    }

    get password(): string {
        return this.props.passwordHash;
    }

    get role(): Role | string {
        return this.props.role;
    }

    get status(): UserStatus {
        return this.props.status;
    }

    get phone(): string | undefined {
        return this.props.phone;
    }

    get address(): string | undefined {
        return this.props.address;
    }

    get documentId(): string | undefined {
        return this.props.documentId;
    }

    get birthDate(): Date | undefined | null {
        return this.props.birthDate;
    }

    get specialty(): string | undefined {
        return this.props.speciality;
    }

    get createdAt(): Date {
        return this.props.createdAt;
    }

    get lastAccess(): Date | undefined | null {
        return this.props.lastAccess;
    }

    get patientId(): number | undefined {
        return this.props.patientId;
    }

    get employeeId(): number | undefined {
        return this.props.employeeId;
    }

    // Business logic methods
    isActive(): boolean {
        return this.props.status === UserStatus.ACTIVE;
    }

    isPatient(): boolean {
        return this.props.role === Role.PATIENT;
    }

    isDoctor(): boolean {
        return this.props.role === Role.DOCTOR;
    }

    isAdmin(): boolean {
        return this.props.role === Role.ADMIN;
    }

    canManageAppointments(): boolean {
        return this.props.role === Role.DOCTOR || this.props.role === Role.ADMIN || this.props.role === Role.RECEPTION;
    }

    // Update methods (Domain Logic)
    updateEmail(email: string): User {
        if (!this.isValidEmail(email)) {
            throw new Error('Invalid email format');
        }
        return new User({
            ...this.props,
            email,
        });
    }

    toJSON() {
        return {
            id: this.props.id,
            name: this.name,
            firstName: this.props.firstName,
            lastName: this.props.lastName,
            email: this.props.email,
            role: this.props.role,
            status: this.props.status,
            phone: this.props.phone,
            address: this.props.address,
            documentId: this.props.documentId,
            createdAt: this.props.createdAt,
            lastAccess: this.props.lastAccess,
        };
    }
}
