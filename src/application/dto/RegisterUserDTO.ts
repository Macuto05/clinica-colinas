/**
 * DTO: Register User
 * 
 * Data Transfer Object for user registration
 */

export interface RegisterUserDTO {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: string;
    phone?: string;
    address?: string;
    idCard?: string;
    birthDate?: Date;
    sex?: string;
    contactEmail?: string;
    // Doctor specific (optional)
    specialty?: string;
    collegiateNumber?: string;
}
