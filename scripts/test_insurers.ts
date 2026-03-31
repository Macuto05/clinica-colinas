import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
(BigInt.prototype as any).toJSON = function () { return this.toString() };

async function main() {
    try {
        const aseguradoras = await prisma.aseguradora.findMany();
        console.log("DB Aseguradoras:", JSON.stringify(aseguradoras, null, 2));
    } catch (e) {
        console.error("DB Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}
main();
