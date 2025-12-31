import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seeding...');

    // 1. Roles
    const roles = [
        { nombre: 'ADMIN', descripcion: 'Administrador del sistema con acceso total' },
        { nombre: 'MEDICO', descripcion: 'Profesional de la salud' },
        { nombre: 'PACIENTE', descripcion: 'Usuario que recibe atención médica' },
        { nombre: 'RECEPCION', descripcion: 'Encargado de recepción y citas' },
        { nombre: 'ENFERMERIA', descripcion: 'Personal de enfermería' },
        { nombre: 'FARMACIA', descripcion: 'Encargado de dispensar medicamentos' },
        { nombre: 'ALMACEN', descripcion: 'Encargado de almacén e inventario' },
        { nombre: 'CAJA', descripcion: 'Encargado de caja y facturación' },
    ];

    for (const r of roles) {
        await prisma.rol.upsert({
            where: { nombre: r.nombre },
            update: {},
            create: r,
        });
    }
    console.log('✅ Roles seeded');

    // 2. Especialidades
    const especialidades = [
        { nombre: 'Medicina General', descripcion: 'Atención primaria' },
        { nombre: 'Cardiologia', descripcion: 'Enfermedades del corazón' },
        { nombre: 'Pediatria', descripcion: 'Atención a niños' },
        { nombre: 'Ginecologia', descripcion: 'Salud de la mujer' },
        { nombre: 'Traumatologia', descripcion: 'Lesiones óseas y musculares' },
        { nombre: 'Cirugia Plastica', descripcion: 'Procedimientos estéticos y reconstructivos' },
        { nombre: 'Gastroenterologia', descripcion: 'Sistema digestivo' },
    ];

    for (const e of especialidades) {
        await prisma.especialidad.upsert({
            where: { nombre: e.nombre },
            update: {},
            create: e,
        });
    }
    console.log('✅ Specialties seeded');

    // Password for all users: 123456
    const passwordHash = await bcrypt.hash('123456', 10);

    // 3. Admin User
    const adminRole = await prisma.rol.findUnique({ where: { nombre: 'ADMIN' } });
    if (adminRole) {
        await prisma.usuario.upsert({
            where: { email: 'admin@clinica.com' },
            update: {},
            create: {
                email: 'admin@clinica.com',
                passwordHash,
                rolId: adminRole.rolId,
                estado: 'ACTIVO',
                empleado: {
                    create: {
                        nombres: 'Super',
                        apellidos: 'Admin',
                        documentoIdentidad: 'V00000001',
                        estadoLaboral: 'ACTIVO',
                        fechaIngreso: new Date(),
                    }
                }
            },
        });
    }
    console.log('✅ Admin user seeded (admin@clinica.com / 123456)');

    // 4. Doctor Users
    // Standard helper to create a doctor
    const medicoRole = await prisma.rol.findUnique({ where: { nombre: 'MEDICO' } });
    if (medicoRole) {
        // Doctor 1
        const esp1 = await prisma.especialidad.findUnique({ where: { nombre: 'Cirugia Plastica' } });
        if (esp1) {
            await prisma.usuario.upsert({
                where: { email: 'doctor1@clinica.com' },
                update: {},
                create: {
                    email: 'doctor1@clinica.com',
                    passwordHash,
                    rolId: medicoRole.rolId,
                    empleado: {
                        create: {
                            nombres: 'Beverly Jackeline',
                            apellidos: 'Bruzual Ortiz',
                            documentoIdentidad: 'V12345678',
                            telefono: '0414-1234567',
                            medico: {
                                create: {
                                    especialidadId: esp1.especialidadId,
                                    numeroColegiatura: 'CMP-11111',
                                    activo: true
                                }
                            }
                        }
                    }
                }
            });
        }

        // Doctor 2
        const esp2 = await prisma.especialidad.findUnique({ where: { nombre: 'Gastroenterologia' } });
        if (esp2) {
            await prisma.usuario.upsert({
                where: { email: 'doctor2@clinica.com' },
                update: {},
                create: {
                    email: 'doctor2@clinica.com',
                    passwordHash,
                    rolId: medicoRole.rolId,
                    empleado: {
                        create: {
                            nombres: 'Luisana Maria',
                            apellidos: 'Rodriguez Pereo',
                            documentoIdentidad: 'V87654321',
                            telefono: '0412-7654321',
                            medico: {
                                create: {
                                    especialidadId: esp2.especialidadId,
                                    numeroColegiatura: 'CMP-22222',
                                    activo: true
                                }
                            }
                        }
                    }
                }
            });
        }
    }
    console.log('✅ Doctors seeded');

    // 5. Patient User
    const pacienteRole = await prisma.rol.findUnique({ where: { nombre: 'PACIENTE' } });
    if (pacienteRole) {
        await prisma.usuario.upsert({
            where: { email: 'paciente@clinica.com' },
            update: {},
            create: {
                email: 'paciente@clinica.com',
                passwordHash,
                rolId: pacienteRole.rolId,
                paciente: {
                    create: {
                        nombres: 'Juan',
                        apellidos: 'Perez',
                        documentoIdentidad: 'V11223344',
                        fechaNacimiento: new Date('1990-01-01'),
                        telefono: '0424-0000000',
                        direccion: 'Av. Principal 123'
                    }
                }
            }
        });
    }
    console.log('✅ Patient seeded (paciente@clinica.com / 123456)');

    // 6. Almacen User
    const almacenRole = await prisma.rol.findUnique({ where: { nombre: 'ALMACEN' } });
    if (almacenRole) {
        await prisma.usuario.upsert({
            where: { email: 'almacen@clinica.com' },
            update: {},
            create: {
                email: 'almacen@clinica.com',
                passwordHash,
                rolId: almacenRole.rolId,
                estado: 'ACTIVO',
                empleado: {
                    create: {
                        nombres: 'Roberto',
                        apellidos: 'Almacen',
                        documentoIdentidad: 'V99887766',
                        fechaIngreso: new Date(),
                        estadoLaboral: 'ACTIVO'
                    }
                }
            }
        });
    }
    console.log('✅ Almacen user seeded (almacen@clinica.com / 123456)');

    // 7. Caja User
    const cajaRole = await prisma.rol.findUnique({ where: { nombre: 'CAJA' } });
    if (cajaRole) {
        await prisma.usuario.upsert({
            where: { email: 'caja@clinica.com' },
            update: {},
            create: {
                email: 'caja@clinica.com',
                passwordHash,
                rolId: cajaRole.rolId,
                estado: 'ACTIVO',
                empleado: {
                    create: {
                        nombres: 'Maria',
                        apellidos: 'Cajera',
                        documentoIdentidad: 'V11122233',
                        fechaIngreso: new Date(),
                        estadoLaboral: 'ACTIVO'
                    }
                }
            }
        });
    }
    console.log('✅ Caja user seeded (caja@clinica.com / 123456)');

    console.log('🚀 Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
