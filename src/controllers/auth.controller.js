const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const emailService = require('../services/email.service');

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'demo-secret';

const generateTokens = (user) => {
    const accessToken = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    const refreshToken = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    return { accessToken, refreshToken };
};

/**
 * Generate 6-digit OTP
 */
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Register new user
 * POST /api/auth/register
 */
exports.register = async (req, res) => {
    try {
        const { email, password, firstName, lastName, username } = req.body;

        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        // Check if email already exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        // Check if username already exists
        if (username) {
            const existingUsername = await prisma.user.findUnique({ where: { username } });
            if (existingUsername) {
                return res.status(400).json({ message: 'Username already taken' });
            }
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate 6-digit OTP
        const verificationToken = generateOTP();

        // Create user
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                firstName,
                lastName,
                username,
                verificationToken,
                isVerified: false
            }
        });

        // Send verification email
        try {
            await emailService.sendVerificationEmail(email, verificationToken, firstName || 'User');
            console.log(`[AUTH] Verification email sent to ${email}`);
        } catch (emailError) {
            console.error(`[AUTH] Failed to send email:`, emailError.message);
            // Still return success - user can request resend
        }

        res.status(201).json({
            message: 'Registration successful. Please check your email for verification code.',
            userId: user.id,
            email: user.email,
            requireVerification: true
        });

    } catch (error) {
        console.error('[AUTH] Registration error:', error);
        res.status(500).json({ error: 'Registration failed. Please try again.' });
    }
};

/**
 * Verify email with OTP
 * POST /api/auth/verify
 */
exports.verifyEmail = async (req, res) => {
    try {
        const { email, code } = req.body;

        if (!email || !code) {
            return res.status(400).json({ message: 'Email and verification code are required' });
        }

        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.isVerified) {
            return res.status(400).json({ message: 'Email already verified. Please login.' });
        }

        if (user.verificationToken !== code) {
            return res.status(400).json({ message: 'Invalid verification code' });
        }

        // Update user as verified
        await prisma.user.update({
            where: { id: user.id },
            data: {
                isVerified: true,
                verificationToken: null
            }
        });

        // Send welcome email
        try {
            await emailService.sendWelcomeEmail(email, user.firstName || 'User');
        } catch (emailError) {
            console.error('[AUTH] Failed to send welcome email:', emailError.message);
        }

        // Generate tokens
        const tokens = generateTokens(user);

        res.json({
            message: 'Email verified successfully!',
            ...tokens,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName
            }
        });

    } catch (error) {
        console.error('[AUTH] Verification error:', error);
        res.status(500).json({ error: 'Verification failed. Please try again.' });
    }
};

/**
 * Resend OTP verification code
 * POST /api/auth/resend-otp
 */
exports.resendOTP = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.isVerified) {
            return res.status(400).json({ message: 'Email already verified. Please login.' });
        }

        // Generate new OTP
        const newOTP = generateOTP();

        // Update user with new OTP
        await prisma.user.update({
            where: { id: user.id },
            data: { verificationToken: newOTP }
        });

        // Send new verification email
        try {
            await emailService.sendVerificationEmail(email, newOTP, user.firstName || 'User');
            res.json({ message: 'Verification code sent successfully. Please check your email.' });
        } catch (emailError) {
            console.error('[AUTH] Failed to send email:', emailError.message);
            res.status(500).json({ error: 'Failed to send verification email. Please try again.' });
        }

    } catch (error) {
        console.error('[AUTH] Resend OTP error:', error);
        res.status(500).json({ error: 'Failed to resend verification code.' });
    }
};

/**
 * Login user
 * POST /api/auth/login
 */
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        if (!user.isVerified) {
            return res.status(403).json({
                message: 'Email not verified. Please check your email for verification code.',
                requireVerification: true,
                email: user.email
            });
        }

        const tokens = generateTokens(user);

        res.json({
            ...tokens,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                username: user.username,
                role: user.role // Include role for permission checks
            }
        });

    } catch (error) {
        console.error('[AUTH] Login error:', error);
        res.status(500).json({ error: 'Login failed. Please try again.' });
    }
};

/**
 * Refresh access token
 * POST /api/auth/refresh
 */
exports.refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({ message: 'Refresh token is required' });
        }

        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
        const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const tokens = generateTokens(user);
        res.json(tokens);

    } catch (error) {
        console.error('[AUTH] Refresh token error:', error);
        res.status(401).json({ message: 'Invalid or expired refresh token' });
    }
};

/**
 * Get current user profile
 * GET /api/auth/me
 */
exports.getMe = async (req, res) => {
    try {
        const userId = req.user.userId;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                username: true,
                role: true,
                isVerified: true,
                createdAt: true
            }
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ user });

    } catch (error) {
        console.error('[AUTH] Get user error:', error);
        res.status(500).json({ error: 'Failed to get user profile' });
    }
};
