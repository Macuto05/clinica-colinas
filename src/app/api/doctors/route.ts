/**
 * Doctors API Route
 * 
 * GET /api/doctors?specialityId=1
 */
import { NextRequest, NextResponse } from 'next/server';
import { doctorController } from '@/infrastructure/http/controllers/DoctorController';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const specialityId = searchParams.get('specialityId');

    if (!specialityId) {
        return NextResponse.json(
            { error: 'Missing specialityId parameter' },
            { status: 400 }
        );
    }

    return doctorController.getBySpeciality(parseInt(specialityId));
}
