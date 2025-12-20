import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Start seeding...');

    // 1. Roles
    const roles = ['ADMIN', 'MEDICO', 'PACIENTE', 'ENFERMERIA', 'RECEPCION', 'FARMACIA', 'LABORATORIO'];

    for (const nombre of roles) {
        // Upsert to avoid duplicates if re-running
        await prisma.rol.upsert({
            where: { nombre }, // Unique field
            update: {},
            create: {
                nombre,
                descripcion: `Rol del sistema: ${nombre}`
            },
        });
    }
    console.log('✅ Roles synced');

    // 2. Admin User
    const adminRol = await prisma.rol.findUnique({ where: { nombre: 'ADMIN' } });

    if (adminRol) {
        const passwordHash = await bcrypt.hash('Admin123!', 10);
        const adminEmail = 'admin@clinica.com';

        await prisma.usuario.upsert({
            where: { email: adminEmail },
            update: {},
            create: {
                email: adminEmail,
                passwordHash,
                rolId: adminRol.rolId,
                estado: 'ACTIVO',
            },
        });
        console.log('✅ Admin user synced (admin@clinica.com / Admin123!)');
    } else {
        console.error('❌ Admin Role not found, cannot create Admin user.');
    }

    console.log('🌱 Seed finished.');
}

main()
    .catch((e) => {
        console.error('❌ Error in seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
