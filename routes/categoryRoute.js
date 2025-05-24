// routes/categoryRoute.js
import express from 'express';
const router = express.Router();
import verifyToken from '../middlewares/verifyToken.js';
import authorizeRoles from '../middlewares/authorizeRoles.js';

import {
    createCategory,
    getAllCategories,
    getCategoryById,
    updateCategory,
    deleteCategory
} from '../controllers/categoryController.js';

// GET ALL CATEGORIES (Public)
// Siapa saja bisa melihat daftar kategori.
router.get('/all', getAllCategories);

// GET CATEGORY BY ID (Public)
// Siapa saja bisa melihat detail kategori berdasarkan ID.
router.get('/categories/:id', getCategoryById);

// CREATE NEW CATEGORY (Hanya Admin)
// Membutuhkan autentikasi token dan peran 'admin'.
router.post('/new', verifyToken, authorizeRoles(['admin']), createCategory);

// UPDATE CATEGORY (Hanya Admin)
// Membutuhkan autentikasi token dan peran 'admin'.
router.put('/edit/:id', verifyToken, authorizeRoles(['admin']), updateCategory);

// DELETE CATEGORY (Hanya Admin)
// Membutuhkan autentikasi token dan peran 'admin'.
router.delete('/delete/:id', verifyToken, authorizeRoles(['admin']), deleteCategory);

export default router;