/**
 * Use Case: Get User Profile
 */

import { User } from '@/domain/entities/User';
import { IUserRepository } from '@/domain/repositories/IUserRepository';

export class GetUserProfile {
    constructor(private userRepository: IUserRepository) { }

    async execute(userId: number): Promise<User> {
        const user = await this.userRepository.findById(userId);

        if (!user) {
            throw new Error('User not found');
        }

        return user;
    }
}
