// index.js
import dotenv from "dotenv";
dotenv.config(); // Memuat variabel lingkungan dari file .env di awal (untuk pengembangan lokal)

// --- DEBUGGING: TAMBAHKAN LOG INI DI AWAL (HAPUS SETELAH BERHASIL DEPLOY) ---
console.log('--- Aplikasi Node.js Memulai di Cloud Run ---');
console.log('DEBUG_ENV: process.env.PORT:', process.env.PORT);
console.log('DEBUG_ENV: process.env.CLIENT_URL:', process.env.CLIENT_URL);
console.log('DEBUG_ENV: process.env.DB_USERNAME:', process.env.DB_USERNAME);
console.log('DEBUG_ENV: process.env.DB_HOST:', process.env.DB_HOST);
console.log('DEBUG_ENV: process.env.DB_NAME:', process.env.DB_NAME);
console.log('DEBUG_ENV: process.env.GCS_BUCKET_NAME:', process.env.GCS_BUCKET_NAME);
// HATI-HATI: JANGAN LOG PASSWORD DI LINGKUNGAN PRODUKSI!
// console.log('DEBUG_ENV: process.env.DB_PASSWORD:', process.env.DB_PASSWORD);
console.log('--- Debugging Variabel Lingkungan Selesai ---');
// --- AKHIR DEBUGGING LOGS ---


import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path"; // Diperlukan untuk menyajikan file statis seperti index.html
import { fileURLToPath } from "url"; // Diperlukan untuk mendapatkan __dirname di ES modules

// Import Routers
import userRouter from "./routes/userRoute.js";
import articleRouter from "./routes/articleRoute.js";
import commentRouter from "./routes/commentRoute.js";
import categoryRouter from "./routes/categoryRoute.js";

// Import Utility untuk Asosiasi Database
import association from "./utils/dbAssoc.js"; // Untuk sinkronisasi dan asosiasi database

const app = express();
const PORT = process.env.PORT || 5000;

// Dapatkan __dirname yang setara di ES modules
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

// --- Middleware Global ---
// Terapkan CORS untuk semua request
app.use(cors(corsOptions));
// Tangani preflight requests (OPTIONS) untuk CORS
app.options("*", cors(corsOptions));

// Mengurai request body dalam format JSON
app.use(express.json());
// Mengurai request body dalam format URL-encoded (penting untuk form data non-file)
app.use(express.urlencoded({ extended: true }));
// Mengurai cookie dari request header
app.use(cookieParser());

// --- Routes Aplikasi ---
// Default route: Menyajikan file HTML sederhana untuk mengecek server berjalan
// Fungsionalitas ini dipertahankan sesuai permintaan Anda
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// Memasang Routers ke path API yang spesifik
app.use("/api/user", userRouter);
app.use("/api/articles", articleRouter);
app.use("/api/comments", commentRouter);
app.use("/api/categories", categoryRouter);

// --- Penanganan Error ---
// Middleware Penanganan Error Global (harus diletakkan setelah semua router)
// Penting untuk menangkap error yang tidak tertangani dan mencegah server crash
app.use((err, req, res, next) => {
    console.error(err.stack); // Log stack trace error untuk debugging
    res.status(500).json({
        status: "error",
        message: "Internal Server Error",
    });
});

// Handler 404 Not Found (harus diletakkan paling akhir)
// Penting untuk memberikan respons yang jelas jika endpoint tidak ditemukan
app.use((req, res) => {
    res.status(404).json({
        status: "error",
        message: "Endpoint not found",
    });
});

// --- Inisialisasi Server ---
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