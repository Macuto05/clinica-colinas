
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
    try {
        const total = await prisma.citaMedica.count();
        console.log(`Total Appointments: ${total}`);

        const last5 = await prisma.citaMedica.findMany({
            take: 5,
            orderBy: { fechaCita: 'desc' },
            include: { paciente: true }
        });

        console.log('Last 5 Appointments:');
        last5.forEach(app => {
            console.log(`- ID: ${app.citaId}, Date: ${app.fechaCita.toISOString()}, Patient: ${app.paciente.nombres}`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

check();
