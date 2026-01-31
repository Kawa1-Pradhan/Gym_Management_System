import User from "../models/User.js";
import bcrypt from "bcryptjs";

const login = async (data) => {
    console.log('AuthService login: Looking for user with email:', data.email);
    const user = await User.findOne({ email: data.email });

    if (!user) {
        console.log('AuthService login: User not found for email:', data.email);
        throw { statusCode: 400, message: "User not found. " };
    }

    console.log('AuthService login: User found, comparing passwords');
    const isPasswordMatched = bcrypt.compareSync(data.password, user.password);

    if (!isPasswordMatched) {
        console.log('AuthService login: Password mismatch for user:', data.email);
        throw { statusCode: 400, message: "Invalid credentials. " };
    }

    console.log('AuthService login: Login successful for user:', data.email);
    // Return consistent user object with id and role
    return {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        membershipStatus: user.membershipStatus,
        membershipExpiryDate: user.membershipExpiryDate,
    };
};

const register = async (data) => {
    const user = await User.findOne({ email: data.email });

    if (user) {
        throw { statusCode: 400, message: "User already exist. " };
    }

    const hashedPassword = bcrypt.hashSync(data.password);

    const registeredUser = await User.create({
        name: data.name,
        email: data.email,
        password: hashedPassword,
        phone: data.phone,
        role: data.role ? [data.role] : ['MEMBER'],
        membershipStatus: data.membershipStatus,
        membershipExpiryDate: data.membershipExpiryDate,
    });
    return {
        id: registeredUser._id,
        name: registeredUser.name,
        email: registeredUser.email,
        phone: registeredUser.phone,
        role: registeredUser.role,
        membershipStatus: registeredUser.membershipStatus,
        membershipExpiryDate: registeredUser.membershipExpiryDate,

    }
};

export default { register, login };