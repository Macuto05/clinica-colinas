
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("--- DIAGNOSTIC START ---");

        // 1. Check Appointment Count
        const count = await prisma.citaMedica.count();
        console.log(`Total Citas: ${count}`);

        // 2. List recent appointments
        const recent = await prisma.citaMedica.findMany({
            take: 5,
            orderBy: { fechaCita: 'desc' },
            include: {
                medico: { include: { empleado: true } },
                paciente: true
            }
        });

        console.log("\n--- RECENT APPOINTMENTS ---");
        recent.forEach(c => {
            console.log(`ID: ${c.citaId}`);
            console.log(`Date: ${c.fechaCita.toISOString()} (Localish: ${c.fechaCita.toLocaleString()})`);
            console.log(`Doctor: ${c.medico.empleado.nombres} (ID: ${c.medicoId})`);
            console.log(`Patient: ${c.paciente.nombres}`);
            console.log(`Status: ${c.estadoCita}`);
            console.log("-------------------");
        });

        // 3. Check Doctors
        console.log("\n--- DOCTORS ---");
        const doctors = await prisma.medico.findMany({
            include: { empleado: true }
        });
        doctors.forEach(d => {
            console.log(`DocID: ${d.medicoId}, Name: ${d.empleado.nombres}, UserID: ${d.empleado.usuarioId}`);
        });

        console.log("--- DIAGNOSTIC END ---");

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
