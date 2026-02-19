import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import MembershipPlan from '../../src/models/MembershipPlan.js';

// Load .env from the api directory relative to this script
dotenv.config({ path: path.join(process.cwd(), 'api', '.env') });

const defaultPlans = [
    {
        name: "1 Month Package",
        durationMonths: 1,
        description: "Flexible monthly access for consistent training.",
        categories: [
            { name: "Gym only", price: 2000 },
            { name: "Zumba", price: 2000 },
            { name: "Cardio only", price: 2500 },
            { name: "Gym & Cardio", price: 3500 }
        ],
        features: ["Locker facility", "Standard equipment", "24/7 Access"],
        isActive: true
    },
    {
        name: "3 Months Package",
        durationMonths: 3,
        description: "Commit to your progress with our quarterly plan.",
        categories: [
            { name: "Gym only", price: 5500 },
            { name: "Zumba", price: 5000 },
            { name: "Cardio only", price: 6500 },
            { name: "Gym & Cardio", price: 9000 }
        ],
        features: ["Locker facility", "Full gym access", "Free assessment"],
        isActive: true,
        highlightTag: "Popular"
    },
    {
        name: "6 Months Package",
        durationMonths: 6,
        description: "Build a lifestyle with half-year rewards.",
        categories: [
            { name: "Gym only", price: 9000 },
            { name: "Zumba", price: 9000 },
            { name: "Cardio only", price: 10500 },
            { name: "Gym & Cardio", price: 16000 }
        ],
        features: ["1 Sauna Bath Free Every Month", "Locker facility", "Personalized coaching intro"],
        isActive: true
    },
    {
        name: "Yearly Package",
        durationMonths: 12,
        description: "The ultimate commitment for serious athletes.",
        categories: [
            { name: "Gym only", price: 16000 },
            { name: "Zumba", price: 16000 },
            { name: "Cardio only", price: 18000 },
            { name: "Gym & Cardio", price: 28000 }
        ],
        features: ["2 Sauna Baths Free Every Month", "24/7 Priority Access", "Family discount eligible"],
        isActive: true,
        highlightTag: "Best Value"
    }
];

async function forceSeed() {
    try {
        const mongoUri = process.env.MONGODB_URL;
        if (!mongoUri) throw new Error("MONGODB_URL is not defined in .env");

        console.log(`Connecting to MongoDB...`);
        await mongoose.connect(mongoUri);

        console.log(`Deleting old plans...`);
        await MembershipPlan.deleteMany({});

        console.log(`Inserting 4 new duration packages...`);
        await MembershipPlan.insertMany(defaultPlans);

        console.log(`✅ Success: 4 Membership plans updated!`);
        process.exit(0);
    } catch (err) {
        console.error(`❌ Error during force-seed:`, err);
        process.exit(1);
    }
}

forceSeed();
