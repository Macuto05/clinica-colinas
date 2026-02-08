
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting legacy debt cleanup...');

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
            console.log(`Fixing Invoice #${app.factura.numeroFactura} for Appointment #${app.citaId} (Status: ${app.estadoCita})`);

            await prisma.factura.update({
                where: { facturaId: app.factura.facturaId },
                data: {
                    estadoFactura: 'ANULADA',
                    saldoPendiente: 0,
                    observaciones: app.factura.observaciones
                        ? `${app.factura.observaciones} | Anulada por script de limpieza (Cita ${app.estadoCita})`
                        : `Anulada por script de limpieza (Cita ${app.estadoCita})`
                }
            });

            fixedCount++;
        }
    }

    console.log(`Cleanup complete. Fixed ${fixedCount} invoices.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
