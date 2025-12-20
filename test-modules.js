console.log("Starting diagnostic...");
try {
    require('bcryptjs');
    console.log('✅ bcryptjs loaded');
} catch (e) { console.error('❌ bcryptjs fail', e.code); }

try {
    const { PrismaClient } = require('@prisma/client');
    console.log('✅ @prisma/client library loaded');
    const p = new PrismaClient();
    console.log('✅ PrismaClient instantiated');
} catch (e) { console.error('❌ Prisma fail', e.message); }
