import MembershipPlan from "../models/MembershipPlan.js";
import Payment from "../models/Payment.js";
import User from "../models/User.js";
import { initiateKhaltiPayment, verifyKhaltiPayment } from "../services/khaltiService.js";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { sendCredentialsEmail, sendRenewalEmail } from "../utils/mail.js";
import notificationService from "../services/notificationService.js";

export const getPlans = async (req, res) => {
    try {
        const plans = await MembershipPlan.find({}).sort({ price: 1 });
        res.json(plans);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const initiatePurchase = async (req, res) => {
    try {
        const { planId, categoryName, name, email, phone } = req.body;
        const userId = req.user ? req.user.id : null;

        const plan = await MembershipPlan.findById(planId);
        if (!plan) return res.status(404).json({ message: "Package not found" });

        const category = plan.categories.find(c => c.name === categoryName);
        if (!category) return res.status(400).json({ message: "Invalid membership category" });

        let customerInfo = { name, email, phone };
        let isNewMember = false;
        let finalUserId = null;

        if (userId) {
            const user = await User.findById(userId);
            if (!user) return res.status(404).json({ message: "User not found" });
            
            const inputEmail = (email || "").toLowerCase().trim();
            const loggedInEmail = (user.email || "").toLowerCase().trim();

            if (inputEmail === loggedInEmail || !inputEmail) {
                
                finalUserId = userId;
                customerInfo = { name: user.name, email: user.email, phone: user.phone };

                // New member if they don't have an active or expired membership history
                if (user.membershipStatus === 'Pending' || user.membershipType === 'None') {
                    isNewMember = true;
                }
            } else {
               
                isNewMember = true;
            }
        } else {
            // Guest Validations
            if (!name || !email || !phone) {
                return res.status(400).json({ message: "Name, email, and phone are required for checkout." });
            }
            isNewMember = true; 
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ message: "An account with this email already exists. Please login to renew." });
            }
        }

        let finalPrice = category.price;
        const ADMISSION_FEE = 1000;
        const CARD_FEE = 500;

        if (isNewMember) {
            finalPrice += (ADMISSION_FEE + CARD_FEE);
        }

        const amountPaisa = Math.round(finalPrice * 100);

        const origin = req.get('origin') || process.env.CLIENT_URL || "http://localhost:5173";
        const purchaseOrderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const payload = {
            return_url: `${origin}/payment/success`,
            website_url: `${origin}/`,
            amount: amountPaisa,
            purchase_order_id: purchaseOrderId,
            purchase_order_name: `${plan.name} - ${categoryName}`,
            customer_info: {
                name: customerInfo.name,
                email: customerInfo.email,
                phone: customerInfo.phone
            }
        };

        const khaltiResponse = await initiateKhaltiPayment(payload);
       
        const newPayment = new Payment({
            transactionId: khaltiResponse.pidx,
            amount: amountPaisa,
            purchaseOrderId,
            purchaseOrderName: `${plan.name} - ${categoryName}`,
            customerInfo,
            userId: finalUserId || null,
            planId: plan._id,
            categoryName: categoryName, 
            status: "Pending",
            type: isNewMember ? "New" : "Renewal"
        });

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

        // Double check with Khalti to make sure the payment is real
        const khaltiData = await verifyKhaltiPayment(pidx);

        if (khaltiData.status !== "Completed") {
            // Update Payment Status
            await Payment.findOneAndUpdate({ transactionId: pidx }, { status: khaltiData.status });
            return res.status(400).json({ message: `Payment status: ${khaltiData.status}` });
        }

        // Find the matching payment record in our system
        const payment = await Payment.findOne({ transactionId: pidx });
        if (!payment) return res.status(404).json({ message: "Payment record not found" });

        if (payment.status === "Completed") {
            return res.json({ message: "Payment already processed", payment });
        }

        // Success! Mark the payment as completed
        payment.status = "Completed";
        payment.gatewayResponse = khaltiData;
        await payment.save();

        // Now we can update their membership status
        const plan = await MembershipPlan.findById(payment.planId);

        const categoryName = payment.categoryName;

        let user;
        let passwordGenerated = null;

        if (payment.userId) {
            
            user = await User.findById(payment.userId);

           
            const currentExpiry = user.membershipExpiryDate && new Date(user.membershipExpiryDate) > new Date()
                ? new Date(user.membershipExpiryDate)
                : new Date();

            const newExpiry = new Date(currentExpiry);
            newExpiry.setMonth(newExpiry.getMonth() + (plan.durationMonths || 1));

            user.membershipStatus = "Active";
            user.membershipExpiryDate = newExpiry;
            user.membershipType = `${plan.name} (${categoryName})`;
            user.membershipStartDate = user.membershipStartDate || new Date();

            await user.save();

            
            sendRenewalEmail(user.email, user.name, user.membershipType, newExpiry);

           
            const { awardPoints } = await import("./achievementController.js");
            const PointRule = (await import("../models/PointRule.js")).default;

            const renewalRule = await PointRule.findOne({ action: 'RENEWAL', isActive: true });
            if (renewalRule) {
                await awardPoints(user._id, renewalRule.points, `Renewed ${user.membershipType} Membership`, "RENEWAL");
            } else {
                
                await awardPoints(user._id, 50, "Membership Renewed", "RENEWAL");
            }

          
            const admins = await User.find({ role: 'ADMIN' });
            for (const admin of admins) {
                await notificationService.upsertNotification(
                    admin._id,
                    "Membership Renewed",
                    `Member ${user.name} has renewed their ${user.membershipType} membership.`,
                    "membership",
                    user._id,
                    "/users"
                );
            }

        } else {
            
            const existingUser = await User.findOne({ email: payment.customerInfo.email.toLowerCase().trim() });

            if (existingUser) {
                
                user = existingUser;
                const currentExpiry = user.membershipExpiryDate && new Date(user.membershipExpiryDate) > new Date()
                    ? new Date(user.membershipExpiryDate)
                    : new Date();
                const newExpiry = new Date(currentExpiry);
                newExpiry.setMonth(newExpiry.getMonth() + (plan.durationMonths || 1));

                user.membershipStatus = "Active";
                user.membershipExpiryDate = newExpiry;
                user.membershipType = `${plan.name} (${categoryName})`;
                user.membershipStartDate = user.membershipStartDate || new Date();
                await user.save();
                passwordGenerated = null; 
                sendRenewalEmail(user.email, user.name, user.membershipType, newExpiry);
            } else {
                const randomPassword = crypto.randomBytes(4).toString("hex");
                passwordGenerated = randomPassword;
                const hashedPassword = await bcrypt.hash(randomPassword, 10);

                const expiryDate = new Date();
                expiryDate.setMonth(expiryDate.getMonth() + (plan.durationMonths || 1));

                user = new User({
                    name: payment.customerInfo.name,
                    email: payment.customerInfo.email,
                    phone: payment.customerInfo.phone,
                    password: hashedPassword,
                    role: ["MEMBER"],
                    membershipStatus: "Active",
                    membershipExpiryDate: expiryDate,
                    membershipType: `${plan.name} (${categoryName})`,
                    membershipStartDate: new Date(),
                    mustChangePassword: false
                });

                try {
                    await user.save();
                } catch (dupErr) {
                    if (dupErr.code === 11000) {
                        
                        const dupField = Object.keys(dupErr.keyPattern)[0];

                        if (dupField === 'email') {
                            
                            user = await User.findOne({ email: payment.customerInfo.email.toLowerCase().trim() });
                            if (user) {
                                user.membershipStatus = "Active";
                                user.membershipType = `${plan.name} (${categoryName})`;
                                await user.save();
                                passwordGenerated = null; 
                            } else {
                                throw dupErr;
                            }
                        } else if (dupField === 'phone') {
                            
                            user.phone = `${payment.customerInfo.phone}-${crypto.randomBytes(2).toString('hex')}`;
                            await user.save();
                            
                            throw dupErr;
                        }
                    } else {
                        throw dupErr;
                    }
                }

                
                if (passwordGenerated) {
                    sendCredentialsEmail(user.email, user.name, passwordGenerated, user.membershipType);
                }
            }

            
            payment.userId = user._id;
            await payment.save();

          
            const { awardPoints } = await import("./achievementController.js");
            const PointRule = (await import("../models/PointRule.js")).default;

            const signupRule = await PointRule.findOne({ action: 'SIGNUP', isActive: true });
            if (signupRule) {
                await awardPoints(user._id, signupRule.points, "New Membership Joined", "SIGNUP");
            } else {
                // Fallback or skip if no rule defined
                await awardPoints(user._id, 100, "First Membership Purchase", "SIGNUP");
            }

            // Notify Admin about new member
            const admins = await User.find({ role: 'ADMIN' });
            for (const admin of admins) {
                await notificationService.upsertNotification(
                    admin._id,
                    "New Member Joined",
                    `${user.name} has joined as a new member (${user.membershipType}).`,
                    "membership",
                    user._id,
                    "/users"
                );
            }
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

        const plan = await MembershipPlan.findByIdAndUpdate(id, updates, { returnDocument: 'after' });
        if (!plan) return res.status(404).json({ message: "Plan not found" });

        res.json(plan);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

import nodemailer from 'nodemailer';

export const testEmailConnection = async (req, res) => {
    try {
        const user = process.env.EMAIL_USER;
        const pass = process.env.EMAIL_PASS;

        if (!user || !pass) {
            return res.json({
                success: false,
                message: "Environment variables EMAIL_USER or EMAIL_PASS are missing on this server."
            });
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

        // Use native transporter verification to test if the port is open and credentials work
        await transporter.verify();

        return res.json({
            success: true,
            serverHost: req.get('host'),
            message: "SMTP Connection Successful! Nodemailer successfully reached Google SMTP on Port 465."
        });

    } catch (error) {
        return res.json({
            success: false,
            serverHost: req.get('host'),
            message: "SMTP Connection Failed! Render or Google is blocking the connection.",
            errorName: error.name,
            errorMessage: error.message,
            errorCode: error.code,
            errorCommand: error.command
        });
    }
};
