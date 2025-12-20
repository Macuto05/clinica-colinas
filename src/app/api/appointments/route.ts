/**
 * Appointments API Route
 * 
 * Handles appointment creation and retrieval.
 */
import { NextRequest, NextResponse } from 'next/server';
import { appointmentController } from '@/infrastructure/http/controllers/AppointmentController';

export async function POST(request: NextRequest) {
    return appointmentController.create(request);
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const patientId = searchParams.get('patientId');
    const doctorId = searchParams.get('doctorId');

    if (patientId) {
        return appointmentController.getByPatient(parseInt(patientId));
    }

    if (doctorId) {
        return appointmentController.getByDoctor(parseInt(doctorId));
    }

    return NextResponse.json(
        { error: 'Missing patientId or doctorId parameter' },
        { status: 400 }
    );
}
