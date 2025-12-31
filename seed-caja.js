const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding Caja User...');

    // Create Role
    const role = await prisma.rol.upsert({
        where: { nombre: 'CAJA' },
        update: {},
        create: {
            nombre: 'CAJA',
            descripcion: 'Encargado de caja y facturación'
        }
    });
    console.log('Role CAJA ensured.');

    // Create User
    const passwordHash = await bcrypt.hash('123456', 10);

    await prisma.usuario.upsert({
        where: { email: 'caja@clinica.com' },
        update: {},
        create: {
            email: 'caja@clinica.com',
            passwordHash,
            rolId: role.rolId,
            estado: 'ACTIVO',
            empleado: {
                create: {
                    nombres: 'Cajero', // Shortened
                    apellidos: 'Principal',
                    documentoIdentidad: 'V99999999',
                    fechaIngreso: new Date(),
                    estadoLaboral: 'ACTIVO'
                }
            }
        }
    });

    console.log('User caja@clinica.com ensured.');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => await prisma.$disconnect());
