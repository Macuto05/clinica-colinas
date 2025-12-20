/**
 * Domain Entity: Speciality
 * 
 * Represents a medical specialty in the clinic.
 */

export interface SpecialityProps {
    id: number;
    name: string;
    description?: string;
}

export class Speciality {
    private props: SpecialityProps;

    constructor(props: SpecialityProps) {
        this.validateSpeciality(props);
        this.props = props;
    }

    private validateSpeciality(props: SpecialityProps): void {
        if (!props.name || props.name.trim().length === 0) {
            throw new Error('Speciality name is required');
        }

        if (props.name.length > 100) {
            throw new Error('Speciality name must not exceed 100 characters');
        }
    }

    // Getters
    get id(): number {
        return this.props.id;
    }

    get name(): string {
        return this.props.name;
    }

    get description(): string | undefined {
        return this.props.description;
    }

    // Business logic
    hasDescription(): boolean {
        return !!this.props.description && this.props.description.trim().length > 0;
    }

    updateDescription(description: string): Speciality {
        return new Speciality({
            ...this.props,
            description,
        });
    }

    toJSON() {
        return {
            id: this.props.id,
            name: this.props.name,
            description: this.props.description,
        };
    }
}
