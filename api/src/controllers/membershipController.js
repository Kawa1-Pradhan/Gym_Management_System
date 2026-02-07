import MembershipPlan from "../models/MembershipPlan.js";
import Payment from "../models/Payment.js";
import User from "../models/User.js";
import { initiateKhaltiPayment, verifyKhaltiPayment } from "../services/khaltiService.js";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer"; // Assuming nodemailer is used, need to import or reuse existing email service

// Reuse existing sendEmail function if available, otherwise define minimal one here or import
// For now, let's assume we can use a helper or just implement simple sending.
// Better to check if there is an email service. I recall User.js has emailStatus fields.
// I will implement a basic sender here using env vars, or ideally use a shared service if existed.
// Let's implement a quick sender helper.

const sendCredentialsEmail = async (email, name, password, planName) => {
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Welcome to Our Gym! - Your Login Credentials",
            html: `
                <div style="font-family: Arial, sans-serif; color: #333;">
                    <h2>Welcome to the Family, ${name}!</h2>
                    <p>Thank you for purchasing the <strong>${planName}</strong> membership.</p>
                    <p>Your account has been created. You can log in to our app using the following credentials:</p>
                    <div style="background: #f4f4f4; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p><strong>Email:</strong> ${email}</p>
                        <p><strong>Password:</strong> ${password}</p>
                    </div>
                    <p>Please change your password after your first login for security.</p>
                    <p>See you at the gym!</p>
                </div>
            `,
        };

        await transporter.sendMail(mailOptions);
        console.log(`Credentials sent to ${email}`);
    } catch (error) {
        console.error("Email sending failed:", error);
    }
};

const sendRenewalEmail = async (email, name, planName, expiryDate) => {
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Membership Renewed Successfully!",
            html: `
                <div style="font-family: Arial, sans-serif; color: #333;">
                    <h2>Hi ${name},</h2>
                    <p>Your membership renewal for <strong>${planName}</strong> was successful.</p>
                    <p>Your new expiry date is: <strong>${new Date(expiryDate).toLocaleDateString()}</strong></p>
                    <p>Keep up the good work!</p>
                </div>
            `,
        };

        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error("Renewal email failed:", error);
    }
}


