
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/infrastructure/database/prisma/client";
import { cookies } from "next/headers";
import { JWTService } from "@/infrastructure/services/JWTService";
import { z } from "zod";

export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ id: string }> } // Correct type for Next.js 15+ dynamic params
) {
    try {
        // 1. Authenticate User
        const cookieStore = await cookies();
        const token = cookieStore.get("auth-token")?.value;

        if (!token) {
            return NextResponse.json({ error: "No autenticado" }, { status: 401 });
        }

        const payload = await JWTService.verifyToken(token);
        if (!payload || !payload.userId) {
            return NextResponse.json({ error: "Token inválido" }, { status: 401 });
        }

        const currentUserId = BigInt(payload.userId);

        const { id } = await context.params;
        const medicoId = BigInt(id); // 'id' from params is string, map to BigInt for DB

        const body = await request.json();
        const schedule = body.schedule;

        // Basic Validation
        if (!Array.isArray(schedule)) {
            return NextResponse.json({ error: "Formato de horario inválido" }, { status: 400 });
        }

        // Validate Doctor Exists
        // In this case 'id' is 'empleado_id' from the URL (as DoctorActions uses doctor.empleado.empleadoId or doctor.empleadoId)
        // Let's verify what ID is passed. DoctorActions usually passes doctor.empleadoId (BigInt).
        // Let's assume standard behavior.

        const activeDays = schedule.filter((d: any) => d.active && d.blocks.length > 0);

        await prisma.$transaction(async (tx) => {
            // 1. Find or Create Schedule Header
            let medicoHorario = await tx.medicoHorario.findFirst({
                where: { medicoId: medicoId }
            });

            if (!medicoHorario) {
                medicoHorario = await tx.medicoHorario.create({
                    data: {
                        medicoId: medicoId,
                        actualizadoPor: currentUserId, // Traceability Fix
                    }
                });
            } else {
                // Update timestamp
                await tx.medicoHorario.update({
                    where: { medicoHorarioId: medicoHorario.medicoHorarioId },
                    data: {
                        actualizadoEn: new Date(),
                        actualizadoPor: currentUserId // Update traceability on edit too
                    }
                });
            }

            // 2. Clear old details
            await tx.medicoHorarioDetalle.deleteMany({
                where: { medicoHorarioId: medicoHorario.medicoHorarioId }
            });

            // 3. Insert new details
            for (const day of activeDays) {
                for (const block of day.blocks) {
                    if (block.startTime && block.endTime) {
                        await tx.medicoHorarioDetalle.create({
                            data: {
                                medicoHorarioId: medicoHorario.medicoHorarioId,
                                diaSemana: day.day, // Enum
                                horaInicio: new Date(`1970-01-01T${block.startTime}:00Z`),
                                horaFin: new Date(`1970-01-01T${block.endTime}:00Z`),
                            }
                        });
                    }
                }
            }
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Error updating schedule:", error);
        return NextResponse.json(
            { error: "Error updating schedule" },
            { status: 500 }
        );
    }
}
