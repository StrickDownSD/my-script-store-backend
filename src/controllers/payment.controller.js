const { PrismaClient } = require('@prisma/client');
const Stripe = require('stripe');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Plan configuration
const PLANS = {
    PREMIUM: {
        name: 'Premium',
        price: 14.99,
        priceInCents: 1499,
        features: ['Unlimited Script Access', 'Priority Support 24/7', 'AI Assistant Access']
    },
    ADVANCE: {
        name: 'Advance',
        price: 29.99,
        priceInCents: 2999,
        features: ['Everything in Premium', 'Unlimited Devices', 'API Access', 'Commercial License']
    }
};

/**
 * Create Stripe Checkout Session for subscription purchase
 */
exports.createCheckoutSession = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { planType } = req.body;

        if (!planType || !PLANS[planType]) {
            return res.status(400).json({ error: 'Invalid plan type' });
        }

        const plan = PLANS[planType];

        // Get user
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Create or get Stripe customer
        let stripeCustomerId = user.stripeCustomerId;
        if (!stripeCustomerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username,
                metadata: {
                    userId: user.id
                }
            });
            stripeCustomerId = customer.id;

            // Save customer ID to user
            await prisma.user.update({
                where: { id: userId },
                data: { stripeCustomerId }
            });
        }

        // Create Checkout Session
        const session = await stripe.checkout.sessions.create({
            customer: stripeCustomerId,
            payment_method_types: ['card'],
            mode: 'payment', // One-time payment for now
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: `${plan.name} Subscription`,
                            description: plan.features.join(', ')
                        },
                        unit_amount: plan.priceInCents
                    },
                    quantity: 1
                }
            ],
            success_url: `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
            metadata: {
                userId,
                planType,
                purchaseType: 'subscription'
            }
        });

        // Create pending order
        await prisma.order.create({
            data: {
                userId,
                amount: plan.price,
                status: 'PENDING',
                stripeSessionId: session.id,
                planType
            }
        });

        res.json({
            sessionId: session.id,
            url: session.url
        });

    } catch (error) {
        console.error('Checkout session creation failed:', error);
        res.status(500).json({ error: 'Failed to create checkout session' });
    }
};

/**
 * Create Stripe Checkout Session for SCRIPT purchase
 */
exports.createScriptCheckout = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { scriptId, scriptTitle, scriptPrice } = req.body;

        if (!scriptId || !scriptTitle || !scriptPrice) {
            return res.status(400).json({ error: 'Script details are required' });
        }

        // Get user
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if user already owns this script - REMOVED to allow multiple purchases
        // const existingLicense = await prisma.license.findFirst({
        //     where: {
        //         userId,
        //         scriptId,
        //         status: 'ACTIVE'
        //     }
        // });

        // if (existingLicense) {
        //     return res.status(400).json({ error: 'You already own this script' });
        // }

        // Create or get Stripe customer
        let stripeCustomerId = user.stripeCustomerId;
        if (!stripeCustomerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username,
                metadata: { userId: user.id }
            });
            stripeCustomerId = customer.id;

            await prisma.user.update({
                where: { id: userId },
                data: { stripeCustomerId }
            });
        }

        // Create Checkout Session for script
        const session = await stripe.checkout.sessions.create({
            customer: stripeCustomerId,
            payment_method_types: ['card'],
            mode: 'payment',
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: scriptTitle,
                            description: `License for ${scriptTitle} - Single device`
                        },
                        unit_amount: Math.round(scriptPrice * 100) // Convert to cents
                    },
                    quantity: 1
                }
            ],
            success_url: `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}&type=script`,
            cancel_url: `${process.env.FRONTEND_URL}/scripts`,
            metadata: {
                userId,
                scriptId,
                scriptTitle,
                scriptPrice: scriptPrice.toString(),
                purchaseType: 'script'
            }
        });

        // Create pending order
        await prisma.order.create({
            data: {
                userId,
                scriptId,
                amount: parseFloat(scriptPrice),
                status: 'PENDING',
                stripeSessionId: session.id,
                planType: 'SCRIPT_PURCHASE'
            }
        });

        res.json({
            sessionId: session.id,
            url: session.url
        });

    } catch (error) {
        console.error('Script checkout creation failed:', error);
        res.status(500).json({ error: 'Failed to create checkout session' });
    }
};

/**
 * Stripe Webhook Handler
 */
exports.handleWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        // Verify webhook signature
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed':
            await handleCheckoutComplete(event.data.object);
            break;
        case 'payment_intent.succeeded':
            console.log('Payment succeeded:', event.data.object.id);
            break;
        default:
            console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
};

/**
 * Handle successful checkout
 */
async function handleCheckoutComplete(session) {
    try {
        const { userId, purchaseType, planType, scriptId, scriptTitle } = session.metadata;

        // Update order status
        await prisma.order.updateMany({
            where: { stripeSessionId: session.id },
            data: {
                status: 'COMPLETED',
                paymentId: session.payment_intent
            }
        });

        if (purchaseType === 'script') {
            // Generate license key for script purchase
            const licenseKey = uuidv4();

            await prisma.license.create({
                data: {
                    key: licenseKey,
                    keyHash: licenseKey, // In production, hash this
                    userId,
                    scriptId,
                    status: 'ACTIVE',
                    deviceLimit: 1 // Single device
                }
            });

            console.log(`License created for user ${userId}, script: ${scriptId}, key: ${licenseKey}`);

        } else {
            // Subscription purchase
            await prisma.subscription.create({
                data: {
                    userId,
                    planType,
                    status: 'ACTIVE',
                    currentPeriodStart: new Date(),
                    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
                }
            });

            console.log(`Subscription created for user ${userId}, plan: ${planType}`);
        }

    } catch (error) {
        console.error('Error handling checkout complete:', error);
    }
}

/**
 * Get user's purchased scripts with licenses
 */
exports.getUserPurchases = async (req, res) => {
    try {
        const userId = req.user.userId;

        // Get all licenses for user, ordered by creation (for correct numbering)
        const licenses = await prisma.license.findMany({
            where: {
                userId,
                status: 'ACTIVE'
            },
            include: {
                script: true // Include script details
            },
            orderBy: {
                createdAt: 'asc' // Order by purchase date to numbering makes sense
            }
        });

        // Add numbering to duplicate scripts
        const scriptCounts = {};
        const licensesWithDisplayTitle = licenses.map(license => {
            if (!license.script) return license;

            const scriptId = license.scriptId;
            if (!scriptCounts[scriptId]) {
                scriptCounts[scriptId] = 0;
            }
            scriptCounts[scriptId]++;

            const count = scriptCounts[scriptId];
            // If it's the 2nd, 3rd instance, append number
            const displayTitle = count > 1 ? `${license.script.title} ${count}` : license.script.title;

            return {
                ...license,
                script: {
                    ...license.script,
                    title: displayTitle
                }
            };
        });

        // Reverse to show newest first for dashboard
        licensesWithDisplayTitle.reverse();

        res.json({ licenses: licensesWithDisplayTitle });

    } catch (error) {
        console.error('Error getting user purchases:', error);
        res.status(500).json({ error: 'Failed to get purchases' });
    }
};

/**
 * Get payment/order status
 */
exports.getOrderStatus = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const userId = req.user.userId;

        const order = await prisma.order.findFirst({
            where: {
                stripeSessionId: sessionId,
                userId
            }
        });

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        res.json({ order });

    } catch (error) {
        console.error('Error getting order status:', error);
        res.status(500).json({ error: 'Failed to get order status' });
    }
};

/**
 * Get user's subscription status
 */
exports.getSubscription = async (req, res) => {
    try {
        const userId = req.user.userId;

        const subscription = await prisma.subscription.findFirst({
            where: {
                userId,
                status: 'ACTIVE'
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.json({ subscription });

    } catch (error) {
        console.error('Error getting subscription:', error);
        res.status(500).json({ error: 'Failed to get subscription' });
    }
};

/**
 * Verify session and return order details (for success page)
 * Also creates subscription/license if payment was successful (webhook alternative for local dev)
 */
exports.verifySession = async (req, res) => {
    try {
        const { sessionId } = req.params;

        // Get session from Stripe
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        const isPaid = session.payment_status === 'paid';
        const { userId, purchaseType, planType, scriptId, scriptTitle } = session.metadata;

        // If payment was successful, ensure subscription/license is created
        if (isPaid && userId) {
            // Check order status first to prevent duplicate processing
            const order = await prisma.order.findFirst({
                where: { stripeSessionId: sessionId }
            });

            if (order && order.status === 'PENDING') {
                // Update order status
                await prisma.order.update({
                    where: { id: order.id },
                    data: {
                        status: 'COMPLETED',
                        paymentId: session.payment_intent
                    }
                });

                if (purchaseType === 'script' && scriptId) {
                    // Create license for script purchase - ALWAYS create new license for new purchase
                    const licenseKey = uuidv4();
                    await prisma.license.create({
                        data: {
                            key: licenseKey,
                            keyHash: licenseKey, // Ideally hash this
                            userId,
                            scriptId,
                            status: 'ACTIVE',
                            deviceLimit: 1
                        }
                    });
                    console.log(`[VERIFY] New license created for user ${userId}, script: ${scriptId}`);
                } else if (purchaseType === 'subscription' && planType) {
                    // Check if subscription already exists (keep single active subscription logic)
                    const existingSub = await prisma.subscription.findFirst({
                        where: { userId, planType, status: 'ACTIVE' }
                    });

                    if (!existingSub) {
                        // Create subscription
                        await prisma.subscription.create({
                            data: {
                                userId,
                                planType,
                                status: 'ACTIVE',
                                currentPeriodStart: new Date(),
                                currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                            }
                        });
                        console.log(`[VERIFY] Subscription created for user ${userId}, plan: ${planType}`);
                    }
                }
            }
        }

        // Garbage code removed from here

        // Get order from database
        const order = await prisma.order.findFirst({
            where: { stripeSessionId: sessionId }
        });

        // Get license if it's a script purchase
        let license = null;
        if (purchaseType === 'script' && scriptId) {
            license = await prisma.license.findFirst({
                where: { userId, scriptId },
                orderBy: { createdAt: 'desc' }
            });
        }

        // Get subscription if it's a subscription purchase
        let subscription = null;
        if (purchaseType === 'subscription' && planType) {
            subscription = await prisma.subscription.findFirst({
                where: { userId, planType, status: 'ACTIVE' }
            });
        }

        res.json({
            success: isPaid,
            order,
            license,
            subscription,
            purchaseType,
            planType,
            scriptTitle,
            customerEmail: session.customer_details?.email
        });

    } catch (error) {
        console.error('Error verifying session:', error);
        res.status(500).json({ error: 'Failed to verify session' });
    }
};
