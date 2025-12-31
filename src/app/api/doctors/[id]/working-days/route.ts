import { NextRequest, NextResponse } from 'next/server';
import { GetDoctorWorkingDays } from '@/application/use-cases/doctor/GetDoctorWorkingDays';

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const doctorId = parseInt(id);

        if (isNaN(doctorId)) {
            return NextResponse.json(
                { error: 'Invalid doctor ID' },
                { status: 400 }
            );
        }

        const useCase = new GetDoctorWorkingDays();
        const workingDays = await useCase.execute(doctorId);

        return NextResponse.json({ workingDays });
    } catch (error: any) {
        console.error('Error fetching working days:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch working days' },
            { status: 500 }
        );
    }
}
