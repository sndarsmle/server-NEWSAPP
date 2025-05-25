// utils/dbAssoc.js
// --- DEBUGGING: Hapus dotenv/config dari sini karena sudah ada di index.js ---
// import 'dotenv/config';
// --- AKHIR DEBUGGING ---

import sequelize from './dbConnect.js'; // Pastikan path ini benar

// Import Models Anda
import User from '../models/userModel.js';
import Article from '../models/articleModel.js';
import Comment from '../models/commentModel.js';
import Category from '../models/categoryModel.js';

// Relasi User - Article (1:N)
User.hasMany(Article, { foreignKey: 'userId', onDelete: 'CASCADE' });
Article.belongsTo(User, { foreignKey: 'userId' });

// Relasi User - Comment (1:N)
User.hasMany(Comment, { foreignKey: 'userId', onDelete: 'CASCADE' });
Comment.belongsTo(User, { foreignKey: 'userId' });

// Relasi Article - Comment (1:N)
Article.hasMany(Comment, { foreignKey: 'articleId', onDelete: 'CASCADE' });
Comment.belongsTo(Article, { foreignKey: 'articleId' });

// --- RELASI BARU: Article - Category (1:N) ---
Category.hasMany(Article, { foreignKey: 'categoryId', onDelete: 'RESTRICT' });
Article.belongsTo(Category, { foreignKey: 'categoryId' });


// Fungsi sinkronisasi
const association = async () => {
    try {
        // --- DEBUGGING: Tambahkan log untuk status koneksi sebelum sync ---
        console.log('DB_ASSOC_DEBUG: Memulai proses asosiasi database...');
        if (!sequelize) {
            console.error('DB_ASSOC_ERROR: Sequelize instance tidak ditemukan. Ada masalah di dbConnect.js?');
            throw new Error('Sequelize instance not initialized.');
        }
        await sequelize.authenticate(); // Coba koneksi ke database sebelum sync
        console.log('DB_ASSOC_DEBUG: Koneksi database berhasil diverifikasi.');

        await sequelize.sync({ force: false });
        console.log('DB_ASSOC_DEBUG: Database disinkronkan & asosiasi berhasil dibuat!');
    } catch (error) {
        console.error('DB_ASSOC_ERROR: Error asosiasi atau koneksi database:');
        console.error('DB_ASSOC_ERROR: Pesan:', error.message);
        console.error('DB_ASSOC_ERROR: Stack:', error.stack);
        process.exit(1); // Keluar dari aplikasi jika ada masalah asosiasi/DB
    }
};

export default association;