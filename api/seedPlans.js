import mongoose from 'mongoose';
import dotenv from 'dotenv';
import MembershipPlan from './src/models/MembershipPlan.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config(); // Load .env from current directory

console.log("Attempting to connect to DB...");
console.log("MONGO_URI exists:", !!process.env.MONGO_URI);

const plans = [
    {
        name: "1 Month",
        price: 1500,
        durationDays: 30,
        description: "Standard monthly access",
        features: ["Gym floor usage", "Boxing access", "Attendance tracking", "Booking system"],
        highlightTag: "",
        discountPercent: 0
    },
    {
        name: "3 Months",
        price: 4000,
        durationDays: 90,
        description: "Quarterly commitment with perks",
        features: ["All 1-month features", "Priority booking", "Guest pass (1/month)", "10% savings"],
        highlightTag: "",
        discountPercent: 10
    },
    {
        name: "6 Months",
        price: 7200,
        durationDays: 180,
        description: "Half-yearly access with training",
        features: ["All 3-month features", "Free personal training session", "Nutrition consultation", "15% savings"],
        highlightTag: "",
        discountPercent: 15
    },
    {
        name: "Yearly",
        price: 12000,
        durationDays: 365,
        description: "Full year access with premium perks",
        features: ["All 6-month features", "Unlimited guest passes", "Premium locker", "25% savings"],
        highlightTag: "Best Value",
        discountPercent: 25
    }
];

const seedDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log("Connected to DB");

        // Clear existing plans to ensure clean state or upsert?
        // Let's delete all and re-insert to match the requested fresh start.
        await MembershipPlan.deleteMany({});

        await MembershipPlan.insertMany(plans);
        console.log("Plans seeded successfully!");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedDB();
