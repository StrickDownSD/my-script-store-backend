
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');

async function checkScript() {
    try {
        const scripts = await prisma.script.findMany({
            where: {
                title: {
                    contains: 'Monad',
                }
            }
        });

        const output = 'Scripts found: ' + JSON.stringify(scripts, null, 2);
        console.log(output);
        fs.writeFileSync('debug_output.txt', output);
    } catch (error) {
        const errorMsg = 'Error fetching scripts: ' + error.message + '\n' + error.stack;
        console.error('Error fetching scripts:', error.message);
        fs.writeFileSync('debug_output.txt', errorMsg);
    } finally {
        await prisma.$disconnect();
    }
}

checkScript();
