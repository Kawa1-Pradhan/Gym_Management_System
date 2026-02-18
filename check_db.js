import mongoose from 'mongoose';
import dotenv from 'dotenv';
import MembershipPlan from './api/src/models/MembershipPlan.js';

dotenv.config({ path: './api/.env' });

async function checkPlans() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gym_management');
        const plans = await MembershipPlan.find({});
        console.log(`Found ${plans.length} plans.`);
        plans.forEach(p => {
            console.log(`- ${p.name} (${p.categories.length} categories)`);
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkPlans();
