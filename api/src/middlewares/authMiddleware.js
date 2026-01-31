import { verifyJWT } from "../utils/jwt.js";

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
