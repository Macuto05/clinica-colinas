/**
 * Repository Interface: Doctor Repository
 */

import { Doctor } from '../entities/Doctor';

export interface IDoctorRepository {
    /**
     * Create a new doctor
     */
    create(doctor: Doctor): Promise<Doctor>;

    /**
     * Find a doctor by their ID
     */
    findById(id: number): Promise<Doctor | null>;

    /**
     * Find a doctor by user ID
     */
    findByUserId(userId: number): Promise<Doctor | null>;

    /**
     * Find all doctors by specialty
     */
    findBySpeciality(speciality: number | string): Promise<Doctor[]>;

    /**
     * Get all doctors
     */
    findAll(): Promise<Doctor[]>;

    /**
     * Update a doctor
     */
    update(id: number, data: Partial<Doctor>): Promise<Doctor>;

    /**
     * Delete a doctor
     */
    delete(id: number): Promise<void>;
}
