// routes/userRoute.js
import express from "express";
const router = express.Router();
import verifyToken from "../middlewares/verifyToken.js";
import authorizeRoles from "../middlewares/authorizeRoles.js";
import upload from "../middlewares/fileUpload.js";

import {
    postUser,
    loginHandler,
    logoutHandler,
    deleteUser,
    editUser,
    getUserById,
    getAllUsers,
    updateUserRole,
} from "../controllers/userController.js";

// REGISTER USER (Public)
// Siapa saja bisa mendaftar akun baru.
router.post("/register", postUser);

// USER LOGIN (Public)
// Siapa saja bisa login ke akun.
router.post("/login", loginHandler);

// USER LOGOUT (Authenticated)
// Pengguna yang sudah login bisa melakukan logout.
router.post("/logout", verifyToken, logoutHandler);

// GET USER BY ID (Authenticated)
// Pengguna yang sudah login bisa melihat detail profil pengguna lain.
router.get("/users/:id", verifyToken, getUserById);

// EDIT USER PROFILE (Authenticated - Hanya pemilik akun)
// Pengguna hanya bisa mengedit profilnya sendiri.
router.put("/edit/:id", verifyToken, authorizeRoles(['reader', 'writer', 'admin']), upload.single("profilePicture"), editUser);

// DELETE USER (Authenticated - Hanya pemilik akun atau Admin)
// Pengguna bisa menghapus akunnya sendiri, Admin bisa menghapus akun siapa saja.
router.delete("/delete/:id", verifyToken, authorizeRoles(['reader', 'writer', 'admin']), deleteUser);

// GET ALL USERS (Hanya Admin)
// Hanya Admin yang bisa melihat daftar semua pengguna.
router.get("/all", verifyToken, authorizeRoles(['admin']), getAllUsers);

// UPDATE USER ROLE (Hanya Admin) - NEW
// Hanya Admin yang bisa mengubah peran (role) pengguna lain.
router.put("/role/:id", verifyToken, authorizeRoles(['admin']), updateUserRole);

export default router;