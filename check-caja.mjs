import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.usuario.findMany({
        include: { rol: true }
    });
    console.log("Total users:", users.length);
    const targetUsers = users.filter(u =>
        (u.email && u.email.toLowerCase().includes('marcos')) ||
        (u.rol && u.rol.nombre && u.rol.nombre.toLowerCase().includes('caja'))
    );

    targetUsers.forEach(u => {
        console.log(`User: ${u.email}`);
        console.log(`Role: "${u.rol ? u.rol.nombre : 'NULL'}"`);
        console.log(`ID: ${u.usuarioId}`);
        console.log('---');
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
