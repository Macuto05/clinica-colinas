// @ts-nocheck
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Starting Migration...');

    // 1. Fetch Banks
    const bancos = await prisma.cuentaBancaria.findMany();
    console.log(`Found ${bancos.length} banks.`);

    // 2. Fetch Payments with observations like "Destino:"
    const pagos = await prisma.pago.findMany({
        where: {
            observaciones: {
                startsWith: 'Destino:'
            },
            cuentaBancariaId: null
        }
    });

    console.log(`Found ${pagos.length} payments to migrate.`);

    let migrated = 0;
    let skipped = 0;

    for (const pago of pagos) {
        const obs = pago.observaciones || '';
        // Format: "Destino: Banco Mercantil (9102)"
        const match = obs.match(/\((\d{4})\)$/); // Extract last 4 digits

        if (match && match[1]) {
            const lastDigits = match[1];

            // Find matching bank
            const banco = bancos.find(b => b.numeroCuenta.endsWith(lastDigits));

            if (banco) {
                await prisma.pago.update({
                    where: { pagoId: pago.pagoId },
                    data: { cuentaBancariaId: banco.cuentaId }
                });
                migrated++;
                process.stdout.write('.');
            } else {
                console.warn(`\nNo bank found for digits ${lastDigits} (Pago ${pago.pagoId})`);
                skipped++;
            }
        } else {
            console.warn(`\nCould not parse bank from: "${obs}" (Pago ${pago.pagoId})`);
            skipped++;
        }
    }

    console.log(`\nMigration Complete: ${migrated} migrated, ${skipped} skipped.`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
