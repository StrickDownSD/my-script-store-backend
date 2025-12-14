const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function removePremiumAdvanceScripts() {
    try {
        // Delete all Premium and Advance scripts
        const deleted = await prisma.script.deleteMany({
            where: {
                scriptType: {
                    in: ['PREMIUM', 'ADVANCE']
                }
            }
        });

        console.log(`✅ Deleted ${deleted.count} Premium/Advance scripts`);

        // Show remaining scripts
        const remaining = await prisma.script.findMany({
            select: { title: true, scriptType: true }
        });

        console.log('\nRemaining scripts:');
        remaining.forEach(s => console.log(`  - ${s.title} (${s.scriptType})`));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

removePremiumAdvanceScripts();
