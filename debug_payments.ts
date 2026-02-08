
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Querying payments with status VALIDADO or RECHAZADO, ordered by fechaRegistro DESC...");

    // Mimic the API query exactly
    const pagos = await prisma.pago.findMany({
        where: { estadoPago: { in: ['VALIDADO', 'RECHAZADO'] } },
        orderBy: { fechaRegistro: 'desc' },
        take: 20,
        select: {
            pagoId: true,
            fechaRegistro: true,
            fechaPago: true
        }
    });

    console.log("--- Results ---");
    pagos.forEach((p, i) => {
        const regDate = p.fechaRegistro ? new Date(p.fechaRegistro) : null;
        const regStr = regDate ? regDate.toLocaleDateString('es-VE', { timeZone: 'America/Caracas' }) : 'NULL';
        const iso = regDate ? regDate.toISOString() : 'NULL';

        console.log(`#${i + 1} ID:${p.pagoId} | Reg(ISO): ${iso} | Reg(VE): ${regStr}`);
    });
}

main().catch(console.error).finally(() => prisma.$disconnect());
