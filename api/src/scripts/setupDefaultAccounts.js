import User from "../models/User.js";
import MembershipPlan from "../models/MembershipPlan.js";
import bcrypt from "bcryptjs";

const setupDefaultAccounts = async () => {
  try {
    console.log("🔧 Checking for default accounts...");

    // Default Admin Account
    const adminExists = await User.findOne({ email: "admin@example.com" });
    if (!adminExists) {
      const hashedAdminPassword = bcrypt.hashSync("123456789", 10);
      const adminUser = new User({
        name: "Admin",
        email: "admin@example.com",
        password: hashedAdminPassword,
        phone: "0000000000",
        role: ["ADMIN"],
        membershipStatus: "Active",
        mustChangePassword: false
      });
      await adminUser.save();
      console.log("✅ Default Admin account created: admin@example.com / 123456789");
    } else {
      console.log("ℹ️  Admin account already exists: admin@example.com");
      // Update existing admin to not require password change if needed
      await User.updateOne({ email: "admin@example.com" }, { mustChangePassword: false });
    }

    // Default Staff Account
    const staffExists = await User.findOne({ email: "staff@example.com" });
    if (!staffExists) {
      const hashedStaffPassword = bcrypt.hashSync("123456789", 10);
      const staffUser = new User({
        name: "Staff",
        email: "staff@example.com",
        password: hashedStaffPassword,
        phone: "1111111111",
        role: ["STAFF"],
        membershipStatus: "Active",
        mustChangePassword: false
      });
      await staffUser.save();
      console.log("Default Staff account created: staff@example.com / 123456789");
    } else {
      console.log("ℹ Staff account already exists: staff@example.com");
      // Update existing staff to not require password change if needed
      await User.updateOne({ email: "staff@example.com" }, { mustChangePassword: false });
    }

    // Default Membership Plans
    const plansCount = await MembershipPlan.countDocuments();
    if (plansCount === 0) {
      console.log("🔧 Creating default membership plans (4 Duration Packages)...");
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
      await MembershipPlan.insertMany(defaultPlans);
      console.log("✅ Default membership plans created!");
    }

    console.log("Default accounts setup completed!");
  } catch (error) {
    console.error("Error setting up default accounts:", error);
  }
};

export default setupDefaultAccounts;