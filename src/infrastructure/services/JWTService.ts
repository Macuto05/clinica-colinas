/**
 * JWT Service
 * 
 * Service for JWT token generation and verification.
 */

import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || "default_development_secret_for_jwt_which_should_be_long_enough";
if (!process.env.JWT_SECRET) {
    console.warn('WARN: JWT_SECRET environment variable is missing. Using default fallback for development. Set it in Vercel.');
}
const secretKey = new TextEncoder().encode(JWT_SECRET);

export interface TokenPayload {
    userId: number;
    email: string;
    role: string;
    patientId?: number;
    employeeId?: number;
    sub?: string;
    iat?: number;
    exp?: number;
}

export class JWTService {
    static async generateToken(payload: TokenPayload): Promise<string> {
        return new SignJWT({ ...payload })
            .setProtectedHeader({ alg: 'HS256' })
            .setExpirationTime('7d')
            .sign(secretKey);
    }

    static async verifyToken(token: string): Promise<TokenPayload | null> {
        try {
            const { payload } = await jwtVerify(token, secretKey);
            return payload as unknown as TokenPayload;
        } catch (err) {
            return null;
        }
    }
}
