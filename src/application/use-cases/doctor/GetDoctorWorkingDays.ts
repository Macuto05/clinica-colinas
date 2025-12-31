import prisma from "@/infrastructure/database/prisma/client";
import { DiaSemana } from "@prisma/client";

export class GetDoctorWorkingDays {
    async execute(medicoId: number): Promise<number[]> {
        const schedule = await prisma.medicoHorario.findFirst({
            where: {
                medicoId: BigInt(medicoId),
            },
            include: {
                detalles: true,
            },
        });

        if (!schedule || !schedule.detalles) {
            return [];
        }

        const daysMap: Record<string, number> = {
            [DiaSemana.DOMINGO]: 0,
            [DiaSemana.LUNES]: 1,
            [DiaSemana.MARTES]: 2,
            [DiaSemana.MIERCOLES]: 3,
            [DiaSemana.JUEVES]: 4,
            [DiaSemana.VIERNES]: 5,
            [DiaSemana.SABADO]: 6,
        };

        const workingDays = schedule.detalles.map((detalle: any) => daysMap[detalle.diaSemana]);

        // Remove duplicates and sort
        return Array.from(new Set(workingDays as number[])).sort((a, b) => a - b);
    }
}
