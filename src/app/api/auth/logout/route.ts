import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
    try {
        // Remove auth cookie
        (await cookies()).delete("auth-token");

        return NextResponse.json({
            success: true,
            message: "Logged out successfully",
        });
    } catch (error) {
        return NextResponse.json(
            { error: "Error logging out" },
            { status: 500 }
        );
    }
}
