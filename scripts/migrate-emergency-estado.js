/**
 * Direct SQL migration script to apply the EmergenciaEstado enum changes
 * that prisma db push cannot do through pgBouncer transaction mode.
 * 
 * Run with: node scripts/migrate-emergency-estado.js
 */

const { Pool } = require('pg');
require('dotenv').config();

// Use the DIRECT database URL (not the pgBouncer transaction mode)
// For Supabase, the direct connection is on port 5432 with db.xxx.supabase.co
const DIRECT_URL = process.env.DIRECT_URL || process.env.DATABASE_URL?.replace(':6543/', ':5432/').replace('pooler.supabase.com', 'db.' + process.env.DATABASE_URL?.match(/postgres\.([^:]+)/)?.[1] + '.supabase.co').replace('?pgbouncer=true', '');

async function migrate() {
    console.log('Connecting to database...');
    const pool = new Pool({ connectionString: DIRECT_URL });
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        console.log('Transaction started.');

        // Step 1: Add ATENDIDO to the EmergenciaEstado enum
        try {
            await client.query(`ALTER TYPE "EmergenciaEstado" ADD VALUE IF NOT EXISTS 'ATENDIDO'`);
            console.log('✓ Added ATENDIDO to EmergenciaEstado enum');
        } catch (e) {
            console.log('   ATENDIDO may already exist:', e.message);
        }

        // Step 2: Drop TRIAJE - this requires recreating the enum and migrating
        // First, check if any rows still have TRIAJE status
        const triajeRows = await client.query(`SELECT COUNT(*) FROM emergencia WHERE estado_emergencia = 'TRIAJE'`);
        const triajeCount = parseInt(triajeRows.rows[0].count);
        console.log(`Found ${triajeCount} emergencies with TRIAJE status`);

        if (triajeCount > 0) {
            // Update any TRIAJE rows to EN_ATENCION
            await client.query(`UPDATE emergencia SET estado_emergencia = 'EN_ATENCION' WHERE estado_emergencia = 'TRIAJE'`);
            console.log(`✓ Migrated ${triajeCount} TRIAJE records to EN_ATENCION`);
        }

        // Step 3: Add medicoId column if it doesn't exist
        try {
            await client.query(`ALTER TABLE emergencia ADD COLUMN IF NOT EXISTS medico_id BIGINT REFERENCES medico(empleado_id)`);
            console.log('✓ Added medico_id column to emergencia table');
        } catch (e) {
            console.log('   medico_id may already exist:', e.message);
        }

        // Step 4: Remove montoAprobado from carta_aval (if exists)
        try {
            await client.query(`ALTER TABLE carta_aval DROP COLUMN IF EXISTS monto_aprobado`);
            console.log('✓ Removed monto_aprobado from carta_aval table');
        } catch (e) {
            console.log('   monto_aprobado may not exist:', e.message);
        }

        // Step 5: Change default for estado_emergencia to EN_ATENCION
        try {
            await client.query(`ALTER TABLE emergencia ALTER COLUMN estado_emergencia SET DEFAULT 'EN_ATENCION'`);
            console.log('✓ Updated default state to EN_ATENCION');
        } catch (e) {
            console.log('   Could not update default:', e.message);
        }

        // Note: We cannot DROP 'TRIAJE' from the enum in PostgreSQL without
        // recreating the entire type. Since no rows use it anymore and Prisma
        // won't allow it in app code, it becomes a dead value. This is safe.
        console.log('\n⚠️  Note: TRIAJE value remains in the DB enum but will never be used.');
        console.log('   This is harmless - Prisma schema no longer allows it.');

        await client.query('COMMIT');
        console.log('\n✅ Migration completed successfully!');
        console.log('\nNext step: run "npx prisma generate" to regenerate the Prisma client.');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Migration failed, rolled back:', error.message);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
