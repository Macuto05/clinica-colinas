
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const admin = await prisma.usuario.findUnique({
        where: { email: 'admin@clinica.com' },
        include: { rol: true }
    });

    if (admin) {
        console.log("RAW ADMIN DATA:", JSON.stringify(admin, null, 2));
        console.log(`Role value type: ${typeof admin.rol}`);
        console.log(`Role name: '${admin.rol.nombre}'`);
        // console.log(`Is 'ADMIN'? ${admin.role === 'ADMIN'}`); // Logic depends on helper or string check
    } else {
        console.log("❌ Admin user NOT found.");
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
