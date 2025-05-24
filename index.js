// index.js
import dotenv from "dotenv";
dotenv.config(); // Memuat variabel lingkungan dari file .env

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path"; // Tetap diperlukan jika Anda menyajikan index.html
import { fileURLToPath } from "url"; // Tetap diperlukan jika Anda menyajikan index.html

// Import Routers
import userRouter from "./routes/userRoute.js";
import articleRouter from "./routes/articleRoute.js";
import commentRouter from "./routes/commentRoute.js";
import categoryRouter from "./routes/categoryRoute.js";

// Import Utilities
import association from "./utils/dbAssoc.js"; // Untuk sinkronisasi database

const app = express();
const PORT = process.env.PORT || 5000;

// Dapatkan __dirname yang setara di ES modules (tetap diperlukan jika Anda menyajikan index.html)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Konfigurasi CORS
const corsOptions = {
    origin: [
        "http://localhost:3000", // Contoh port frontend React/Vue
        "http://localhost:5500", // Contoh port Live Server
        "http://localhost:5000", // Jika backend dan frontend di port yang sama untuk dev
        process.env.CLIENT_URL, // URL frontend dari .env
    ].filter(Boolean), // Menghapus nilai undefined/null
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};

// Middleware
app.use(cors(corsOptions)); // Terapkan CORS
app.options("*", cors(corsOptions)); // Tangani preflight requests (OPTIONS)

app.use(express.json()); // Mengurai request body dalam format JSON
app.use(express.urlencoded({ extended: true })); // Mengurai request body dalam format URL-encoded (penting untuk form data non-file)
app.use(cookieParser()); // Mengurai cookie dari request header

// Default route (opsional, bisa dihapus jika backend murni API)
// Ini bisa jadi halaman HTML sederhana untuk mengecek server berjalan
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// Memasang Routers ke path API
app.use("/api/user", userRouter);
app.use("/api/articles", articleRouter);
app.use("/api/comments", commentRouter);
app.use("/api/categories", categoryRouter);

// Middleware Penanganan Error Global
// Penting untuk menangkap error yang tidak tertangani dan mencegah server crash
app.use((err, req, res, next) => {
    console.error(err.stack); // Log stack trace error untuk debugging
    res.status(500).json({
        status: "error",
        message: "Internal Server Error",
    });
});

// Handler 404 Not Found
// Penting untuk memberikan respons yang jelas jika endpoint tidak ditemukan
app.use((req, res) => {
    res.status(404).json({
        status: "error",
        message: "Endpoint not found",
    });
});

// Memulai Server Setelah Sinkronisasi Asosiasi Database
// Ini SANGAT PENTING agar database siap sebelum server menerima request
association()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`Client URL: ${process.env.CLIENT_URL || "http://localhost:5500"}`);
        });
    })
    .catch((err) => {
        console.error("DB Association Error:", err.message);
        process.exit(1); // Keluar dari aplikasi jika ada masalah asosiasi DB
    });