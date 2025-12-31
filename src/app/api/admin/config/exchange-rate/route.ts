import { NextResponse } from "next/server";
import { ExchangeRateService } from "@/infrastructure/services/ExchangeRateService";

const service = new ExchangeRateService();

export async function GET() {
    try {
        const rate = await service.getCurrentRate();
        return NextResponse.json({ rate });
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to fetch exchange rate" },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { valor } = body;

        if (!valor || isNaN(valor)) {
            return NextResponse.json({ error: "Invalid value" }, { status: 400 });
        }

        const rate = await service.updateManualRate(Number(valor));
        return NextResponse.json({ rate });
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to update exchange rate" },
            { status: 500 }
        );
    }
}
