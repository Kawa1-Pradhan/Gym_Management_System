import User from "../models/User.js";
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
        membershipStatus: "Active"
      });
      await adminUser.save();
      console.log("✅ Default Admin account created: admin@example.com / 123456789");
    } else {
      console.log("ℹ️  Admin account already exists: admin@example.com");
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
        membershipStatus: "Active"
      });
      await staffUser.save();
      console.log("Default Staff account created: staff@example.com / 123456789");
    } else {
      console.log("ℹ Staff account already exists: staff@example.com");
    }

    console.log("Default accounts setup completed!");
  } catch (error) {
    console.error("Error setting up default accounts:", error);
  }
};

export default setupDefaultAccounts;