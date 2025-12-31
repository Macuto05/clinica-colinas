
import { NextRequest, NextResponse } from "next/server";
import { GetAvailableSlotsUseCase } from "@/application/use-cases/appointment/GetAvailableSlotsUseCase";
import { parse } from "date-fns";

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const medicoId = searchParams.get('medicoId') || searchParams.get('doctorId');
        const dateParam = searchParams.get('date');

        // ...

        if (!medicoId || !dateParam) {
            return NextResponse.json(
                { error: "medicoId and date are required" },
                { status: 400 }
            );
        }

        // Parse date as local time (00:00:00) strictly from YYYY-MM-DD
        const date = parse(dateParam, 'yyyy-MM-dd', new Date());

        if (isNaN(date.getTime())) {
            return NextResponse.json(
                { error: "Invalid date format" },
                { status: 400 }
            );
        }

        const useCase = new GetAvailableSlotsUseCase();
        const slots = await useCase.execute(Number(medicoId), date);

        return NextResponse.json({ slots });

    } catch (error) {
        console.error("Error fetching slots:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
