import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const getEmailConfig = () => {
    const user = (process.env.EMAIL_USER || '').trim().replace(/^["']|["']$/g, '');
    const pass = (process.env.EMAIL_PASS || '').trim().replace(/^["']|["']$/g, '');
    return { user, pass };
};

const { user, pass } = getEmailConfig();

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // use SSL
    auth: {
        user: user,
        pass: pass
    }
});

export const sendEnrollmentEmail = async (userEmail, userName, tempPassword) => {
    // Skip if credentials are not configured or are still placeholders
    if (!user || !pass || user === 'your-email@gmail.com') {
        console.error("❌ FATAL: Cannot send Enrollment Email. EMAIL_USER or EMAIL_PASS environment variables are missing from your deployed Server (Render/Vercel) Environment Settings!");
        return;
    }

    const mailOptions = {
        from: user,
        to: userEmail,
        subject: 'Welcome to Dharan Fitness Club - Your Login Credentials',
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <h2 style="color: #16a34a;">Welcome to Dharan Fitness Club, ${userName}!</h2>
                <p>You have been successfully enrolled as a member. Below are your login credentials for our portal:</p>
                <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Email:</strong> ${userEmail}</p>
                    <p><strong>Temporary Password:</strong> ${tempPassword}</p>
                </div>
                <p>You can now log in and manage your sessions and bookings.</p>
                <p>Best regards,<br>Dharan Fitness Club Team</p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Enrollment email sent to:', userEmail);

        // Update user status in DB
        const User = (await import('../models/User.js')).default;
        await User.updateOne({ email: userEmail }, {
            emailLastStatus: 'Sent',
            emailLastError: null
        });
    } catch (error) {
        console.error('❌ Error sending enrollment email:');
        console.error('Code:', error.code || 'N/A');
        console.error('Message:', error.message);

        // Update user status in DB
        try {
            const User = (await import('../models/User.js')).default;
            await User.updateOne({ email: userEmail }, {
                emailLastStatus: 'Failed',
                emailLastError: error.message
            });
        } catch (dbError) {
            console.error('Failed to update email error status in DB:', dbError.message);
        }
    }
};
export const sendBookingCancellationEmail = async (userEmail, userName, sessionDetails) => {
    if (!user || !pass || user === 'your-email@gmail.com') {
        console.error("❌ FATAL: Cannot send Cancellation Email. EMAIL_USER or EMAIL_PASS environment variables are missing from your deployed Server (Render/Vercel) Environment Settings!");
        return;
    }

    const mailOptions = {
        from: user,
        to: userEmail,
        subject: 'Booking Cancelled - Dharan Fitness Club',
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <h2 style="color: #ef4444;">Booking Cancellation Notice</h2>
                <p>Hello ${userName},</p>
                <p>Your booking for the following session has been cancelled by an administrator:</p>
                <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Session:</strong> ${sessionDetails.name}</p>
                    <p><strong>Date:</strong> ${sessionDetails.date}</p>
                    <p><strong>Time:</strong> ${sessionDetails.startTime}</p>
                </div>
                <p>If you have any questions, please contact the gym staff.</p>
                <p>Best regards,<br>Dharan Fitness Club Team</p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Cancellation email sent to:', userEmail);
    } catch (error) {
        console.error('❌ Error sending cancellation email:', error.message);
    }
};

export const sendCredentialsEmail = async (userEmail, userName, password, planName) => {
    if (!user || !pass || user === 'your-email@gmail.com') {
        console.error("❌ FATAL: Cannot send Credentials Email. EMAIL_USER or EMAIL_PASS environment variables are missing from your deployed Server (Render/Vercel) Environment Settings!");
        return;
    }

    const mailOptions = {
        from: user,
        to: userEmail,
        subject: 'Welcome to Dharan Fitness Club - Your Login Credentials',
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <h2 style="color: #16a34a;">Welcome to the Family, ${userName}!</h2>
                <p>Thank you for purchasing the <strong>${planName}</strong> membership.</p>
                <p>Your account has been created. Use the credentials below to log in:</p>
                <div style="background: #f4f4f4; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Email:</strong> ${userEmail}</p>
                    <p><strong>Password:</strong> ${password}</p>
                </div>
                <p style="color: #d32f2f; font-weight: bold;">Note: Please collect your tap door entry card from the gym counter.</p>
                <p>Please change your password after your first login for security.</p>
                <p>Best regards,<br>Dharan Fitness Club Team</p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Credentials email sent to:', userEmail);
    } catch (error) {
        console.error('❌ Error sending credentials email:', error.message);
    }
};

export const sendRenewalEmail = async (userEmail, userName, planName, expiryDate) => {
    if (!user || !pass || user === 'your-email@gmail.com') {
        console.error("❌ FATAL: Cannot send Renewal Email. EMAIL_USER or EMAIL_PASS environment variables are missing from your deployed Server (Render/Vercel) Environment Settings!");
        return;
    }

    const mailOptions = {
        from: user,
        to: userEmail,
        subject: 'Membership Renewed Successfully! - Dharan Fitness Club',
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <h2 style="color: #16a34a;">Hi ${userName},</h2>
                <p>Your membership renewal for <strong>${planName}</strong> was successful.</p>
                <p>Your new expiry date is: <strong>${new Date(expiryDate).toLocaleDateString()}</strong></p>
                <p>You can access your account dashboard anytime using your existing login credentials.</p>
                <p style="color: #d32f2f; font-weight: bold;">Note: Please collect your tap door entry card from the gym counter (if you haven't již).</p>
                <p>Keep up the good work!</p>
                <p>Best regards,<br>Dharan Fitness Club Team</p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Renewal email sent to:', userEmail);
    } catch (error) {
        console.error('❌ Error sending renewal email:', error.message);
    }
};
