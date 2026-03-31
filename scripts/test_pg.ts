import { Pool } from 'pg';

async function main() {
    console.log("Connecting string:", process.env.DATABASE_URL);
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    try {
        const res = await pool.query('SELECT * FROM "Aseguradora"');
        console.log("DB Count:", res.rowCount);
        console.log("DB Aseguradoras:", JSON.stringify(res.rows, null, 2));
    } catch (e) {
        console.error("DB Error:", e);
    } finally {
        await pool.end();
    }
}
main();
