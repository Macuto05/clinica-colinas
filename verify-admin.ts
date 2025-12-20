
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const admin = await prisma.usuario.findUnique({
        where: { email: 'admin@clinica.com' },
        include: { rol: true }
    });

    if (admin) {
        console.log("✅ Admin user verified:");
        console.log(`   ID: ${admin.usuarioId}`);
        console.log(`   Email: ${admin.email}`);
        console.log(`   Role: ${admin.rol.nombre}`); // Role is in relation
    } else {
        console.log("❌ Admin user NOT found in DB!");
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
