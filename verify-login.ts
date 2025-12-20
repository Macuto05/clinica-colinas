
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@clinica.com';
    console.log(`Searching for user with email: '${email}'`);

    const user = await prisma.usuario.findUnique({
        where: { email: email },
        include: { rol: true }
    });

    if (user) {
        console.log('✅ User FOUND:');
        console.log('ID:', user.usuarioId);
        console.log('Email:', user.email);
        console.log('Role:', user.rol?.nombre);
        console.log('PasswordHash:', user.passwordHash);
    } else {
        console.log('❌ User NOT found.');

        // List all users to see what's there
        const allUsers = await prisma.usuario.findMany({ select: { email: true } });
        console.log('Available emails:', allUsers.map(u => `'${u.email}'`));
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
