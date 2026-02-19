import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { sendEnrollmentEmail } from "../utils/mail.js";
import notificationService from "./notificationService.js";

const createUser = async (data, creatorRole) => {
   const existingUser = await User.findOne({
      $or: [
         { email: data.email },
         { phone: data.phone }
      ]
   });

   if (existingUser) {
      throw { statusCode: 400, message: "User with this email or phone already exists." };
   }

   // Role Validation: STAFF cannot create ADMIN
   if (creatorRole === 'STAFF' && data.role === 'ADMIN') {
      throw { statusCode: 403, message: "Staff are not authorized to create Admin accounts." };
   }

   // Auto-generate temporary password if not provided
   const tempPassword = data.password || Math.random().toString(36).slice(-8);
   const hashedPassword = bcrypt.hashSync(tempPassword);

   const newUser = await User.create({
      ...data,
      password: hashedPassword,
      role: data.role ? [data.role] : ['MEMBER'],
      mustChangePassword: false,
      isActive: true
   });

   // Send enrollment email (non-blocking)
   sendEnrollmentEmail(newUser.email, newUser.name, tempPassword);


   const userObj = newUser.toObject();
   delete userObj.password;

   return {
      user: userObj,
      tempPassword: data.password ? undefined : tempPassword // Return temp password only if auto-generated
   };
};

const getUsers = async () => {
   return await User.find().select('-password');
};

const getUserById = async (id) => {
   return await User.findById(id).select('-password');
};

const updateUser = async (id, data) => {
   // Prevent password update through this method
   if (data.password) delete data.password;

   const user = await User.findByIdAndUpdate(id, data, { returnDocument: 'after' }).select('-password');

   // Create Notification
   if (user && user.role.includes('MEMBER')) {
      await notificationService.createNotification(
         id,
         "Profile Updated",
         "Your profile information has been updated successfully.",
         "profile"
      );
   }

   return user;
};

const deactivateUser = async (id) => {
   const user = await User.findById(id);
   if (!user) throw { statusCode: 404, message: "User not found" };

   user.isActive = !user.isActive; // Toggle status
   await user.save();

   const userObj = user.toObject();
   delete userObj.password;
   return userObj;
};

const resetPassword = async (id) => {
   const user = await User.findById(id);
   if (!user) throw { statusCode: 404, message: "User not found" };

   const tempPassword = Math.random().toString(36).slice(-8);
   user.password = bcrypt.hashSync(tempPassword);
   user.mustChangePassword = false;
   await user.save();


   return { message: "Password reset successful", tempPassword };
};

const changePassword = async (userId, currentPassword, newPassword) => {
   const user = await User.findById(userId);
   if (!user) throw { statusCode: 404, message: "User not found" };

   const isMatch = await bcrypt.compare(currentPassword, user.password);
   if (!isMatch) throw { statusCode: 400, message: "Incorrect current password" };

   user.password = bcrypt.hashSync(newPassword);
   user.mustChangePassword = false;
   await user.save();

   // Create Notification
   if (user.role.includes('MEMBER')) {
      await notificationService.createNotification(
         userId,
         "Password Changed",
         "Your account password has been changed successfully.",
         "profile"
      );
   }

   return { message: "Password updated successfully" };
};

const resendCredentials = async (id) => {
   const user = await User.findById(id);
   if (!user) throw { statusCode: 404, message: "User not found" };

   // Generate a new temporary password for the resend
   const tempPassword = Math.random().toString(36).slice(-8);
   user.password = bcrypt.hashSync(tempPassword);

   // Ensure they still don't have to change it immediately
   user.mustChangePassword = false;
   await user.save();

   console.log(`🔄 Resending credentials for ${user.email}...`);
   sendEnrollmentEmail(user.email, user.name, tempPassword);

   return { message: "Credentials resent successfully", tempPassword };
};

export default {
   createUser,
   getUsers,
   getUserById,
   updateUser,
   deactivateUser,
   resetPassword,
   changePassword,
   resendCredentials
};