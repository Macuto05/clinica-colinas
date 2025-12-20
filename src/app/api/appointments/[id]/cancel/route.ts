/**
 * Cancel Appointment Route
 * 
 * PUT /api/appointments/[id]/cancel
 */
import { NextRequest } from 'next/server';
import { appointmentController } from '@/infrastructure/http/controllers/AppointmentController';

export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const params = await context.params;
    const appointmentId = parseInt(params.id);
    const { userId } = await request.json();

    return appointmentController.cancel(appointmentId, userId);
}
