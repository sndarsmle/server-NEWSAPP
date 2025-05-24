// middlewares/verifyToken.js
import dotenv from "dotenv";
dotenv.config();
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

const verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'] || req.headers['Authorization'];

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                status: "error",
                message: "Unauthorized: No token provided"
            });
        }

        const token = authHeader.split(' ')[1];

        const decoded = jwt.verify(token, process.env.ACCESS_SECRET_KEY);

        // Fetch user from DB, ensure 'role' is included
        const user = await User.findByPk(decoded.id, {
            attributes: ['id', 'username', 'email', 'profilePicture', 'role']
        });

        if (!user) {
            return res.status(401).json({
                status: "error",
                message: "Unauthorized: User no longer exists"
            });
        }

        // Attach user information to request object, including 'role'
        req.user = {
            id: user.id,
            username: user.username,
            email: user.email,
            profilePicture: user.profilePicture,
            role: user.role
        };

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                status: "error",
                message: "Unauthorized: Token expired"
            });
        } else if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                status: "error",
                message: "Unauthorized: Invalid token"
            });
        }

        console.error("Authentication error:", error);
        res.status(500).json({
            status: "error",
            message: "Internal server error during authentication"
        });
    }
};

export default verifyToken;