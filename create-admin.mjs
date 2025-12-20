import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting ESM Admin Creation...');

    try {
        const role = await prisma.rol.upsert({
            where: { nombre: 'ADMIN' },
            update: {},
            create: {
                nombre: 'ADMIN',
                descripcion: 'Admin Role'
            }
        });
        console.log('Role synced:', role.rolId);

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
        console.log('✅ Admin User Created:', user.email);
    } catch (err) {
        console.error('❌ Error:', err);
    }
}

main().finally(async () => {
    await prisma.$disconnect();
});
