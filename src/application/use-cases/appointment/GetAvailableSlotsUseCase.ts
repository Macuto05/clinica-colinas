import prisma from "@/infrastructure/database/prisma/client";
import { addMinutes, getDay } from "date-fns";
import { CitaEstado } from "@prisma/client"; // Removed DiaSemana

export interface TimeSlot {
    start: string; // Changed to string HH:mm
    end: string;
    available: boolean;
}

export class GetAvailableSlotsUseCase {
    private readonly SLOT_DURATION = 45; // minutes

    async execute(medicoId: number, date: Date): Promise<TimeSlot[]> {
        // 1. Get Doctor's Schedule for the specific day of week
        // Use strings directly to avoid Enum issues
        const daysMap = [
            'DOMINGO',
            'LUNES',
            'MARTES',
            'MIERCOLES',
            'JUEVES',
            'VIERNES',
            'SABADO'
        ];
        const dayOfWeek = daysMap[getDay(date)];

        // Fetch the active schedule for the doctor
        const schedule = await prisma.medicoHorario.findFirst({
            where: {
                medicoId: BigInt(medicoId),
            },
            orderBy: { medicoHorarioId: 'desc' },
            include: {
                detalles: true
            }
        });

        if (!schedule || !schedule.detalles) {
            return []; // No schedule for this day
        }

        // Defensive filter: Trim and UpperCase
        const dailyDetails = schedule.detalles.filter((d: any) =>
            d.diaSemana && d.diaSemana.trim().toUpperCase() === dayOfWeek
        );

        if (dailyDetails.length === 0) {
            return [];
        }

        // 2. Generate Theoretical Slots
        const theoreticalSlots: TimeSlot[] = [];

        // Helper to format HH:mm
        const formatTime = (date: Date) => {
            return date.toISOString().substring(11, 16);
        };

        for (const block of dailyDetails) {
            let current = new Date(date);
            current.setUTCHours(block.horaInicio.getUTCHours(), block.horaInicio.getUTCMinutes(), 0, 0);

            let end = new Date(date);
            if (block.horaFin) {
                end.setUTCHours(block.horaFin.getUTCHours(), block.horaFin.getUTCMinutes(), 0, 0);
            } else {
                // Fallback
                end = addMinutes(current, 8 * 60);
            }

            while (addMinutes(current, this.SLOT_DURATION) <= end) {
                const slotEnd = addMinutes(current, this.SLOT_DURATION);
                theoreticalSlots.push({
                    start: formatTime(current), // Return HH:mm
                    end: formatTime(slotEnd),
                    available: true
                });
                current = slotEnd;
            }
        }

        // 3. Mark Occupied Slots
        const appointments = await prisma.citaMedica.findMany({
            where: {
                medicoId: BigInt(medicoId),
                fechaCita: date, // Prisma Date comparison matches YYYY-MM-DD
                estadoCita: {
                    not: CitaEstado.CANCELADA
                }
            }
        });

        return theoreticalSlots.map(slot => {
            // Check overlap
            const slotStartHours = parseInt(slot.start.split(':')[0]);
            const slotStartMins = parseInt(slot.start.split(':')[1]);

            const slotStartTime = new Date(date);
            slotStartTime.setUTCHours(slotStartHours, slotStartMins, 0, 0);
            const slotEndTime = addMinutes(slotStartTime, this.SLOT_DURATION);

            const isBusy = appointments.some(app => {
                const appStart = new Date(app.fechaCita); // Base date
                // Ensure we use the date part from fechaCita and time part from horaInicio correctly
                // Assuming horaInicio is 1970-01-01 HH:MM UTC
                const appTime = new Date(app.horaInicio);
                appStart.setUTCHours(appTime.getUTCHours(), appTime.getUTCMinutes(), 0, 0);

                const appEnd = addMinutes(appStart, this.SLOT_DURATION);

                return (slotStartTime < appEnd && slotEndTime > appStart);
            });

            return {
                ...slot,
                available: !isBusy
            };
        });
    }
}
