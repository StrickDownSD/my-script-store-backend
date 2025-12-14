const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

    if (!token) return res.sendStatus(401); // Unauthorized

    jwt.verify(token, process.env.JWT_SECRET || 'demo-secret', (err, user) => {
        if (err) return res.sendStatus(403); // Forbidden
        req.user = user;
        next();
    });
};

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient(); // Or import shared instance if available, but new instance is safe for middleware

const isAdmin = async (req, res, next) => {
    // Check if role is in token
    if (req.user && req.user.role === 'ADMIN') {
        return next();
    }

    // Fallback: Check DB if token didn't have role
    if (req.user && req.user.userId) {
        try {
            const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
            if (user && user.role === 'ADMIN') {
                req.user.role = 'ADMIN'; // Cache it for potential next steps
                return next();
            }
        } catch (error) {
            console.error('Admin check error:', error);
        }
    }

    res.status(403).json({ error: 'Admin access required' });
};

module.exports = auth;
module.exports.auth = auth;
module.exports.isAdmin = isAdmin;
