const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { v4: uuidv4 } = require('uuid');

exports.createOrder = async (req, res) => {
    try {
        const userId = req.user.userId; // Extracted from JWT by middleware
        const { scriptId, price } = req.body;

        if (!scriptId) {
            return res.status(400).json({ error: 'Script ID is required' });
        }

        // 1. Create Order (Simulating successful payment)
        const order = await prisma.order.create({
            data: {
                userId,
                scriptId,
                amount: parseFloat(price) || 0,
                status: 'COMPLETED',
                paymentId: `mock_pay_${Date.now()}`
            }
        });

        // 2. Generate License Key
        const licenseKey = uuidv4();

        // 3. Create License Record
        const license = await prisma.license.create({
            data: {
                key: licenseKey,
                keyHash: licenseKey, // In real app, hash this!
                userId,
                scriptId,
                status: 'ACTIVE'
            }
        });

        res.status(201).json({
            message: 'Purchase successful',
            order,
            license
        });

    } catch (error) {
        console.error('Order creation failed:', error);
        res.status(500).json({ error: 'Failed to process order' });
    }
};
