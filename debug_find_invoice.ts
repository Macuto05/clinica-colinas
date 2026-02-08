import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const factura = await prisma.factura.findFirst({
        where: { estadoFactura: 'PENDIENTE' },
        select: { facturaId: true }
    });
    console.log("FacturaID:", factura?.facturaId.toString());
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
