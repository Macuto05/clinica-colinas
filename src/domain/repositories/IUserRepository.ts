/**
 * Repository Interface: User Repository
 * 
 * Defines the contract for user data persistence.
 * This is part of the domain layer and doesn't know about implementation details.
 */

import { User } from '../entities/User';

export interface IUserRepository {
    /**
     * Create a new user
     */
    create(user: User): Promise<User>;

    /**
     * Find a user by their ID
     */
    findById(id: number): Promise<User | null>;

    /**
     * Find a user by their email
     */
    findByEmail(email: string): Promise<User | null>;

    /**
     * Update an existing user
     */
    update(id: number, data: Partial<User>): Promise<User>;

    /**
     * Delete a user by ID
     */
    delete(id: number): Promise<void>;

    /**
     * Get all users with optional role filter
     */
    findAll(role?: string): Promise<User[]>;

    /**
     * Check if email already exists
     */
    emailExists(email: string): Promise<boolean>;
}
