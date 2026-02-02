import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const mongoURI = process.env.MONGO_URI || "mongodb://localhost:27017/gym-management";

async function migrate() {
    try {
        await mongoose.connect(mongoURI);
        console.log('Connected to MongoDB');

        const Inventory = mongoose.model('inventories', new mongoose.Schema({ category: String }));

        const result = await Inventory.updateMany(
            { category: { $in: ['Equipment', 'Admin'] } },
            { $set: { category: 'Weights' } }
        );

        console.log(`Migration complete. Updated ${result.modifiedCount} items.`);
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
