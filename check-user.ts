
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const email = 'danieljccastillo@gmail.com';
    const user = await prisma.usuario.findUnique({
        where: { email },
        include: { rol: true }
    });

    if (user) {
        console.log(`✅ User found: ${email}`);
        console.log(`   Role: ${user.rol.nombre}`);
    } else {
        console.log(`❌ User NOT found: ${email}`);
    }

    const admin = await prisma.usuario.findUnique({
        where: { email: 'admin@clinica.com' },
        include: { rol: true }
    });
    if (admin) {
        console.log(`✅ Admin user check: FOUND (${admin.rol.nombre})`);
    } else {
        console.log("❌ Admin user 'admin@clinica.com' NOT found.");
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
