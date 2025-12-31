/**
 * Appointment Controller
 * 
 * Handles HTTP requests for appointments.
 */

import { NextRequest, NextResponse } from 'next/server';
import { container } from '../../di/DIContainer';
import { CreateAppointmentDTO } from '@/application/dto/CreateAppointmentDTO';

export class AppointmentController {
    async create(request: NextRequest): Promise<NextResponse> {
        try {
            const body: any = await request.json(); // Use any temporarily to allow mapping

            // Verify Auth Token to get User ID
            const token = request.cookies.get('auth-token')?.value;
            let userId = undefined;

            if (token) {
                const { JWTService } = await import('@/infrastructure/services/JWTService');
                const payload = await JWTService.verifyToken(token);
                if (payload) {
                    userId = payload.userId;
                }
            }

            // Map to DTO
            const dto: CreateAppointmentDTO = {
                patientId: body.patientId,
                doctorId: body.doctorId,
                date: new Date(body.date),
                startTime: body.startTime,
                endTime: body.endTime,
                type: body.type,
                origin: body.origin,
                reason: body.reason,
                userId: userId
            };

            const scheduleUseCase = container.getScheduleAppointmentUseCase();
            const appointment = await scheduleUseCase.execute(dto);

            return NextResponse.json(appointment.toJSON(), { status: 201 });
        } catch (error: any) {
            return NextResponse.json(
                { error: error.message || 'Failed to schedule appointment' },
                { status: 400 }
            );
        }
    }

    async getByPatient(patientId: number): Promise<NextResponse> {
        try {
            const getAppointmentsUseCase = container.getGetAppointmentsByPatientUseCase();
            const appointments = await getAppointmentsUseCase.execute(patientId);

            return NextResponse.json(appointments.map((apt) => apt.toJSON()));
        } catch (error: any) {
            return NextResponse.json(
                { error: error.message || 'Failed to get appointments' },
                { status: 400 }
            );
        }
    }

    async getByDoctor(doctorId: number): Promise<NextResponse> {
        try {
            const getAppointmentsUseCase = container.getGetAppointmentsByDoctorUseCase();
            const appointments = await getAppointmentsUseCase.execute(doctorId);

            return NextResponse.json(appointments.map((apt) => apt.toJSON()));
        } catch (error: any) {
            return NextResponse.json(
                { error: error.message || 'Failed to get appointments' },
                { status: 400 }
            );
        }
    }

    async cancel(appointmentId: number, userId: number): Promise<NextResponse> {
        try {
            const cancelUseCase = container.getCancelAppointmentUseCase();
            const appointment = await cancelUseCase.execute(appointmentId, userId);

            return NextResponse.json(appointment.toJSON());
        } catch (error: any) {
            return NextResponse.json(
                { error: error.message || 'Failed to cancel appointment' },
                { status: 400 }
            );
        }
    }
}

export const appointmentController = new AppointmentController();
