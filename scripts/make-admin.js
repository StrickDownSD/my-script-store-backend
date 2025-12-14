
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function makeAdmin() {
    try {
        console.log('Making user ADMIN...');

        // Find user by email or username (you can change this to your email)
        // Since we don't know the exact email, we'll list users first
        const users = await prisma.user.findMany();

        if (users.length === 0) {
            console.log('No users found to promote.');
            return;
        }

        console.log('Users found:', users.map(u => ({ id: u.id, email: u.email, role: u.role })));

        // Promote the first user or specific one
        const targetUser = users[0]; // Promoting the first user found for now

        const updatedUser = await prisma.user.update({
            where: { id: targetUser.id },
            data: { role: 'ADMIN' }
        });

        console.log(`✅ User ${updatedUser.email} is now an ADMIN!`);
        console.log('Login credentials: Use your existing email/password.');

    } catch (error) {
        console.error('Error promoting admin:', error);
    } finally {
        await prisma.$disconnect();
    }
}

makeAdmin();
