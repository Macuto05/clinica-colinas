/**
 * Value Object: Email
 * 
 * Represents and validates an email address.
 * Value objects are immutable and validated on construction.
 */

export class Email {
    private readonly value: string;

    constructor(email: string) {
        this.validate(email);
        this.value = email.toLowerCase().trim();
    }

    private validate(email: string): void {
        if (!email || email.trim().length === 0) {
            throw new Error('Email cannot be empty');
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new Error('Invalid email format');
        }

        if (email.length > 255) {
            throw new Error('Email must not exceed 255 characters');
        }
    }

    getValue(): string {
        return this.value;
    }

    equals(other: Email): boolean {
        return this.value === other.value;
    }

    toString(): string {
        return this.value;
    }

    getDomain(): string {
        return this.value.split('@')[1];
    }

    getLocalPart(): string {
        return this.value.split('@')[0];
    }
}
