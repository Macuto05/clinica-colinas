/**
 * Use Case: Update User Profile
 */

import { User } from '@/domain/entities/User';
import { IUserRepository } from '@/domain/repositories/IUserRepository';
import { UpdateUserProfileDTO } from '@/application/dto/UpdateUserProfileDTO';

export class UpdateUserProfile {
    constructor(private userRepository: IUserRepository) { }

    async execute(userId: number, data: UpdateUserProfileDTO): Promise<User> {
        const user = await this.userRepository.findById(userId);

        if (!user) {
            throw new Error('User not found');
        }

        // Check if email is being changed and if it already exists
        if (data.email && data.email !== user.email) {
            const emailExists = await this.userRepository.emailExists(data.email);
            if (emailExists) {
                throw new Error('Email already in use');
            }
        }

        return await this.userRepository.update(userId, data);
    }
}
