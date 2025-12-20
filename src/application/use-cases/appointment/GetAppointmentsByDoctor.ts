/**
 * Use Case: Get Appointments By Doctor
 */

import { Appointment } from '@/domain/entities/Appointment';
import { IAppointmentRepository } from '@/domain/repositories/IAppointmentRepository';

export class GetAppointmentsByDoctor {
    constructor(private appointmentRepository: IAppointmentRepository) { }

    async execute(doctorId: number): Promise<Appointment[]> {
        return await this.appointmentRepository.findByDoctorId(doctorId);
    }
}
