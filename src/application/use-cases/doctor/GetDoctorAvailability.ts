/**
 * Use Case: Get Doctor Availability
 * 
 * Returns available time slots for a doctor within a date range.
 */

import { Schedule } from '@/domain/entities/Schedule';
import { IScheduleRepository } from '@/domain/repositories/IScheduleRepository';
import { IDoctorRepository } from '@/domain/repositories/IDoctorRepository';

export class GetDoctorAvailability {
    constructor(
        private scheduleRepository: IScheduleRepository,
        private doctorRepository: IDoctorRepository
    ) { }

    async execute(
        doctorId: number,
        startDate: Date,
        endDate: Date
    ): Promise<Schedule[]> {
        // Validate doctor exists
        const doctor = await this.doctorRepository.findById(doctorId);
        if (!doctor) {
            throw new Error('Doctor not found');
        }

        // Get available schedules
        const schedules = await this.scheduleRepository.findAvailableByDoctorAndDateRange(
            doctorId,
            startDate,
            endDate
        );

        // Filter only future and available schedules
        return schedules.filter(schedule => schedule.isAvailable() && schedule.isInFuture());
    }
}
