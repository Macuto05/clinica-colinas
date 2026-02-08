
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const doc = 'V-29838893'; // Marcus
    const patient = await prisma.paciente.findFirst({
        where: { documentoIdentidad: doc }
    });

    if (!patient) {
        console.log(`Paciente ${doc} no encontrado.`);
        return;
    }

    console.log(`Paciente: ${patient.nombres} ${patient.apellidos} (ID: ${patient.pacienteId})`);

    const appointments = await prisma.citaMedica.findMany({
        where: { pacienteId: patient.pacienteId },
        include: {
            diagnostico: true
        },
        orderBy: { fechaCita: 'desc' }
    });

    console.log(`Encontradas ${appointments.length} citas:`);
    appointments.forEach(app => {
        console.log(`- ID: ${app.citaId} | Fecha: ${app.fechaCita.toISOString()} | Status: ${app.estadoCita} | Diag: ${app.diagnostico ? 'YES' : 'NO'}`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
