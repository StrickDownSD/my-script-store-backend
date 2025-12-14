
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function setAdmin() {
    try {
        // Hidden System Admin Account
        const email = 'admin@admin.com';
        const password = '01893829145';

        console.log(`Setting up System Admin: ${email}`);

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            console.log('User exists. Updating credentials and role...');
            await prisma.user.update({
                where: { email },
                data: {
                    password: hashedPassword,
                    role: 'ADMIN'
                }
            });
        } else {
            console.log('User does not exist. Creating new Admin user...');
            await prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    username: 'admin',
                    firstName: 'Admin',
                    lastName: 'User',
                    role: 'ADMIN',
                    isVerified: true
                }
            });
        }

        console.log('✅ Admin credentials set successfully!');
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);

    } catch (error) {
        console.error('Error setting admin:', error);
    } finally {
        await prisma.$disconnect();
    }
}

setAdmin();
