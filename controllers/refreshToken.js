// controllers/refreshToken.js
import dotenv from "dotenv";
dotenv.config(); // Pastikan dotenv dipanggil sekali
import User from "../models/userModel.js";
import jwt from "jsonwebtoken";

const refreshToken = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        // console.log({ refreshToken }); // Untuk debugging

        // Jika tidak ada refresh token di cookie, kirim status 401
        if (!refreshToken) return res.sendStatus(401);

        // Cari user berdasarkan refresh token di database
        const user = await User.findOne({
            where: { refreshToken }
        });
        // Jika refresh token tidak ditemukan di database, berarti tidak valid atau sudah dihapus
        if (!user) return res.sendStatus(403);

        // Verifikasi refresh token dengan secret key
        jwt.verify(refreshToken, process.env.REFRESH_SECRET_KEY, (err, decoded) => {
            // Jika token tidak valid (misal: kadaluwarsa atau dimanipulasi), kirim status 403
            if (err) return res.sendStatus(403);

            // Jika token valid, konversi user ke objek plain JavaScript untuk menghilangkan data sensitif
            const userPlain = user.toJSON();
            // Destructuring untuk mengecualikan 'password' dan 'refreshToken'
            const { password: _, refreshToken: __, ...safeUserData } = userPlain;

            // Buat access token baru dengan data user yang aman
            const accessToken = jwt.sign(
                { id: safeUserData.id, role: safeUserData.role }, // Pastikan role juga ada di access token
                process.env.ACCESS_SECRET_KEY,
                { expiresIn: '30m' } // Access token biasanya berumur pendek
            );

            // Kirim access token baru ke client
            res.json({ accessToken });
        });
    } catch (error) {
        console.error("Error refreshing token:", error);
        res.status(500).json({
            status: "error",
            message: "Internal server error during token refresh"
        });
    }
};

export default refreshToken;