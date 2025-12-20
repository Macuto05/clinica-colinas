import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log("Creating Admin...");

    // 1. Ensure Role ADMIN
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
        update: {
            // Update password if exists to ensure we know it
            passwordHash: hash
        },
        create: {
            email: 'admin@clinica.com',
            passwordHash: hash,
            rolId: role.rolId,
            estado: 'ACTIVO'
        }
    });

    console.log("✅ Admin user created/updated:");
    console.log(`   Email: ${user.email}`);
    console.log(`   Password: Admin123!`);
    console.log(`   Role ID: ${user.rolId}`);
}

main()
    .catch(e => {
        console.error("Error creating admin:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
