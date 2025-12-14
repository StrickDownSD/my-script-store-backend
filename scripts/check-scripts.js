
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkScripts() {
    try {
        const count = await prisma.script.count();
        console.log(`Script count: ${count}`);

        const scripts = await prisma.script.findMany();
        console.log('Scripts:', scripts);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkScripts();
