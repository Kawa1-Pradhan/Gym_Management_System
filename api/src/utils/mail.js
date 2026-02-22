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
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: process.env.EMAIL_SECURE === "true", // false for 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
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
