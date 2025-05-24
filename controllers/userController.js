// controllers/userController.js
import dotenv from "dotenv";
dotenv.config();
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Sequelize from "sequelize"; // Diperlukan untuk Sequelize.Op.or
import User from "../models/userModel.js";
import { uploadFileToGCS, deleteFileFromGCS } from "../utils/gcsService.js";
import { v4 as uuidv4 } from "uuid"; // Untuk membuat ID unik
// import cloudinary from "../utils/cloudinaryConfig.js";
// import fs from "fs";

// REGISTER NEW USER
// Memungkinkan: Public (Siapa saja bisa mendaftar)
const postUser = async (req, res) => {
    try {
        const { username, email, password, fullName } = req.body;

        // Cek apakah email atau username sudah ada di database
        const existingUser = await User.findOne({
            where: {
                [Sequelize.Op.or]: [{ email: email }, { username: username }],
            },
        });

        if (existingUser) {
            return res.status(400).json({
                status: "error",
                message: "Email or Username already exists",
            });
        }

        // Hash password untuk keamanan
        const hashedPassword = await bcrypt.hash(password, 10);

        // Buat user baru dengan role default 'reader' (sudah diatur di userModel.js)
        const newUser = await User.create({
            username,
            email,
            password: hashedPassword,
            fullName,
            profilePicture: process.env.DEFAULT_PROFILE_PICTURE_URL, // Menggunakan gambar default
            // role otomatis 'reader' dari definisi model
        });

        // Buat access token untuk user yang baru terdaftar
        const accessToken = jwt.sign(
            { id: newUser.id, role: newUser.role }, // Sertakan ID dan role di token
            process.env.ACCESS_SECRET_KEY,
            { expiresIn: "30m" } // Access token berumur pendek (contoh: 30 menit)
        );

        // Kirim respons sukses
        res.status(201).json({
            status: "success",
            message: "User registered successfully",
            data: {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email,
                fullName: newUser.fullName,
                profilePicture: newUser.profilePicture,
                role: newUser.role, // Kirim role user dalam respons
            },
            accessToken,
        });
    } catch (error) {
        console.error("Error during user registration:", error);
        res.status(500).json({
            status: "error",
            message: error.message,
        });
    }
};

// USER LOGIN
// Memungkinkan: Public (Siapa saja bisa login)
const loginHandler = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Cari user berdasarkan email
        const user = await User.findOne({
            where: { email },
        });

        if (!user) {
            return res.status(400).json({
                status: "Failed",
                message: "Email salah",
            });
        }

        // Bandingkan password yang dimasukkan dengan password yang di-hash di database
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({
                status: "Failed",
                message: "Password salah!",
            });
        }

        // Konversi objek user Sequelize ke objek JavaScript biasa untuk menghapus data sensitif
        const userPlain = user.toJSON();
        const { password: _, refreshToken: __, ...safeUserData } = userPlain; // Hapus password dan refresh token

        // Buat access token baru
        const accessToken = jwt.sign(
            { id: safeUserData.id, role: safeUserData.role }, // Sertakan ID dan role di access token
            process.env.ACCESS_SECRET_KEY,
            { expiresIn: "30m" }
        );

        // Buat refresh token (berumur lebih panjang)
        const refreshToken = jwt.sign(
            { id: safeUserData.id, role: safeUserData.role }, // Sertakan ID dan role di refresh token
            process.env.REFRESH_SECRET_KEY,
            { expiresIn: "1d" } // Refresh token berumur 1 hari
        );

        // Update refresh token di database
        await User.update({ refreshToken }, { where: { id: user.id } });

        // Set refresh token di cookie
        // Penting: Untuk produksi, set httpOnly: true dan secure: true
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true, // Mencegah akses oleh JavaScript di client-side
            sameSite: "None", // Penting untuk cross-site requests (frontend beda domain)
            secure: true, // Hanya kirim cookie melalui HTTPS
            maxAge: 24 * 60 * 60 * 1000, // 1 hari
        });

        // Kirim respons sukses dengan data user dan access token
        res.status(200).json({
            status: "success",
            message: "Login successful",
            user: safeUserData, // Data user tanpa password/refresh token
            accessToken,
        });
    } catch (error) {
        console.error("Error during user login:", error);
        res.status(500).json({
            status: "error",
            message: error.message,
        });
    }
};