export const getPlans = async (req, res) => {
    try {
        // Only show active plans to public
        const plans = await MembershipPlan.find({ isActive: true }).sort({ price: 1 });
        res.json(plans);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const initiatePurchase = async (req, res) => {
    try {
        const { planId, name, email, phone } = req.body;
        const userId = req.user ? req.user.id : null; // If logged in

        // 1. Validate Plan
        const plan = await MembershipPlan.findById(planId);
        if (!plan) return res.status(404).json({ message: "Plan not found" });

        // 2. Validate User/Guest
        let customerInfo = { name, email, phone };

        if (userId) {
            const user = await User.findById(userId);
            if (!user) return res.status(404).json({ message: "User not found" });
            customerInfo = { name: user.name, email: user.email, phone: user.phone };
        } else {
            // Guest Validations
            if (!name || !email || !phone) {
                return res.status(400).json({ message: "Name, email, and phone are required for guest checkout." });
            }
            // Check if user already exists (prevent duplicate active accounts via guest flow if possible, or just link?)
            // Requirement says "Create new member account". If email exists, we might have a conflict on User creation later.
            // Let's check now.
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ message: "User with this email already exists. Please login to renew or purchase." });
            }
        }

        // 3. Calculate Amount (Paisa) with Discount
        let finalPrice = plan.price;
        if (plan.discountPercent > 0) {
            const discountAmount = (plan.price * plan.discountPercent) / 100;
            finalPrice = plan.price - discountAmount;
        }
        const amountPaisa = Math.round(finalPrice * 100); // Ensure integer paisa

        // 4. Construct Payload
        const purchaseOrderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const payload = {
            return_url: `${process.env.CLIENT_URL || "http://localhost:5173"}/payment/success`, // Define CLIENT_URL in env
            website_url: `${process.env.CLIENT_URL || "http://localhost:5173"}/`,
            amount: amountPaisa,
            purchase_order_id: purchaseOrderId,
            purchase_order_name: plan.name,
            customer_info: {
                name: customerInfo.name,
                email: customerInfo.email,
                phone: customerInfo.phone
            }
        };

        // 5. Initiate Khalti
        const khaltiResponse = await initiateKhaltiPayment(payload);

        // 6. Save Payment Record (Pending)
        const newPayment = new Payment({
            transactionId: khaltiResponse.pidx,
            amount: amountPaisa,
            purchaseOrderId,
            purchaseOrderName: plan.name,
            customerInfo,
            userId: userId || null, // Null for guest
            planId: plan._id,
            status: "Pending",
            type: userId ? "Renewal" : "New", // Simple logic: if logged in, it's renewal/upgrade? Or always New? 
            // Requirement mentions Renewals. If user is logged in and has active membership, it's a renewal. For now let's say:
            // If they are buying while logged in, treat as Renewal if they have a status, or New if not. 
            // Actually, let's determine type during verification or just save "New" if no active sub.
            // Simplified: If userId exists, check current status? Let's just default to New unless explicit renew action?
            // "When a member clicks 'Renew', initiate...". Let's assume frontend passes a 'type' or we infer it.
            // We'll stick to 'New' if not specified, 'Renewal' if user has active plan. 
        });

        // Actually, if userId is present, let's check if they are "Active".
        if (userId) {
            const user = await User.findById(userId);
            if (user.membershipStatus === 'Active') {
                newPayment.type = 'Renewal';
            }
        }

        await newPayment.save();

        res.json({ payment_url: khaltiResponse.payment_url });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

export const verifyPayment = async (req, res) => {
    try {
        const { pidx } = req.body;
        if (!pidx) return res.status(400).json({ message: "PIDX is required" });

        // 1. Verify with Khalti
        const khaltiData = await verifyKhaltiPayment(pidx);

        if (khaltiData.status !== "Completed") {
            // Update Payment Status
            await Payment.findOneAndUpdate({ transactionId: pidx }, { status: khaltiData.status });
            return res.status(400).json({ message: `Payment status: ${khaltiData.status}` });
        }

        // 2. Find Pending Payment Record
        const payment = await Payment.findOne({ transactionId: pidx });
        if (!payment) return res.status(404).json({ message: "Payment record not found" });

        if (payment.status === "Completed") {
            return res.json({ message: "Payment already processed", payment });
        }

        // 3. Mark Payment Completed
        payment.status = "Completed";
        payment.gatewayResponse = khaltiData;
        await payment.save();

        // 4. Handle Membership Logic
        const plan = await MembershipPlan.findById(payment.planId);

        let user;
        let passwordGenerated = null;

        if (payment.userId) {
            // Member Renewal/Purchase
            user = await User.findById(payment.userId);

            // Calculate new expiry
            const currentExpiry = user.membershipExpiryDate && new Date(user.membershipExpiryDate) > new Date()
                ? new Date(user.membershipExpiryDate)
                : new Date();

            const newExpiry = new Date(currentExpiry);
            newExpiry.setDate(newExpiry.getDate() + plan.durationDays);

            user.membershipStatus = "Active";
            user.membershipExpiryDate = newExpiry;
            user.membershipType = plan.name; // Simplified
            user.membershipStartDate = user.membershipStartDate || new Date(); // Set if first time

            await user.save();

            // Send Renewal Email
            await sendRenewalEmail(user.email, user.name, plan.name, newExpiry);

        } else {
            // Guest - Create New Account
            const randomPassword = crypto.randomBytes(4).toString("hex"); // 8 chars
            passwordGenerated = randomPassword;
            const hashedPassword = await bcrypt.hash(randomPassword, 10);

            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + plan.durationDays);

            user = new User({
                name: payment.customerInfo.name,
                email: payment.customerInfo.email,
                phone: payment.customerInfo.phone,
                password: hashedPassword,
                role: ["MEMBER"],
                membershipStatus: "Active",
                membershipExpiryDate: expiryDate,
                membershipType: plan.name,
                membershipStartDate: new Date(),
                mustChangePassword: false
            });

            await user.save();

            // Link payment to new user
            payment.userId = user._id;
            await payment.save();

            // Send Credentials Email
            await sendCredentialsEmail(user.email, user.name, randomPassword, plan.name);
        }

        res.json({ success: true, message: "Membership activated", user: { name: user.name, email: user.email } });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

export const getUserPayments = async (req, res) => {
    try {
        const userId = req.user.id;
        const payments = await Payment.find({ userId }).sort({ createdAt: -1 });
        res.json(payments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updatePlan = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Validation
        if (updates.discountPercent !== undefined) {
            if (updates.discountPercent < 0 || updates.discountPercent > 100) {
                return res.status(400).json({ message: "Discount must be between 0 and 100" });
            }
        }

        const plan = await MembershipPlan.findByIdAndUpdate(id, updates, { new: true });
        if (!plan) return res.status(404).json({ message: "Plan not found" });

        res.json(plan);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
