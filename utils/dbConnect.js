// utils/dbConnect.js
// --- DEBUGGING: Hapus dotenv.config() dari sini karena sudah ada di index.js ---
// import dotenv from 'dotenv';
// dotenv.config();
// --- AKHIR DEBUGGING ---

import { Sequelize } from "sequelize";

const db_username = process.env.DB_USERNAME;
const db_password = process.env.DB_PASSWORD;
const db_host = process.env.DB_HOST;
const db_name = process.env.DB_NAME;

// --- DEBUGGING: Tambahkan try...catch di sekitar inisialisasi Sequelize ---
let sequelize;
try {
    console.log('DB_CONNECT_DEBUG: Mencoba inisialisasi Sequelize...');
    console.log('DB_CONNECT_DEBUG: DB_HOST:', db_host);
    console.log('DB_CONNECT_DEBUG: DB_USERNAME:', db_username);
    console.log('DB_CONNECT_DEBUG: DB_NAME:', db_name);
    // HATI-HATI: Jangan log password di lingkungan Cloud Run atau produksi!
    // console.log('DB_CONNECT_DEBUG: DB_PASSWORD:', db_password);

    sequelize = new Sequelize(db_name, db_username, db_password, {
        host: db_host,
        dialect: 'mysql', // Pastikan MySQL server berjalan
        timezone: '+07:00',
        logging: console.log // Gunakan console.log untuk melihat query SQL di log (opsional, bisa false)
    });
    console.log('DB_CONNECT_DEBUG: Instance Sequelize berhasil dibuat.');
} catch (error) {
    console.error('DB_CONNECT_ERROR: Gagal membuat instance Sequelize atau konfigurasi salah!');
    console.error('DB_CONNECT_ERROR: Pesan:', error.message);
    console.error('DB_CONNECT_ERROR: Stack:', error.stack);
    // process.exit(1); // Jangan exit di sini, biarkan association() yang menangani
}
// --- AKHIR DEBUGGING ---

export default sequelize;