// LOGOUT HANDLER
// Memungkinkan: Authenticated (Siapa saja yang login)
const logoutHandler = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) return res.sendStatus(204); // No content, jika tidak ada refresh token

        // Cari user yang memiliki refresh token ini
        const user = await User.findOne({
            where: { refreshToken },
        });

        // Jika user ditemukan, hapus refresh token dari database
        if (user) {
            await User.update(
                { refreshToken: null },
                { where: { id: user.id } }
            );
        }

        // Hapus refresh token dari cookie client
        res.clearCookie("refreshToken", {
            httpOnly: true,
            sameSite: "None",
            secure: true,
        });

        return res.status(200).json({
            status: "success",
            message: "Logout successful",
        });
    } catch (error) {
        console.error("Error during user logout:", error);
        res.status(500).json({
            status: "error",
            message: error.message,
        });
    }
};

// DELETE USER ACCOUNT
// Memungkinkan: Pemilik akun atau Admin
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const loggedInUserId = req.user.id;
        const loggedInUserRole = req.user.role;

        const userToDelete = await User.findByPk(id);
        if (!userToDelete) {
            return res.status(404).json({
                status: "error",
                message: "User not found",
            });
        }

        // Otorisasi: Hanya user pemilik akun atau admin yang bisa menghapus
        if (parseInt(id) !== loggedInUserId && loggedInUserRole !== 'admin') {
            return res.status(403).json({
                status: "error",
                message: "Forbidden: You can only delete your own account or be an admin to delete other accounts.",
            });
        }

        // Hapus gambar profil dari GCS jika ada dan bukan gambar default
        if (userToDelete.profilePicture && userToDelete.profilePicture !== process.env.DEFAULT_PROFILE_PICTURE_URL) {
            // <<< PERUBAHAN UTAMA DI SINI UNTUK HAPUS GAMBAR DARI GCS
            // Dapatkan nama blob/path dari URL GCS
            const gcsFilename = userToDelete.profilePicture.split(`https://storage.googleapis.com/${process.env.GCS_BUCKET_NAME}/`)[1];
            if (gcsFilename) { // Pastikan ada nama file untuk dihapus
                await deleteFileFromGCS(gcsFilename);
            }
        }

        // Hapus user dari database
        await User.destroy({ where: { id } });

        // Jika akun yang dihapus adalah akun yang sedang login, hapus juga cookie refresh token
        if (parseInt(id) === loggedInUserId) {
            res.clearCookie("refreshToken", {
                httpOnly: true,
                sameSite: "None",
                secure: true,
            });
        }

        res.status(200).json({
            status: "success",
            message: "Account deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({
            status: "error",
            message: error.message,
        });
    }
};

// EDIT USER ACCOUNT
// Memungkinkan: Pemilik akun
const editUser = async (req, res) => {
    try {
        const { id } = req.params;
        const loggedInUserId = req.user.id;

        // Otorisasi: Hanya user pemilik akun yang bisa mengedit
        if (parseInt(id) !== loggedInUserId) {
            return res.status(403).json({
                status: "error",
                message: "Forbidden: You can only edit your own account",
            });
        }

        const userToUpdate = await User.findByPk(id);
        if (!userToUpdate) {
            return res.status(404).json({
                status: "error",
                message: "User not found",
            });
        }

        const { username, email, fullName, password } = req.body;
        const file = req.file; // Ini adalah objek file dari multer (memoryStorage)

        let updatedFields = {};

        if (username !== undefined) updatedFields.username = username;
        if (email !== undefined) updatedFields.email = email;
        if (fullName !== undefined) updatedFields.fullName = fullName;

        // Jika password baru diberikan, hash dulu
        if (password) {
            updatedFields.password = await bcrypt.hash(password, 10);
        }

        // Handle update gambar profil
        if (file) {
            try {
                // <<< PERUBAHAN UTAMA DI SINI UNTUK UPDATE GAMBAR PROFIL DI GCS
                // Hapus gambar lama dari GCS jika ada dan bukan gambar default
                if (userToUpdate.profilePicture && userToUpdate.profilePicture !== process.env.DEFAULT_PROFILE_PICTURE_URL) {
                    const oldGcsFilename = userToUpdate.profilePicture.split(`https://storage.googleapis.com/${process.env.GCS_BUCKET_NAME}/`)[1];
                    if (oldGcsFilename) { // Pastikan ada nama file untuk dihapus
                        await deleteFileFromGCS(oldGcsFilename);
                    }
                }

                const fileExtension = file.originalname.split('.').pop();
                const uniqueFileName = `NewsApp/Profile_Pictures/${uuidv4()}.${fileExtension}`; // Nama file unik di GCS
                updatedFields.profilePicture = await uploadFileToGCS(file.buffer, uniqueFileName, file.mimetype); // <<< TAMBAH file.mimetype

                // fs.unlink(file.path, (err) => { ... }); // <<< DIHAPUS
                // console.error("❌ Failed to delete temp file:", err.message); // <<< DIHAPUS
                // console.log("✅ Temp file deleted successfully."); // <<< DIHAPUS

            } catch (uploadError) {
                console.error("GCS upload failed:", uploadError); // Sesuaikan pesan error
                return res.status(500).json({
                    status: "error",
                    message: "Failed to upload image to Google Cloud Storage", // Sesuaikan pesan error
                });
            }
        }

        // Lakukan update user di database
        await userToUpdate.update(updatedFields);

        // Ambil data user yang sudah diupdate untuk respons
        const updatedUser = await User.findByPk(id, {
            attributes: [
                "id",
                "username",
                "email",
                "fullName",
                "profilePicture",
                "role",
            ],
        });

        res.status(200).json({
            status: "success",
            message: "User updated successfully",
            data: updatedUser,
        });
    } catch (error) {
        console.error("Error editing user:", error);
        res.status(500).json({
            status: "error",
            message: error.message,
        });
    }
};

