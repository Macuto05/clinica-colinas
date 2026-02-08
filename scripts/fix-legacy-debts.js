
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('Starting legacy debt cleanup (JS)...');

    try {
        // Find all appointments that are CANCELLED or NO_SHOW
        const appointments = await prisma.citaMedica.findMany({
            where: {
                estadoCita: {
                    in: ['CANCELADA', 'NO_ASISTIO']
                }
            },
            include: {
                factura: true
            }
        });

        console.log(`Found ${appointments.length} cancelled/no-show appointments.`);

        let fixedCount = 0;

        for (const app of appointments) {
            if (app.factura && app.factura.estadoFactura === 'PENDIENTE') {
                const newObs = app.factura.observaciones
                    ? `${app.factura.observaciones} | Anulada por script de limpieza (Cita ${app.estadoCita})`
                    : `Anulada por script de limpieza (Cita ${app.estadoCita})`;

                console.log(`Fixing Invoice #${app.factura.numeroFactura} (ID: ${app.factura.facturaId}) for Appointment #${app.citaId}`);

                // Use update many or unique? unique is better
                await prisma.factura.update({
                    where: { facturaId: app.factura.facturaId },
                    data: {
                        estadoFactura: 'ANULADA',
                        saldoPendiente: 0,
                        observaciones: newObs
                    }
                });

                fixedCount++;
            }
        }

        console.log(`Cleanup complete. Fixed ${fixedCount} invoices.`);

    } catch (error) {
        console.error("Error during cleanup:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
