import { verifyJWT } from "../utils/jwt.js";
import User from "../models/User.js";

// Middleware to require ACTIVE MEMBER role (blocks expired)
export const requireActiveMember = async (req, res, next) => {
    try {
        // 1. Run basic member check first
        await requireMember(req, res, async () => {
            // 2. Fetch fresh user data from DB (Token might be old)
            const user = await User.findById(req.user.id);

            if (!user) {
                return res.status(401).json({ message: "User not found" });
            }

            // 3. Check status field
            if (user.membershipStatus !== 'Active') {
                return res.status(403).json({
                    message: "Your membership is not active. Please renew to book sessions.",
                    code: "MEMBERSHIP_INACTIVE"
                });
            }

            // 4. Check date (double verification)
            if (user.membershipExpiryDate && new Date(user.membershipExpiryDate) < new Date()) {
                return res.status(403).json({
                    message: "Your membership has expired. Please renew to book sessions.",
                    code: "MEMBERSHIP_EXPIRED"
                });
            }

            // Attach fresh user to request if needed downstream
            req.user = { ...req.user, ...user.toObject() };
            next();
        });

    } catch (error) {
        console.error('Active Member authorization error:', error);
        return res.status(403).json({ message: "Access denied" });
    }
};

// Middleware to require authentication
export const requireAuth = async (req, res, next) => {
    try {
        // Try cookies first
        let token = req.cookies?.token;

        // If no cookie token, try authorization header
        if (!token) {
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                token = authHeader.substring(7);
            }
        }

        if (!token) {
            return res.status(401).json({ message: "Authentication required" });
        }

        const decoded = await verifyJWT(token);

        if (!decoded || !decoded.id) {
            return res.status(401).json({ message: "Invalid token" });
        }

        // Attach user info to request
        req.user = decoded;
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};

// Middleware for optional authentication (e.g., Guest or Member)
export const optionalAuth = async (req, res, next) => {
    try {
        let token = req.cookies?.token;
        if (!token) {
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                token = authHeader.substring(7);
            }
        }

        if (token) {
            const decoded = await verifyJWT(token);
            if (decoded && decoded.id) {
                req.user = decoded;
            }
        }
    } catch (error) {
        // Ignore error, proceed as guest
    }
    next();
};

// Middleware to require MEMBER role
export const requireMember = async (req, res, next) => {
    try {
        // First ensure user is authenticated
        if (!req.user) {
            return res.status(401).json({ message: "Authentication required" });
        }

        const { role } = req.user;

        if (!role) {
            return res.status(403).json({ message: "Access denied. Members only." });
        }

        let isMember = false;

        if (Array.isArray(role)) {
            isMember = role.includes('MEMBER');
        } else if (typeof role === 'string') {
            isMember = role === 'MEMBER';
        }

        if (!isMember) {
            return res.status(403).json({ message: "Access denied. Members only." });
        }

        next();
    } catch (error) {
        console.error('Member authorization error:', error);
        return res.status(403).json({ message: "Access denied" });
    }
};



// Middleware to require STAFF or ADMIN role
export const requireStaffOrAdmin = async (req, res, next) => {
    try {
        // First ensure user is authenticated
        if (!req.user) {
            return res.status(401).json({ message: "Authentication required" });
        }

        const { role } = req.user;

        if (!role) {
            return res.status(403).json({ message: "Access denied. Staff or Admin only." });
        }

        let hasAccess = false;

        if (Array.isArray(role)) {
            hasAccess = role.includes('STAFF') || role.includes('ADMIN');
        } else if (typeof role === 'string') {
            hasAccess = role === 'STAFF' || role === 'ADMIN';
        }

        if (!hasAccess) {
            return res.status(403).json({ message: "Access denied. Staff or Admin only." });
        }

        next();
    } catch (error) {
        console.error('Staff/Admin authorization error:', error);
        return res.status(403).json({ message: "Access denied" });
    }
};

// Middleware to require ADMIN role
export const requireAdmin = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Authentication required" });
        }

        const { role } = req.user;

        if (!role || (Array.isArray(role) ? !role.includes('ADMIN') : role !== 'ADMIN')) {
            return res.status(403).json({ message: "Access denied. Admin only." });
        }

        next();
    } catch (error) {
        console.error('Admin authorization error:', error);
        return res.status(403).json({ message: "Access denied" });
    }
};
