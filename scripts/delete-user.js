const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteUser() {
    try {
        const email = 'yasinar797@gmail.com';

        // Delete user's related records first (due to foreign keys)
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            console.log('User not found with email:', email);
            return;
        }

        // Delete subscriptions
        await prisma.subscription.deleteMany({ where: { userId: user.id } });

        // Delete orders
        await prisma.order.deleteMany({ where: { userId: user.id } });

        // Delete licenses
        await prisma.license.deleteMany({ where: { userId: user.id } });

        // Delete user
        await prisma.user.delete({ where: { email } });

        console.log('✅ User deleted successfully:', email);
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

deleteUser();
