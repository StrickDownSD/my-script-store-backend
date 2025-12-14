const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get admin dashboard statistics
exports.getAdminStats = async (req, res) => {
    try {
        // Get counts
        const [totalUsers, totalScripts, totalSubscriptions, totalScriptSales, recentUsers, recentOrders, scriptSales] = await Promise.all([
            prisma.user.count(),
            prisma.script.count(),
            prisma.subscription.count({ where: { status: 'ACTIVE' } }),
            prisma.order.count({
                where: {
                    status: 'COMPLETED',
                    scriptId: { not: null }
                }
            }),
            prisma.user.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    createdAt: true,
                    role: true
                }
            }),
            prisma.order.findMany({
                take: 5,
                where: { status: 'COMPLETED' },
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: { email: true, firstName: true }
                    },
                    script: {
                        select: { title: true }
                    }
                }
            }),
            // Get sales count per script
            prisma.script.findMany({
                select: {
                    id: true,
                    title: true,
                    price: true,
                    _count: {
                        select: {
                            orders: {
                                where: { status: 'COMPLETED' }
                            }
                        }
                    }
                }
            })
        ]);

        res.json({
            stats: {
                totalUsers,
                totalScripts,
                totalSubscriptions,
                totalScriptSales
            },
            recentUsers,
            recentOrders,
            scriptSales: scriptSales.map(s => ({
                id: s.id,
                title: s.title,
                price: s.price,
                salesCount: s._count.orders
            }))
        });
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
};
