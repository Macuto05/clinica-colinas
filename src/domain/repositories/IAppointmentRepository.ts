/**
 * Repository Interface: Appointment Repository
 */

import { Appointment } from '../entities/Appointment';

export interface IAppointmentRepository {
    /**
     * Create a new appointment
     */
    create(appointment: Appointment): Promise<Appointment>;

    /**
     * Find an appointment by ID
     */
    findById(id: number): Promise<Appointment | null>;

    /**
     * Find all appointments for a patient
     */
    findByPatientId(patientId: number): Promise<Appointment[]>;

    /**
     * Find all appointments for a doctor
     */
    findByDoctorId(doctorId: number): Promise<Appointment[]>;

    /**
     * Find appointments by date range
     */
    findByDateRange(startDate: Date, endDate: Date): Promise<Appointment[]>;

    /**
     * Find appointments by doctor and date
     */
    findByDoctorAndDate(doctorId: number, date: Date): Promise<Appointment[]>;

    /**
     * Update an appointment
     */
    update(id: number, data: Partial<Appointment>): Promise<Appointment>;

    /**
     * Delete an appointment
     */
    delete(id: number): Promise<void>;

    /**
     * Check if a time slot is available
     * Updated to check date + time logic
     */
    isTimeSlotAvailable(doctorId: number, date: Date, startTime: string, endTime: string): Promise<boolean>;

    /**
     * Find all appointments with details (for Admin)
     */
    findAllWithDetails(): Promise<Appointment[]>;
}
