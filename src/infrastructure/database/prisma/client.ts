/**
 * Prisma Client Configuration for Prisma 7
 * 
 * Prisma 7 requires using a database adapter.
 * We use @prisma/adapter-pg with node-postgres (pg) for PostgreSQL.
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Create PostgreSQL connection pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Create Prisma adapter
const adapter = new PrismaPg(pool);

// Initialize Prisma Client with adapter
export const prisma = globalForPrisma.prisma || new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Force reload comment for Next.js HMR
if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}

// Forced reload for Prisma Client update
export default prisma;
