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
    service: 'gmail', // Native fallback for Render/Vercel
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === "false", // MUST be false for Port 587 (STARTTLS)
    auth: {
        user: user,
        pass: pass
    }
});

export const sendEnrollmentEmail = async (userEmail, userName, tempPassword) => {

    if (!user || !pass || user === 'your-email@gmail.com') {
        console.log('Skipping enrollment email: Email credentials not configured.');
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
    } catch (error) {
        console.error(' Error sending enrollment email:');
        console.error('Code:', error.code || 'N/A');
        console.error('Message:', error.message);
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

export const sendContactEmail = async (contactData) => {
    const { name, email, subject, message } = contactData;
    const recipient = 'dharanfitnessclub@gmail.com';

    if (!user || !pass || user === 'your-email@gmail.com') {
        console.error("❌ SMS/Email Config Missing: Contact form submission logged but not sent.");
        console.log("Contact Data:", contactData);
        return;
    }

    const mailOptions = {
        from: user,
        to: recipient,
        subject: `Contact Inquiry: ${subject}`,
        replyTo: email,
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; border: 1px solid #ddd; border-radius: 10px;">
                <h2 style="color: #ef4444; border-bottom: 2px solid #ef4444; padding-bottom: 10px;">New Contact Inquiry</h2>
                <div style="margin: 20px 0;">
                    <p><strong>Name:</strong> ${name}</p>
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>Subject:</strong> ${subject}</p>
                </div>
                <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; border-left: 4px solid #ef4444;">
                    <p><strong>Message:</strong></p>
                    <p style="white-space: pre-wrap;">${message}</p>
                </div>
                <p style="font-size: 12px; color: #666; margin-top: 30px; border-top: 1px solid #ddd; pt-10;">
                    This email was sent from the Dharan Fitness Club Landing Page Contact Form.
                </p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Contact inquiry email sent to gym admin.');

        // Also send a thank you email to the user
        const thankYouOptions = {
            from: user,
            to: email,
            subject: 'Thank you for contacting Dharan Fitness Club',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #ef4444;">Hi ${name},</h2>
                    <p>Thank you for reaching out to Dharan Fitness Club!</p>
                    <p>We have received your message regarding "<strong>${subject}</strong>" and one of our team members will get back to you as soon as possible.</p>
                    <p>Best regards,<br>Dharan Fitness Club Team</p>
                </div>
            `
        };
        await transporter.sendMail(thankYouOptions);
    } catch (error) {
        console.error('❌ Error sending contact email:', error.message);
    }
};
