import 'dotenv/config';
import { PrismaAppointmentRepository } from "./src/infrastructure/database/prisma/repositories/PrismaAppointmentRepository";

async function verifyAdminAppointments() {
    console.log("🔍 Verifying Appointment Repository: findAllWithDetails...");

    const repo = new PrismaAppointmentRepository();

    try {
        const appointments = await repo.findAllWithDetails();

        console.log(`✅ Found ${appointments.length} appointments.`);

        if (appointments.length > 0) {
            const first = appointments[0];
            console.log("📝 Sample Appointment Data:");
            console.log(JSON.stringify(first.toJSON(), null, 2));

            if (first.patientName && first.doctorName) {
                console.log("✅ SUCCESS: Patient and Doctor names are present.");
            } else {
                console.error("❌ FAILURE: Patient or Doctor names are missing.");
            }
        } else {
            console.log("⚠️ No appointments found to verify details. Please verify manually or seed data.");
        }

    } catch (error) {
        console.error("❌ CRTICIAL ERROR during verification:", error);
    }
}

verifyAdminAppointments();
