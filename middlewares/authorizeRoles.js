
const authorizeRoles = (allowedRoles) => {
    return (req, res, next) => {
        // Pastikan req.user dan req.user.role ada.
        // Middleware `verifyToken` harus dijalankan sebelum ini untuk mengisi `req.user`.
        if (!req.user || !req.user.role) {
            return res.status(401).json({
                status: "error",
                message: "Unauthorized: User role not found."
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                status: "error",
                message: "Forbidden: You do not have the necessary permissions to access this resource."
            });
        }

        next();
    };
};

export default authorizeRoles;