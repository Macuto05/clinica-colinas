/**
 * Use Case: Login User
 * 
 * Handles user authentication.
 */

import bcrypt from 'bcryptjs';
import { User } from '@/domain/entities/User';
import { IUserRepository } from '@/domain/repositories/IUserRepository';
import { LoginUserDTO } from '@/application/dto/LoginUserDTO';

export interface LoginResult {
    user: User;
    token?: string; // Token will be generated in infrastructure layer
}

export class LoginUser {
    constructor(private userRepository: IUserRepository) { }

    async execute(data: LoginUserDTO): Promise<User> {
        // Find user by email
        const user = await this.userRepository.findByEmail(data.email);

        if (!user) {
            throw new Error('Invalid credentials');
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(data.password, user.password);

        if (!isPasswordValid) {
            throw new Error('Invalid credentials');
        }

        return user;
    }
}
