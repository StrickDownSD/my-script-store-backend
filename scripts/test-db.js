const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
});

async function main() {
    console.log('Attempting to connect to DB...');
    try {
        const userCount = await prisma.user.count();
        console.log('Connection successful! User count:', userCount);
    } catch (e) {
        console.error('Connection failed:', e.message);
        if (e.code) console.error('Error code:', e.code);
    } finally {
        await prisma.$disconnect();
    }
}

main();
