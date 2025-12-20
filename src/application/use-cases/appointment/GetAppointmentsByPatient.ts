/**
 * Use Case: Get Appointments By Patient
 */

import { Appointment } from '@/domain/entities/Appointment';
import { IAppointmentRepository } from '@/domain/repositories/IAppointmentRepository';

export class GetAppointmentsByPatient {
    constructor(private appointmentRepository: IAppointmentRepository) { }

    async execute(patientId: number): Promise<Appointment[]> {
        return await this.appointmentRepository.findByPatientId(patientId);
    }
}
