
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all plans (Public)
exports.getPlans = async (req, res) => {
    try {
        let plans = await prisma.plan.findMany({
            orderBy: {
                // We might want specific order. For now, rely on created order or handle in frontend.
                // Or add 'order' field. Let's sort by price? No.
                // Let's just return them. logic is usually SINGLE -> PREMIUM -> ADVANCE
                // We can sort by price ascending?
                planType: 'asc'
            }
        });

        // specific sorting: SINGLE, PREMIUM, ADVANCE
        const order = ['SINGLE', 'PREMIUM', 'ADVANCE'];
        plans.sort((a, b) => order.indexOf(a.planType) - order.indexOf(b.planType));

        // If no plans exist, seed them (first run)
        if (plans.length === 0) {
            await seedPlans();
            plans = await prisma.plan.findMany();
            plans.sort((a, b) => order.indexOf(a.planType) - order.indexOf(b.planType));
        }

        // Parse features JSON
        const parsedPlans = plans.map(p => ({
            ...p,
            features: JSON.parse(p.features)
        }));

        res.json(parsedPlans);
    } catch (error) {
        console.error('Get plans error:', error);
        res.status(500).json({ error: 'Failed to fetch plans' });
    }
};

// Update plan (Admin)
exports.updatePlan = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, price, period, description, features, buttonText, popular, color } = req.body;

        const updatedPlan = await prisma.plan.update({
            where: { id },
            data: {
                name,
                price,
                period,
                description,
                features: JSON.stringify(features),
                buttonText,
                popular,
                color
            }
        });

        res.json({
            ...updatedPlan,
            features: JSON.parse(updatedPlan.features)
        });
    } catch (error) {
        console.error('Update plan error:', error);
        res.status(500).json({ error: 'Failed to update plan' });
    }
};

// Internal Seeder
const seedPlans = async () => {
    const plans = [
        {
            name: 'Single Purchase',
            price: null, // Empty for Single
            period: '',
            buttonText: 'Browse Scripts',
            planType: 'SINGLE',
            description: 'Perfect for trying out a single script',
            features: JSON.stringify([
                'One Script Download',
                'Lifetime Access',
                'Basic Support',
                'Documentation Included',
                'Device Lock (1 Device)',
            ]),
            color: 'from-gray-600 to-gray-700',
            popular: false,
        },
        {
            name: 'Premium',
            price: '$14.99',
            period: '/month',
            buttonText: 'Buy Now',
            planType: 'PREMIUM',
            description: 'Best for regular users and developers',
            features: JSON.stringify([
                'Unlimited Script Access',
                'Priority Support 24/7',
                'Early Access to New Scripts',
                'Device Lock (3 Devices)',
                'AI Assistant Access',
                'Custom Script Requests',
            ]),
            color: 'from-blue-600 to-purple-600',
            popular: true,
        },
        {
            name: 'Advance',
            price: '$29.99',
            period: '/month',
            buttonText: 'Buy Now',
            planType: 'ADVANCE',
            description: 'For power users and businesses',
            features: JSON.stringify([
                'Everything in Premium',
                'Unlimited Devices',
                'White-label Scripts',
                'API Access',
                'Dedicated Account Manager',
                'Custom Development',
                'Commercial License',
            ]),
            color: 'from-purple-600 to-pink-600',
            popular: false,
        },
    ];

    for (const plan of plans) {
        await prisma.plan.create({ data: plan });
    }
};
