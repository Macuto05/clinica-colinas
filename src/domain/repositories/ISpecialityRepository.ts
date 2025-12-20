/**
 * Repository Interface: Speciality Repository
 */

import { Speciality } from '../entities/Speciality';

export interface ISpecialityRepository {
    /**
     * Create a new speciality
     */
    create(speciality: Speciality): Promise<Speciality>;

    /**
     * Find a speciality by ID
     */
    findById(id: number): Promise<Speciality | null>;

    /**
     * Find a speciality by name
     */
    findByName(name: string): Promise<Speciality | null>;

    /**
     * Get all specialities
     */
    findAll(): Promise<Speciality[]>;

    /**
     * Update a speciality
     */
    update(id: number, data: Partial<Speciality>): Promise<Speciality>;

    /**
     * Delete a speciality
     */
    delete(id: number): Promise<void>;
}
