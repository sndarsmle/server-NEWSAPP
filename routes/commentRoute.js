// routes/commentRoute.js
import express from 'express';
const router = express.Router();
import verifyToken from '../middlewares/verifyToken.js';
import authorizeRoles from '../middlewares/authorizeRoles.js'; // Import authorizeRoles

import {
    createComment,
    editComment,
    deleteComment,
    getCommentsByArticle, // Pastikan ini sesuai dengan nama fungsi di controller
    getCommentById
} from '../controllers/commentController.js';

// GET ALL COMMENTS BY ARTICLE (Public)
// Siapa saja bisa melihat semua komentar untuk artikel tertentu.
router.get('/article/:articleId', getCommentsByArticle);

// GET COMMENT BY ID (Public)
// Siapa saja bisa melihat detail komentar tunggal.
router.get('/comments/:id', getCommentById);

// CREATE NEW COMMENT (Pembaca, Penulis, Admin)
// Membutuhkan autentikasi token; semua peran bisa membuat komentar.
router.post('/new/:articleId', verifyToken, authorizeRoles(['reader', 'writer', 'admin']), createComment);

// UPDATE COMMENT (Pembaca, Penulis, Admin - hanya untuk komentar sendiri)
// Membutuhkan autentikasi token; semua peran bisa mengupdate komentar milik sendiri.
router.put('/edit/:id', verifyToken, authorizeRoles(['reader', 'writer', 'admin']), editComment);

// DELETE COMMENT (Pembaca, Penulis - hanya untuk komentar sendiri; Admin - bisa hapus semua)
// Membutuhkan autentikasi token; Pembaca/Penulis bisa menghapus komentar sendiri, Admin bisa menghapus semua.
router.delete('/delete/:id', verifyToken, authorizeRoles(['reader', 'writer', 'admin']), deleteComment);

export default router;