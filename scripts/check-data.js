
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
    try {
        const scriptCount = await prisma.script.count();
        const planCount = await prisma.plan.count();
        console.log(`Scripts: ${scriptCount}, Plans: ${planCount}`);

        if (scriptCount > 0) {
            const scripts = await prisma.script.findMany({ take: 1 });
            console.log('Sample script:', scripts[0]);
        }
        if (planCount > 0) {
            const plans = await prisma.plan.findMany();
            console.log('Plans:', JSON.stringify(plans, null, 2));
        }
    } catch (error) {
        console.error('Error checking DB:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkData();
