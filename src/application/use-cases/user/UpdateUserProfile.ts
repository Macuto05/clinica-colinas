import { User } from "@/domain/entities/User";
import { IUserRepository } from "@/domain/repositories/IUserRepository";
import { hash } from "bcryptjs";

export interface UpdateUserProfileDTO {
    userId: number;
    contactEmail?: string;
    accessEmail?: string; // Correo de acceso (Usuario table)
    password?: string;
    phone?: string;
    address?: string;
}

export class UpdateUserProfile {
    constructor(private userRepository: IUserRepository) { }

    async execute(data: UpdateUserProfileDTO): Promise<User> {
        const user = await this.userRepository.findById(data.userId);
        if (!user) {
            throw new Error("Usuario no encontrado");
        }

        // Prepare update data for Usuario (access email, password)
        // Casting to any to avoid readonly constraints of Partial<User> when assigning properties manually
        const updateData: any = {};

        // Update Access Email (Usuario)
        if (data.accessEmail && data.accessEmail !== user.email) {
            // Check if email is taken by another user
            const exists = await this.userRepository.emailExists(data.accessEmail);
            if (exists) {
                throw new Error("El correo de acceso ya está en uso");
            }
            updateData.email = data.accessEmail;
        }

        // Update Password (Usuario)
        if (data.password) {
            const hashedPassword = await hash(data.password, 10);
            updateData.passwordHash = hashedPassword;
        }

        // Update Patient specific data
        if (data.contactEmail) updateData.contactEmail = data.contactEmail;
        if (data.phone) updateData.phone = data.phone;
        if (data.address) updateData.address = data.address;

        if (Object.keys(updateData).length > 0) {
            return await this.userRepository.update(user.id, updateData);
        }

        return user;
    }
}
