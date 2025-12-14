const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createAdmin() {
    try {
        const email = 'admin@example.com';
        const password = 'Admin12345';
        const hashedPassword = await bcrypt.hash(password, 10);

        const admin = await prisma.user.upsert({
            where: { email },
            update: {},
            create: {
                email,
                password: hashedPassword,
                firstName: 'Super',
                lastName: 'Admin',
                role: 'ADMIN',
                isVerified: true
            }
        });

        console.log(`✅ Admin account created: ${admin.email}`);
    } catch (error) {
        console.error('Error creating admin:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createAdmin();
