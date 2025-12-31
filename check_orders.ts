
import { prisma } from "./src/infrastructure/database/prisma/client";

async function main() {
    console.log("Checking PedidoCompra table...");
    const orders = await prisma.pedidoCompra.findMany({
        include: { detalles: true }
    });
    console.log(`Found ${orders.length} orders in DB.`);
    orders.forEach(o => {
        console.log(`- ID: ${o.pedidoId}, Status: ${o.estado}, Date: ${o.fechaSolicitud}, Details: ${o.detalles.length}`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
