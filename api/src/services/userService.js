import User from "../models/User.js";

 const createUser = async (data) => await User.create(data);
 

 const getUsers = async () => {
    const users = await User.find();

    return users;
 }

 const getUserById = async (id) => {
    const user = await User.findById(id);

    return user;
 }

 const updateUser = async (id, data) => {
    const user = await User.findByIdAndUpdate(id, data, {new: true});

    return user;
 }

 const deleteUser = async (id) => {
    const user = await User.findByIdAndDelete(id);

    return user;
 }

 export default {createUser, getUsers, getUserById, updateUser, deleteUser};