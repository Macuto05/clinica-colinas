const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log("Creating Admin (JS mode)...");

    // 1. Ensure Role ADMIN
    try {
        const role = await prisma.rol.upsert({
            where: { nombre: 'ADMIN' },
            update: {},
            create: {
                nombre: 'ADMIN',
                descripcion: 'Administrador del Sistema'
            }
        });
        console.log(`Role ADMIN ready (ID: ${role.rolId})`);

        // 2. Ensure Admin User
        const hash = await bcrypt.hash('Admin123!', 10);
        const user = await prisma.usuario.upsert({
            where: { email: 'admin@clinica.com' },
            update: { passwordHash: hash },
            create: {
                email: 'admin@clinica.com',
                passwordHash: hash,
                rolId: role.rolId,
                estado: 'ACTIVO'
            }
        });

        console.log("✅ Admin created:");
        console.log(`   Email: ${user.email}`);
        console.log(`   Role ID: ${user.rolId}`);
        console.log(`   Password: Admin123!`);
    } catch (e) {
        console.error("Error logic:", e);
    }
}

main()
    .catch(e => console.error("Fatal:", e))
    .finally(async () => {
        await prisma.$disconnect();
    });
