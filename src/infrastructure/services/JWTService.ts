/**
 * JWT Service
 * 
 * Service for JWT token generation and verification.
 */

import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-this';
const secretKey = new TextEncoder().encode(JWT_SECRET);

export interface TokenPayload {
    userId: number;
    email: string;
    role: string;
    [key: string]: any; // Allow extra claims
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
