// routes/articleRoute.js
import express from 'express';
const router = express.Router();
import verifyToken from '../middlewares/verifyToken.js';
import authorizeRoles from '../middlewares/authorizeRoles.js';
import upload from '../middlewares/fileUpload.js';

import {
    createArticle,
    updateArticle,
    deleteArticle,
    getAllArticles,
    getArticlesByUser,
    getArticleById,
    getArticlesByCategory // Import fungsi baru
} from '../controllers/articleController.js';

// GET ALL ARTICLES (Public)
// Siapa saja bisa melihat semua artikel.
router.get('/articles', getAllArticles); 

// GET ARTICLES BY USER ID (Public)
// Siapa saja bisa melihat artikel yang dibuat oleh pengguna tertentu.
router.get('/user/:userId', getArticlesByUser); 

// GET ARTICLE BY ID (Public)
// Siapa saja bisa melihat detail artikel tunggal.
router.get('/articles/:id', getArticleById); 

// GET ARTICLES BY CATEGORY (Public) - NEW
// Siapa saja bisa melihat artikel berdasarkan kategori.
router.get('/category/:categoryId', getArticlesByCategory);

// CREATE NEW ARTICLE (Hanya Penulis)
// Membutuhkan autentikasi token dan peran 'writer'.
router.post('/new', verifyToken, authorizeRoles(['writer']), upload.single('imageUrl'), createArticle);

// UPDATE ARTICLE (Hanya Penulis pemilik)
// Membutuhkan autentikasi token dan peran 'writer'.
router.put('/edit/:id', verifyToken, authorizeRoles(['writer']), upload.single('imageUrl'), updateArticle);

// DELETE ARTICLE (Hanya Penulis pemilik atau Admin)
// Membutuhkan autentikasi token dan peran 'writer' atau 'admin'.
router.delete('/delete/:id', verifyToken, authorizeRoles(['writer', 'admin']), deleteArticle);

export default router;