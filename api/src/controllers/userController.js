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

    try {
        const data = await userService.updateUser(id, req.body);

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
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;
        const data = await userService.changePassword(userId, currentPassword, newPassword);
        res.status(200).send(data);
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
    createUser, getUsers, getUserById, updateUser, deleteUser, deactivateUser, resetPassword, changePassword, resendCredentials
}
