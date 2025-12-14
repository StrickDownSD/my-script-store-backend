const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- PLAN NAMES ---');
    const plans = await prisma.plan.findMany();
    console.log(plans.map(p => p.name));

    console.log('--- SCRIPT TITLES ---');
    const scripts = await prisma.script.findMany();
    console.log(scripts.map(s => s.title));
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
