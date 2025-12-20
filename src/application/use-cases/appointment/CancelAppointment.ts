/**
 * Use Case: Cancel Appointment
 */

import { Appointment } from '@/domain/entities/Appointment';
import { IAppointmentRepository } from '@/domain/repositories/IAppointmentRepository';
import { IUserRepository } from '@/domain/repositories/IUserRepository';

export class CancelAppointment {
    constructor(
        private appointmentRepository: IAppointmentRepository,
        private userRepository: IUserRepository
    ) { }

    async execute(appointmentId: number, userId: number): Promise<Appointment> {
        const appointment = await this.appointmentRepository.findById(appointmentId);
        if (!appointment) throw new Error('Appointment not found');

        // Verify ownership
        const user = await this.userRepository.findById(userId);
        if (!user) throw new Error('User not found');

        let isAuthorized = false;

        // Admin or Reception can always cancel
        if (['ADMIN', 'RECEPCION'].includes(String(user.role))) {
            isAuthorized = true;
        } else if (user.role === 'PACIENTE') {
            // Verify if this user is the patient for this appointment
            if (user.patientId && user.patientId === appointment.patientId) {
                isAuthorized = true;
            }
        } else if (user.role === 'MEDICO') {
            // Doctors can cancel their own appointments
            if (user.employeeId && appointment.doctorId === user.employeeId) {
                isAuthorized = true;
            }
        }

        if (!isAuthorized) {
            throw new Error('Unauthorized to cancel this appointment');
        }

        appointment.cancel();
        return await this.appointmentRepository.update(appointmentId, appointment);
    }
}
