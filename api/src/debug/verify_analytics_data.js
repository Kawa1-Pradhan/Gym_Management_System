import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import User from '../models/User.js';
import Booking from '../models/Booking.js';
import BoxingSession from '../models/BoxingSession.js';
import SaunaSession from '../models/SaunaSession.js';
import dns from 'dns';

// Fix for potential DNS issues in some environments
dns.setServers(['1.1.1.1', '1.0.0.1']);

// Load .env from the api directory relative to this script
dotenv.config({ path: path.join(process.cwd(), 'api', '.env') });

async function checkAllData() {
    try {
        const mongoUri = process.env.MONGODB_URL;
        if (!mongoUri) throw new Error("MONGODB_URL is not defined in .env");

        await mongoose.connect(mongoUri);

        console.log('--- LATEST SESSIONS (Top 5) ---');
        const bSessions = await BoxingSession.find({}).sort({ date: -1 }).limit(5);
        bSessions.forEach(s => console.log(`Boxing: ${s.name} | Date: ${s.date.toISOString()} | Status: ${s.status}`));

        const sSessions = await SaunaSession.find({}).sort({ date: -1 }).limit(5);
        sSessions.forEach(s => console.log(`Sauna: ${s.name} | Date: ${s.date.toISOString()} | Status: ${s.status}`));

        console.log('\n--- LATEST BOOKINGS (Top 5) ---');
        const bookings = await Booking.find({}).sort({ bookingDate: -1 }).limit(5);
        bookings.forEach(b => console.log(`ID: ${b._id} | Date: ${b.bookingDate ? b.bookingDate.toISOString() : 'N/A'} | Status: ${b.status} | Member: ${b.memberId}`));

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        console.log(`\nLocal Reference - Start of Month: ${startOfMonth.toISOString()}`);
        console.log(`Today's Date (Day of Month): ${now.getDate()}`);

        process.exit(0);
    } catch (err) {
        console.error("Analytics Verification Error:", err);
        process.exit(1);
    }
}

checkAllData();
