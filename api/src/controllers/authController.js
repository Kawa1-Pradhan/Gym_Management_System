
import authService from "../services/authServices.js";
import { createJWT } from "../utils/jwt.js";


const login = async (req, res) => {
    const input = req.body;
    console.log('Login attempt:', { email: input.email, hasPassword: !!input.password });
    try {
        if (!input) {
            console.log('Login failed: No input data');
            return res.status(400).send("Required data are missing");
        }
        if (!input.email) {
            console.log('Login failed: Email is required');
            return res.status(400).send("Email is required");
        }
        if (!input.password) {
            console.log('Login failed: Password is required');
            return res.status(400).send("Password is required");
        }
        const data = await authService.login(input);

        // Check if user is active
        if (data.isActive === false) {
            return res.status(403).send("Your account is deactivated. Please contact the administrator.");
        }

        // Create clean JWT payload with id and role
        const payload = {
            id: data.id,
            name: data.name,
            email: data.email,
            role: data.role,
            mustChangePassword: data.mustChangePassword
        };

        // generate token
        const token = createJWT(payload);

        res.cookie("token", token, {
            maxAge: 86400 * 1000,
            httpOnly: true,
            sameSite: 'lax'
        });


        res.json({ data, token }); // Sending both data and token
    } catch (error) {
        res.status(error.statusCode || 500).json({ message: error.message || "Internal Server Error" });
    }
};

const register = async (req, res) => {
    const input = req.body;

    if (!input.password) {
        return res.status(400).send("Password is required");
    }
    if (input.password.length < 8) {
        return res.status(400).send("Password must be at least 8 characters");
    }
    if (!input.confirmPassword) {
        return res.status(400).send("Confirm password is required");

    }

    if (input.password !== input.confirmPassword) {
        return res.status(400).send("Passwords do not match");
    }

    try {

        const data = await authService.register(input);

        // Create clean JWT payload with id and role
        const payload = {
            id: data.id,
            name: data.name,
            email: data.email,
            role: data.role
        };

        // generate token
        const token = createJWT(payload);


        res.cookie("token", token, {
            maxAge: 86400 * 1000,
            httpOnly: true,
            sameSite: 'lax'
        });

        res.status(201).send(data);
    } catch (error) {
        res.status(400).json({ message: error.message || "Bad Request" });
    }
};

const logout = async (req, res) => {
    try {
        res.clearCookie("token", {
            httpOnly: true,
            sameSite: 'lax'
        });
        res.json({ message: "Logged out successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error during logout" });
    }
};

export default { register, login, logout };


