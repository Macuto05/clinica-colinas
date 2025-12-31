
import { PrismaAppointmentRepository } from './src/infrastructure/database/prisma/repositories/PrismaAppointmentRepository';
import { Appointment } from './src/domain/entities/Appointment';

async function main() {
    const repo = new PrismaAppointmentRepository();
    // Assuming appointment ID 1 exists and has a reason
    const appointment = await repo.findById(1);

    if (appointment) {
        console.log("Appointment Found:");
        console.log(JSON.stringify(appointment.toJSON(), null, 2));
    } else {
        console.log("Appointment 1 not found");
    }
}

main().catch(console.error);
