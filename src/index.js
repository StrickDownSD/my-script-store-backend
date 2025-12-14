const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Allow both localhost definitions and user's specific IP if needed
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', '*', 'http://100.66.65.108:3000'],
    credentials: true
}));

// Stripe webhook needs raw body - must be before express.json()
const paymentRoutes = require('./routes/payment.routes');
app.use('/api/payment/webhook', express.raw({ type: 'application/json' }));

app.use(express.json());

app.get('/', (req, res) => {
    res.send('Secure Script Store API is running');
});

const authRoutes = require('./routes/auth.routes');
app.use('/api/auth', authRoutes);

const licenseRoutes = require('./routes/license.routes');
const scriptRoutes = require('./routes/script.routes'); // Add script routes
const path = require('path'); // For static files

app.use('/api/license', licenseRoutes);
app.use('/api/scripts', scriptRoutes); // Mount scripts API

const aiRoutes = require('./routes/ai.routes');
const orderRoutes = require('./routes/order.routes');
const userRoutes = require('./routes/user.routes');

app.use('/api/ai', aiRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/users', userRoutes); // Admin user management
const planRoutes = require('./routes/plan.routes');
app.use('/api/plans', planRoutes); // Subscription plans

// Serve static uploads (Note: specific to local dev, on Vercel these are read-only/ephemeral)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
