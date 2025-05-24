// middlewares/fileUpload.js
import multer from "multer";

const upload = multer({
    storage: multer.memoryStorage(), // <<< INI PERUBAHAN UTAMANYA: Menggunakan memoryStorage

    // Opsional tapi sangat direkomendasikan: Batasan ukuran file dan filter tipe file
    limits: {
        fileSize: 5 * 1024 * 1024, // Contoh: Batasan 5 MB (5 * 1024 * 1024 bytes)
    },
    fileFilter: (req, file, cb) => {
        // Hanya izinkan tipe file gambar tertentu
        const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true); // Terima file
        } else {
            // Tolak file jika tipe tidak diizinkan
            cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'), false);
        }
    }
});

export default upload;