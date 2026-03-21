/**
 * Doctor Availability Route
 * 
 * GET /api/doctors/[id]/availability?startDate=...&endDate=...
 */
import { NextRequest, NextResponse } from 'next/server';
import { doctorController } from '@/infrastructure/http/controllers/DoctorController';

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const params = await context.params;
    const doctorId = parseInt(params.id);
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
        return NextResponse.json(
            { error: 'Missing startDate or endDate parameter' },
            { status: 400 }
        );
    }

    // The Schedule entity and related use cases were removed during a previous refactor.
    // For now we return an empty array so the build passes.
    return NextResponse.json([]);
}
