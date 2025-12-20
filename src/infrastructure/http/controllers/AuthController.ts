/**
 * Auth Controller
 * 
 * Handles HTTP requests for authentication (login/register).
 */

import { NextRequest, NextResponse } from 'next/server';
import { container } from '../../di/DIContainer';
import { RegisterUserDTO } from '@/application/dto/RegisterUserDTO';
import { LoginUserDTO } from '@/application/dto/LoginUserDTO';
import { signToken } from '../../services/JWTService';

export class AuthController {
    async register(request: NextRequest): Promise<NextResponse> {
        try {
            const body: RegisterUserDTO = await request.json();

            const registerUseCase = container.getRegisterUserUseCase();
            const user = await registerUseCase.execute(body);

            // Generate JWT token
            const token = signToken({
                userId: user.id,
                email: user.email,
                role: user.role,
            });

            // Return user without password
            const userResponse = user.toJSON();

            return NextResponse.json(
                {
                    user: userResponse,
                    token,
                },
                { status: 201 }
            );
        } catch (error: any) {
            return NextResponse.json(
                { error: error.message || 'Registration failed' },
                { status: 400 }
            );
        }
    }

    async login(request: NextRequest): Promise<NextResponse> {
        try {
            const body: LoginUserDTO = await request.json();

            const loginUseCase = container.getLoginUserUseCase();
            const user = await loginUseCase.execute(body);

            // Generate JWT token
            const token = signToken({
                userId: user.id,
                email: user.email,
                role: user.role,
            });

            // Return user without password
            const userResponse = user.toJSON();

            return NextResponse.json({
                user: userResponse,
                token,
            });
        } catch (error: any) {
            return NextResponse.json(
                { error: error.message || 'Login failed' },
                { status: 401 }
            );
        }
    }
}

export const authController = new AuthController();
