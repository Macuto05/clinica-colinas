/**
 * Doctor Controller
 * 
 * Handles HTTP requests for doctors.
 */

import { NextRequest, NextResponse } from 'next/server';
import { container } from '../../di/DIContainer';

export class DoctorController {
    async getBySpeciality(specialityId: number): Promise<NextResponse> {
        try {
            const getDoctorsUseCase = container.getGetDoctorsBySpecialityUseCase();
            const doctors = await getDoctorsUseCase.execute(specialityId);

            return NextResponse.json(doctors.map((doc) => doc.toJSON()));
        } catch (error: any) {
            return NextResponse.json(
                { error: error.message || 'Failed to get doctors' },
                { status: 400 }
            );
        }
    }

    async getAvailability(
        doctorId: number,
        startDate: Date,
        endDate: Date
    ): Promise<NextResponse> {
        try {
            const getAvailabilityUseCase = container.getGetDoctorAvailabilityUseCase();
            const schedules = await getAvailabilityUseCase.execute(doctorId, startDate, endDate);

            return NextResponse.json(schedules.map((sch) => sch.toJSON()));
        } catch (error: any) {
            return NextResponse.json(
                { error: error.message || 'Failed to get availability' },
                { status: 400 }
            );
        }
    }
}

export const doctorController = new DoctorController();
