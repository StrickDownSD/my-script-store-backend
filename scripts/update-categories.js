const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateCategories() {
    try {
        // Get all scripts
        const scripts = await prisma.script.findMany();

        console.log('Found scripts:', scripts.length);

        for (const script of scripts) {
            let category = null;
            const title = script.title?.toLowerCase() || '';
            const desc = script.description?.toLowerCase() || '';

            // Determine category based on title/description
            if (title.includes('node') || title.includes('cli') || desc.includes('node') || desc.includes('cli')) {
                category = 'Node CLI';
            } else if (title.includes('refer') || desc.includes('refer')) {
                category = 'Refer Script';
            } else if (title.includes('check-in') || title.includes('checkin') || title.includes('daily') || desc.includes('check-in') || desc.includes('daily')) {
                category = 'Daily Check-in';
            } else if (title.includes('transaction') || desc.includes('transaction')) {
                category = 'Automate Transaction';
            } else if (title.includes('automate') || title.includes('auto') || desc.includes('automate') || desc.includes('auto')) {
                category = 'Automate Task';
            } else {
                // Default category
                category = 'Automate Task';
            }

            // Update the script
            await prisma.script.update({
                where: { id: script.id },
                data: { category }
            });

            console.log(`Updated "${script.title}" -> Category: ${category}`);
        }

        console.log('\nAll scripts updated with categories!');
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

updateCategories();
