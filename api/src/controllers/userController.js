import userService from "../services/userService.js";

const createUser = async (req, res) => {
    try {
        const creatorRole = req.user.role[0]; // Assuming role is an array as per model
        const data = await userService.createUser(req.body, creatorRole);

        res.status(201).send(data);

    } catch (error) {
        res.status(error.statusCode || 500).json({ message: error.message || "Internal Server Error" });
    }

};

const getUsers = async (req, res) => {
    try {
        const data = await userService.getUsers();
        res.status(200).send(data);
    }
    catch (error) {
        res.status(error.statusCode || 500).json({ message: error.message || "Internal Server Error" });
    }
}

const getUserById = async (req, res) => {
    try {
        const id = req.params.id;
        const data = await userService.getUserById(id);
        res.status(200).send(data);
    } catch (error) {
        res.status(error.statusCode || 500).json({ message: error.message || "Internal Server Error" });
    }
}

const updateUser = async (req, res) => {
    const id = req.params.id;
    const requester = req.user;

    try {
        // Validation: Users can ONLY update their own profile
        if (requester.id !== id) {
            return res.status(403).json({ message: "You are not authorized to update this profile" });
        }

        const role = Array.isArray(requester.role) ? requester.role[0] : requester.role;
        const isMember = role === 'MEMBER';

        // Validation: Only Members can update their profile fields (phone)
        if (!isMember) {
            return res.status(403).json({ message: "Staff and Admin account details and passwords are managed by system administrators. You cannot modify these details." });
        }

        // Restrict fields for Members: Only phone is allowed
        const { phone } = req.body;
        if (!phone) {
            return res.status(400).json({ message: "Only phone number can be updated." });
        }

        const updateData = { phone };

        const data = await userService.updateUser(id, updateData);
        res.status(200).send(data);

    } catch (error) {
        res.status(error.statusCode || 500).json({ message: error.message || "Internal Server Error" });
    }
}

const deleteUser = async (req, res) => {
    const id = req.params.id;

    try {
        const data = await userService.deleteUser(id);

        res.send(`User deleted successfully with id: ${id}`);

    } catch (error) {
        res.status(error.statusCode || 500).json({ message: error.message || "Internal Server Error" });
    }
}

const deactivateUser = async (req, res) => {
    try {
        const data = await userService.deactivateUser(req.params.id);
        res.status(200).send(data);
    } catch (error) {
        res.status(error.statusCode || 500).json({ message: error.message || "Internal Server Error" });
    }
};

const resetPassword = async (req, res) => {
    try {
        const data = await userService.resetPassword(req.params.id);
        res.status(200).send(data);
    } catch (error) {
        res.status(error.statusCode || 500).json({ message: error.message || "Internal Server Error" });
    }
};

const changePassword = async (req, res) => {
    try {
        const requester = req.user;
        const role = Array.isArray(requester.role) ? requester.role[0] : requester.role;

        // Only Members can change their own password
        if (role !== 'MEMBER') {
            return res.status(403).json({ message: "Staff and Admin password changes are restricted. Please contact system administrator." });
        }

        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;
        const data = await userService.changePassword(userId, currentPassword, newPassword);
        res.status(200).send(data);
    } catch (error) {
        res.status(error.statusCode || 500).json({ message: error.message || "Internal Server Error" });
    }
};

const uploadAvatar = async (req, res) => {
    try {
        const requester = req.user;
        const role = Array.isArray(requester.role) ? requester.role[0] : requester.role;

        if (role !== 'MEMBER') {
            return res.status(403).json({ message: "Only Members can upload profile pictures." });
        }

        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const imageUrl = `/uploads/profiles/${req.file.filename}`;

        // Update user's profileImageUrls
        const data = await userService.updateUser(requester.id, { profileImageUrls: [imageUrl] });

        res.status(200).json({
            message: "Profile picture uploaded successfully",
            imageUrl,
            user: data
        });

    } catch (error) {
        res.status(error.statusCode || 500).json({ message: error.message || "Internal Server Error" });
    }
};
const resendCredentials = async (req, res) => {
    try {
        const { id } = req.params;
        const data = await userService.resendCredentials(id);
        res.status(200).json(data);
    } catch (error) {
        res.status(error.statusCode || 500).json({ message: error.message || "Internal Server Error" });
    }
};

export default {
    createUser, getUsers, getUserById, updateUser, deleteUser, deactivateUser, resetPassword, changePassword, resendCredentials, uploadAvatar
}
