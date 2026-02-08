
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    try {
        const patient = await prisma.paciente.findFirst({
            where: { nombres: { contains: 'Marcus' } }
        });

        if (!patient) {
            console.log("Patient not found");
            return;
        }

        console.log(`Checking history for: ${patient.nombres} ${patient.apellidos} (ID: ${patient.pacienteId})`);

        // 1. Check Payments
        const pag = await prisma.pago.findMany({
            where: {
                factura: {
                    cita: { pacienteId: patient.pacienteId }
                }
            },
            include: { factura: true }
        });

        console.log(`\n--- PAYMENTS FOUND: ${pag.length} ---`);
        console.log(JSON.stringify(pag, (key, value) => typeof value === 'bigint' ? value.toString() : value, 2));

        // 2. Check Invoices
        const inv = await prisma.factura.findMany({
            where: {
                cita: { pacienteId: patient.pacienteId }
            }
        });

        console.log(`\n--- INVOICES FOUND: ${inv.length} ---`);
        console.log(JSON.stringify(inv, (key, value) => typeof value === 'bigint' ? value.toString() : value, 2));

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
