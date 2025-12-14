const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function fixAdmin() {
    try {
        // Find admin user
        const admin = await prisma.user.findUnique({
            where: { email: 'admin@example.com' }
        });

        console.log('Current Admin User:', admin);

        if (admin) {
            // Update to ADMIN role
            const updated = await prisma.user.update({
                where: { email: 'admin@example.com' },
                data: {
                    role: 'ADMIN',
                    isVerified: true
                }
            });
            console.log('\n✅ Admin role updated to:', updated.role);
        } else {
            // Create new admin
            const hashedPassword = await bcrypt.hash('Admin12345', 10);
            const newAdmin = await prisma.user.create({
                data: {
                    email: 'admin@example.com',
                    password: hashedPassword,
                    firstName: 'Admin',
                    lastName: 'User',
                    role: 'ADMIN',
                    isVerified: true
                }
            });
            console.log('\n✅ New Admin created:', newAdmin.email);
        }

        // Verify
        const verify = await prisma.user.findUnique({
            where: { email: 'admin@example.com' },
            select: { email: true, role: true, isVerified: true }
        });
        console.log('\n✅ Verified Admin:', verify);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

fixAdmin();
