
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🌱 Starting CONFIG seeding...');

    // 1. Configuration
    const config = await prisma.configuracion.upsert({
        where: { clave: 'PRECIO_CONSULTA' },
        update: {},
        create: {
            clave: 'PRECIO_CONSULTA',
            valor: '50',
            descripcion: 'Precio base de la consulta médica en USD'
        }
    });
    console.log('✅ Config seeded:', config);

    // 2. Exchange Rate
    const existingRate = await prisma.tasaDeCambio.findFirst({ orderBy: { fecha: 'desc' } });
    if (!existingRate) {
        await prisma.tasaDeCambio.create({
            data: {
                moneda: 'USD',
                valor: 50.00,
                fuente: 'BCV',
                esAutomatica: false
            }
        });
        console.log('✅ Rate seeded');
    }

    // 3. Bank Accounts
    const bank = await prisma.cuentaBancaria.upsert({
        where: { numeroCuenta: '0105-0000-00-1234567890' },
        update: {},
        create: {
            banco: 'Banco Mercantil',
            numeroCuenta: '0105-0000-00-1234567890',
            titular: 'Clinica Colinas CA',
            rifTitular: 'J-12345678-0',
            tipo: 'CORRIENTE',
            activa: true
        }
    });
    console.log('✅ Bank Account seeded:', bank);
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
