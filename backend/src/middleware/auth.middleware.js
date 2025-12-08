import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

export const protectRoute = async (req, res, next) => {
    console.log(`[ProtectRoute] START - Request: ${req.method} ${req.originalUrl}`);
    console.log(`[ProtectRoute] Current req.path: '${req.path}', Current req.query.shareId: '${req.query.shareId}'`);

    // --- CRITICAL BYPASS LOGIC FOR PUBLIC SHARE LINKS ---
    // This check MUST happen before any token validation.
    const isGetMethod = req.method === 'GET';
    // Check if originalUrl includes '/api/family/map' OR '/api/family/' (for specific member details)
    const isFamilyMapOrMemberPath = req.originalUrl.includes('/api/family/map') || req.originalUrl.includes('/api/family/');
    const hasShareId = typeof req.query.shareId === 'string' && req.query.shareId.length > 0;

    console.log(`[ProtectRoute] Evaluation - isGetMethod: ${isGetMethod}, isFamilyMapOrMemberPath: ${isFamilyMapOrMemberPath}, hasShareId: ${hasShareId}`);

    if (isGetMethod && isFamilyMapOrMemberPath && hasShareId) {
        console.log("[ProtectRoute] BYPASS TRIGGERED: Public share map/member request detected. Proceeding without authentication.");
        return next(); // Allow the request to proceed immediately
    }
    // --- END BYPASS LOGIC ---

    // If the bypass condition was NOT met, proceed with standard authentication checks.
    console.log("[ProtectRoute] Standard authentication flow initiated.");
    try {
        let token;

        // Check for token in cookies first
        if (req.cookies.jwt) {
            token = req.cookies.jwt;
            console.log("[ProtectRoute] Token found in cookies.");
        } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            // If not in cookies, check for token in Authorization header
            token = req.headers.authorization.split(' ')[1];
            console.log("[ProtectRoute] Token found in Authorization header.");
        }

        if (!token) {
            console.log("[ProtectRoute] No token provided (neither cookie nor header). Sending 401.");
            return res.status(401).json({ message: "Unauthorized - No Token Provided" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log(`[ProtectRoute] Token decoded: ${!!decoded}`);

        if (!decoded) {
            console.log("[ProtectRoute] Invalid Token. Sending 401.");
            return res.status(401).json({ message: "Unauthorized - Invalid Token" });
        }

        const user = await User.findById(decoded.userId).select("-password");
        console.log(`[ProtectRoute] User found in DB: ${!!user}`);

        if (!user) {
            console.log("[ProtectRoute] User not found in DB. Sending 404.");
            return res.status(404).json({ message: "User not found" });
        }

        req.user = user; // Attach the user object to the request
        console.log(`[ProtectRoute] User attached to req.user: ${req.user.username || req.user.email}`);
        next(); // Proceed to the next middleware or route handler

    } catch (error) {
        console.error("[ProtectRoute] Error in standard auth flow (catch block):", error.message);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: "Unauthorized - Invalid Token" });
        } else if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: "Unauthorized - Token Expired" });
        }
        res.status(500).json({ message: "Internal Server Error" });
    } finally {
        console.log("[ProtectRoute] END");
    }
};
