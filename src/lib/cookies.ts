import { serialize } from "cookie";
import { NextResponse } from "next/server";

export const setTokenCookie = (res: NextResponse, token: string) => {
    const cookie = serialize("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    res.headers.append("Set-Cookie", cookie);
};

export const clearTokenCookie = (res: NextResponse) => {
    const cookie = serialize("token", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: -1,
    });
    res.headers.append("Set-Cookie", cookie);
};
