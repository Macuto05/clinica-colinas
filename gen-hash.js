const bcrypt = require('bcryptjs');

async function main() {
    const hash = await bcrypt.hash('tesis123', 10);
    console.log("HASH_RESULT:" + hash);
}

main();
