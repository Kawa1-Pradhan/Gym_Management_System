import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import MembershipPlan from '../../src/models/MembershipPlan.js';

// Load .env from the api directory relative to this script
dotenv.config({ path: path.join(process.cwd(), 'api', '.env') });

async function checkPlans() {
    try {
        const mongoUri = process.env.MONGODB_URL;
        if (!mongoUri) throw new Error("MONGODB_URL is not defined in .env");

        await mongoose.connect(mongoUri);
        const plans = await MembershipPlan.find({});
        console.log(`Found ${plans.length} plans in database.`);
        plans.forEach(p => {
            console.log(`- ${p.name} (${p.categories.length} categories) | Active: ${p.isActive}`);
        });
        process.exit(0);
    } catch (err) {
        console.error("Error checking plans:", err);
        process.exit(1);
    }
}

checkPlans();
