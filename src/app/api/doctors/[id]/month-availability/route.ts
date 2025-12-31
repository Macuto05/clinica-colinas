import { NextRequest, NextResponse } from 'next/server';
import { GetDoctorMonthlyAvailability } from '@/application/use-cases/doctor/GetDoctorMonthlyAvailability';

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> } // Fix for Next.js 15 async params
) {
    try {
        const { id } = await context.params;
        const doctorId = parseInt(id);
        const { searchParams } = new URL(request.url);
        const year = parseInt(searchParams.get('year') || '');
        const month = parseInt(searchParams.get('month') || '');

        if (isNaN(doctorId) || isNaN(year) || isNaN(month)) {
            return NextResponse.json(
                { error: 'Invalid parameters' },
                { status: 400 }
            );
        }

        const useCase = new GetDoctorMonthlyAvailability();
        const availability = await useCase.execute(doctorId, year, month);

        return NextResponse.json({ availability });
    } catch (error: any) {
        console.error('Error fetching monthly availability:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch availability' },
            { status: 500 }
        );
    }
}
