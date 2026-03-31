/**
 * Prisma Client Configuration
 * 
 * Uses @prisma/adapter-pg with transaction mode pooler (port 6543).
 * Transaction mode is REQUIRED for serverless / Next.js API routes because:
 * - Session mode (port 5432) gives each client a dedicated connection and
 *   quickly hits the pool_size limit when many API routes run concurrently.
 * - Transaction mode multiplexes many API calls over a small set of real DB
 *   connections, which is exactly what serverless needs.
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

declare global {
    // eslint-disable-next-line no-var
    var __prisma: PrismaClient | undefined;
    // eslint-disable-next-line no-var
    var __pgPool: Pool | undefined;
}

// Reuse the Pool across HMR reloads in development to avoid exhausting connections
if (!global.__pgPool) {
    global.__pgPool = new Pool({
        connectionString: process.env.DATABASE_URL,
        max: 5, // keep a small pool; Supabase transaction mode handles the rest
    });
}

const adapter = new PrismaPg(global.__pgPool);

export const prisma = global.__prisma ?? new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
    global.__prisma = prisma;
}

export default prisma;
