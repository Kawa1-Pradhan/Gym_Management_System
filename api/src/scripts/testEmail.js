import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

const testEmail = async () => {
    console.log('\n--- Email Diagnostic Tool ---');

    const user = (process.env.EMAIL_USER || '').trim().replace(/^["']|["']$/g, '');
    const pass = (process.env.EMAIL_PASS || '').trim().replace(/^["']|["']$/g, '');

    console.log('EMAIL_USER:', user ? user : 'MISSING');
    console.log('EMAIL_PASS:', pass ? '********' : 'MISSING');

    if (!user || !pass) {
        console.error('\n❌ ERROR: Missing credentials in .env file');
        process.exit(1);
    }

    if (user === 'your-email@gmail.com') {
        console.error('\n❌ ERROR: You are still using the placeholder email address.');
        process.exit(1);
    }

    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: user,
            pass: pass
        }
    });

    console.log('\nAttempting to send test email to:', user);

    const mailOptions = {
        from: user,
        to: user,
        subject: 'Dharan Fitness Club - Email Test',
        text: 'If you are reading this, your email configuration is working correctly!'
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('\n✅ SUCCESS! Email sent successfully.');
        console.log('Message ID:', info.messageId);
    } catch (error) {
        console.error('\n❌ FAILED to send email.');
        console.error('Error Code:', error.code || 'N/A');
        console.error('Error Message:', error.message);
    }
};

testEmail();
