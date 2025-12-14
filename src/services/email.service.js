const nodemailer = require('nodemailer');

// Create transporter with Gmail SMTP
const port = parseInt(process.env.SMTP_PORT) || 587;
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: port,
    secure: port === 465, // True for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
});

// Verify transporter connection
transporter.verify((error, success) => {
    if (error) {
        console.error('[EMAIL SERVICE] Connection failed:', error.message);
    } else {
        console.log('[EMAIL SERVICE] Ready to send emails');
    }
});

/**
 * Send OTP verification email
 * @param {string} email - Recipient email address
 * @param {string} otp - 6-digit OTP code
 * @param {string} firstName - User's first name (optional)
 */
exports.sendVerificationEmail = async (email, otp, firstName = 'User') => {
    const mailOptions = {
        from: {
            name: 'Secure Script Store',
            address: process.env.SMTP_USER
        },
        to: email,
        subject: '🔐 Verify Your Email - Secure Script Store',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td align="center" style="padding: 40px 0;">
                            <table role="presentation" style="width: 600px; border-collapse: collapse; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.3);">
                                <!-- Header -->
                                <tr>
                                    <td style="padding: 40px 40px 20px; text-align: center;">
                                        <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                                            <span style="background: linear-gradient(90deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Secure Script Store</span>
                                        </h1>
                                    </td>
                                </tr>
                                
                                <!-- Content -->
                                <tr>
                                    <td style="padding: 20px 40px;">
                                        <p style="margin: 0 0 20px; color: #e0e0e0; font-size: 16px; line-height: 1.6;">
                                            Hi <strong style="color: #ffffff;">${firstName}</strong>,
                                        </p>
                                        <p style="margin: 0 0 30px; color: #b0b0b0; font-size: 15px; line-height: 1.6;">
                                            Thank you for signing up! Please use the verification code below to complete your registration:
                                        </p>
                                        
                                        <!-- OTP Box -->
                                        <div style="text-align: center; padding: 30px; background: rgba(255,255,255,0.05); border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);">
                                            <p style="margin: 0 0 10px; color: #888; font-size: 14px; text-transform: uppercase; letter-spacing: 2px;">Verification Code</p>
                                            <div style="font-size: 42px; font-weight: 700; letter-spacing: 12px; color: #ffffff; font-family: 'Courier New', monospace;">
                                                ${otp}
                                            </div>
                                        </div>
                                        
                                        <p style="margin: 30px 0 0; color: #888; font-size: 13px; text-align: center;">
                                            ⏰ This code will expire in <strong style="color: #ff6b6b;">10 minutes</strong>
                                        </p>
                                    </td>
                                </tr>
                                
                                <!-- Footer -->
                                <tr>
                                    <td style="padding: 30px 40px; background: rgba(0,0,0,0.2);">
                                        <p style="margin: 0; color: #666; font-size: 12px; text-align: center;">
                                            If you didn't request this, please ignore this email.
                                        </p>
                                        <p style="margin: 10px 0 0; color: #444; font-size: 11px; text-align: center;">
                                            © 2024 Secure Script Store. All rights reserved.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`[EMAIL SERVICE] Verification email sent to ${email}: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error(`[EMAIL SERVICE] Failed to send email to ${email}:`, error.message);
        throw error;
    }
};

/**
 * Send welcome email after successful verification
 * @param {string} email - Recipient email address
 * @param {string} firstName - User's first name
 */
exports.sendWelcomeEmail = async (email, firstName = 'User') => {
    const mailOptions = {
        from: {
            name: 'Secure Script Store',
            address: process.env.SMTP_USER
        },
        to: email,
        subject: '🎉 Welcome to Secure Script Store!',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
            </head>
            <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td align="center" style="padding: 40px 0;">
                            <table role="presentation" style="width: 600px; border-collapse: collapse; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; overflow: hidden;">
                                <tr>
                                    <td style="padding: 40px; text-align: center;">
                                        <div style="font-size: 60px; margin-bottom: 20px;">🎉</div>
                                        <h1 style="margin: 0 0 20px; color: #ffffff; font-size: 28px;">Welcome, ${firstName}!</h1>
                                        <p style="margin: 0 0 30px; color: #b0b0b0; font-size: 16px; line-height: 1.6;">
                                            Your account has been successfully verified. You now have full access to all our premium automation scripts.
                                        </p>
                                        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" 
                                           style="display: inline-block; padding: 15px 40px; background: linear-gradient(90deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                                            Go to Dashboard →
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`[EMAIL SERVICE] Welcome email sent to ${email}: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error(`[EMAIL SERVICE] Failed to send welcome email to ${email}:`, error.message);
        // Don't throw - welcome email is not critical
        return { success: false, error: error.message };
    }
};
