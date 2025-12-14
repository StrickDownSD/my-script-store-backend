// Quick script to add subscription for testing
// Run with: node scripts/add-subscription.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addSubscription() {
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

        // Check if subscription exists
        const existingSub = await prisma.subscription.findFirst({
            where: {
                userId: user.id,
                status: 'ACTIVE'
            }
        });

        if (existingSub) {
            console.log(`User already has active subscription: ${existingSub.planType}`);
            return;
        }

        // Create PREMIUM subscription
        const subscription = await prisma.subscription.create({
            data: {
                userId: user.id,
                planType: 'PREMIUM',
                status: 'ACTIVE',
                currentPeriodStart: new Date(),
                currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
            }
        });

        console.log('✅ Subscription created successfully!');
        console.log(`   User: ${user.email}`);
        console.log(`   Plan: ${subscription.planType}`);
        console.log(`   Status: ${subscription.status}`);
        console.log(`   Expires: ${subscription.currentPeriodEnd}`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

addSubscription();
