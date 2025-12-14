const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all users (admin only)
exports.getAllUsers = async (req, res) => {
    try {
        const { search, page = 1, limit = 20 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const where = search ? {
            OR: [
                { email: { contains: search } },
                { firstName: { contains: search } },
                { lastName: { contains: search } },
                { username: { contains: search } }
            ]
        } : {};

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                skip,
                take: parseInt(limit),
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    username: true,
                    role: true,
                    isVerified: true,
                    createdAt: true,
                    subscriptions: {
                        where: { status: 'ACTIVE' },
                        select: {
                            planType: true,
                            status: true,
                            currentPeriodEnd: true
                        }
                    }
                }
            }),
            prisma.user.count({ where })
        ]);

        res.json({
            users,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};

// Get user by ID (admin only)
exports.getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                username: true,
                role: true,
                isVerified: true,
                createdAt: true,
                orders: {
                    take: 10,
                    orderBy: { createdAt: 'desc' },
                    include: { script: { select: { title: true } } }
                },
                subscriptions: {
                    orderBy: { createdAt: 'desc' }
                },
                licenses: {
                    include: { script: { select: { title: true } } }
                }
            }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
};

// Update user role (admin only)
exports.updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        if (!['USER', 'ADMIN', 'BANNED'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }

        const user = await prisma.user.update({
            where: { id },
            data: { role },
            select: {
                id: true,
                email: true,
                role: true
            }
        });

        res.json({ message: 'User role updated', user });
    } catch (error) {
        console.error('Update role error:', error);
        res.status(500).json({ error: 'Failed to update user role' });
    }
};

// Delete user (admin only)
exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if user exists
        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Don't allow deleting admins
        if (user.role === 'ADMIN') {
            return res.status(403).json({ error: 'Cannot delete admin users' });
        }

        // Delete related records first (cascade not set in schema)
        await prisma.$transaction([
            prisma.auditLog.deleteMany({ where: { license: { userId: id } } }),
            prisma.license.deleteMany({ where: { userId: id } }),
            prisma.order.deleteMany({ where: { userId: id } }),
            prisma.subscription.deleteMany({ where: { userId: id } }),
            prisma.user.delete({ where: { id } })
        ]);

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
};
