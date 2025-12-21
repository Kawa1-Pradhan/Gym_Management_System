import User from "../models/User.js";
import bcrypt from "bcryptjs";

const login = async (data) => {
    const user = await User.findOne({email: data.email});

    if(!user){
        throw {statusCode:400, message: "User not found. "};
    }
    
    const isPasswordMatched = bcrypt.compareSync(data.password, user.password);

        if(!isPasswordMatched) throw {statusCode:400, message: "Invalid credentials. "};
    return user;
};

const register = async  (data ) => {
    const user = await User.findOne({email: data.email});

    if(user){
        throw {statusCode:400, message: "User already exist. "};
    }
    
    const hashedPassword = bcrypt.hashSync(data.password);

   const registeredUser =  await User.create({
    name: data.name,
    email: data.email,
    password: hashedPassword,
    phone: data.phone,
    membershipStatus: data.membershipStatus,
    membershipExpiryDate: data.membershipExpiryDate,
   });
    return {
        id: registeredUser._id,
        name: registeredUser.name,
        email: registeredUser.email,
        phone: registeredUser.phone,
        membershipStatus: registeredUser.membershipStatus,
        membershipExpiryDate: registeredUser.membershipExpiryDate,
        
    }
};

export default { register, login };