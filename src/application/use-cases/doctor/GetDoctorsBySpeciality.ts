/**
 * Use Case: Get Doctors By Speciality
 */

import { Doctor } from '@/domain/entities/Doctor';
import { IDoctorRepository } from '@/domain/repositories/IDoctorRepository';
import { ISpecialityRepository } from '@/domain/repositories/ISpecialityRepository';

export class GetDoctorsBySpeciality {
    constructor(
        private doctorRepository: IDoctorRepository,
        private specialityRepository: ISpecialityRepository
    ) { }

    async execute(specialityId: number): Promise<Doctor[]> {
        // Validate speciality exists
        const speciality = await this.specialityRepository.findById(specialityId);
        if (!speciality) {
            throw new Error('Speciality not found');
        }

        // Medico stores specialty as string, so we pass the name
        return await this.doctorRepository.findBySpeciality(speciality.id);
    }
}