// GET USER BY ID
// Memungkinkan: Authenticated (Siapa saja yang login bisa melihat profil user lain)
const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByPk(id, {
            attributes: [
                "id",
                "username",
                "email",
                "fullName",
                "profilePicture",
                "createdAt",
                "role", // Sertakan role user
            ],
        });

        if (!user) {
            return res.status(404).json({
                status: "error",
                message: "User not found",
            });
        }

        res.status(200).json({
            status: "success",
            data: user,
        });
    } catch (error) {
        console.error("Error getting user by ID:", error);
        res.status(500).json({
            status: "error",
            message: error.message,
        });
    }
};

// GET ALL USERS
// Memungkinkan: Admin Only
const getAllUsers = async (req, res) => {
    try {
        // Otorisasi sudah ditangani oleh middleware authorizeRoles di router
        const users = await User.findAll({
            attributes: [
                "id",
                "username",
                "email",
                "fullName",
                "profilePicture",
                "role", // Sertakan role user
                "createdAt",
            ],
            order: [["id", "ASC"]], // Urutkan berdasarkan ID
        });

        res.status(200).json({
            status: "success",
            data: users,
        });
    } catch (error) {
        console.error("Error getting all users:", error);
        res.status(500).json({
            status: "error",
            message: error.message,
        });
    }
};

// UPDATE USER ROLE (Admin Only)
// Memungkinkan: Admin Only
const updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;       // ID user yang akan diubah perannya
        const { newRole } = req.body;    // Peran baru (reader, writer, admin)

        // Validasi newRole: Pastikan nilainya adalah salah satu dari yang diizinkan
        const validRoles = ['reader', 'writer', 'admin'];
        if (!newRole || !validRoles.includes(newRole)) {
            return res.status(400).json({
                status: "error",
                message: "Invalid newRole. Must be 'reader', 'writer', or 'admin'."
            });
        }

        const userToUpdate = await User.findByPk(id);
        if (!userToUpdate) {
            return res.status(404).json({
                status: "error",
                message: "User not found"
            });
        }

        // Pencegahan: Admin tidak bisa menurunkan peran dirinya sendiri menjadi non-admin
        if (userToUpdate.id === req.user.id && newRole !== 'admin') {
            return res.status(403).json({
                status: "error",
                message: "Forbidden: Admins cannot demote themselves to non-admin roles."
            });
        }

        // Lakukan update role di database
        await userToUpdate.update({ role: newRole });

        res.status(200).json({
            status: "success",
            message: `User role updated to ${newRole} successfully.`,
            data: {
                id: userToUpdate.id,
                username: userToUpdate.username,
                role: userToUpdate.role // Kirim role yang sudah diupdate
            }
        });

    } catch (error) {
        console.error("Error updating user role:", error);
        res.status(500).json({
            status: "error",
            message: error.message
        });
    }
};

export {
    postUser,
    loginHandler,
    logoutHandler,
    deleteUser,
    editUser,
    getUserById,
    getAllUsers,
    updateUserRole,
};