const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function resetDatabase() {
    try {
        console.log('🗑️  Starting database cleanup...\n');

        // Delete in order (respecting foreign keys)

        // 1. Delete all licenses
        const deletedLicenses = await prisma.license.deleteMany({});
        console.log(`✅ Deleted ${deletedLicenses.count} licenses`);

        // 2. Delete all orders
        const deletedOrders = await prisma.order.deleteMany({});
        console.log(`✅ Deleted ${deletedOrders.count} orders`);

        // 3. Delete all subscriptions
        const deletedSubs = await prisma.subscription.deleteMany({});
        console.log(`✅ Deleted ${deletedSubs.count} subscriptions`);

        // 4. Delete all scripts
        const deletedScripts = await prisma.script.deleteMany({});
        console.log(`✅ Deleted ${deletedScripts.count} scripts`);

        // 5. Delete all users
        const deletedUsers = await prisma.user.deleteMany({});
        console.log(`✅ Deleted ${deletedUsers.count} users`);

        console.log('\n🎉 Database cleaned successfully!');
        console.log('➡️  Fresh start - users can now signup and buy plans.');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

resetDatabase();
