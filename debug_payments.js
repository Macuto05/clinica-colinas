
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const pagos = await prisma.pago.findMany({
        where: { estadoPago: { in: ['VALIDADO', 'RECHAZADO'] } },
        orderBy: { fechaRegistro: 'desc' },
        take: 10,
        select: {
            pagoId: true,
            monto: true,
            estadoPago: true,
            fechaPago: true,
            fechaRegistro: true
        }
    });

    console.log("--- Top 10 Payments (Ordered by fechaRegistro DESC) ---");
    pagos.forEach(p => {
        console.log(`ID: ${p.pagoId.toString().padEnd(4)} | Reg: ${p.fechaRegistro.toISOString()} | Pago: ${p.fechaPago.toISOString()} | Estado: ${p.estadoPago}`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
