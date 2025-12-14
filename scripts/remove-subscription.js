// Quick script to remove subscription for testing as new user
// Run with: node scripts/remove-subscription.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function removeSubscription() {
    try {
        // Get the most recent user
        const user = await prisma.user.findFirst({
            orderBy: { createdAt: 'desc' }
        });

        if (!user) {
            console.log('No users found!');
            return;
        }

        console.log(`Found user: ${user.email} (${user.id})`);

        // Delete all subscriptions for this user
        const result = await prisma.subscription.deleteMany({
            where: { userId: user.id }
        });

        console.log(`✅ Removed ${result.count} subscription(s) for user ${user.email}`);
        console.log('User is now like a new user - no subscription, no scripts!');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

removeSubscription();
