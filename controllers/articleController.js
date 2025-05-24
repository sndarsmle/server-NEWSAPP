// controllers/articleController.js
import Article from '../models/articleModel.js';
import User from '../models/userModel.js';
import Comment from '../models/commentModel.js';
import Category from '../models/categoryModel.js';
import { uploadFileToGCS, deleteFileFromGCS } from '../utils/gcsService.js';
import { v4 as uuidv4 } from 'uuid';
// import cloudinary from '../utils/cloudinaryConfig.js';
// import fs from 'fs';


// CREATE ARTICLE (Hanya Penulis)
const createArticle = async (req, res) => {
    try {
        // Cek jika user yang membuat bukan 'writer'
        if (req.user.role !== 'writer') {
            return res.status(403).json({
                status: "error",
                message: "Forbidden: Only writers can create articles."
            });
        }

        const { title, content, categoryId } = req.body;
        const userId = req.user.id;
        const file = req.file; // Ini adalah objek file dari multer (memoryStorage)

        if (!title || !content || !categoryId) {
            return res.status(400).json({
                status: "error",
                message: "Title, content, and category ID are required."
            });
        }

        const category = await Category.findByPk(categoryId);
        if (!category) {
            return res.status(404).json({
                status: "error",
                message: "Category not found."
            });
        }

        let imageUrl = null;
        if (file) {
            // <<< PERUBAHAN UTAMA DI SINI UNTUK UPLOAD KE GCS
            const fileExtension = file.originalname.split('.').pop();
            const uniqueFileName = `NewsApp/Article_Images/${uuidv4()}.${fileExtension}`; // Path dan nama file unik di GCS

            // Mengunggah buffer file langsung ke GCS
            imageUrl = await uploadFileToGCS(file.buffer, uniqueFileName, file.mimetype); // <<< TAMBAH file.mimetype // Menggunakan buffer, bukan path

            // fs.unlink(file.path, (err) => { ... }); // <<< DIHAPUS karena pakai memoryStorage
        }

        const newArticle = await Article.create({
            userId,
            categoryId,
            title,
            content,
            imageUrl
        });

        const articleWithDetails = await Article.findByPk(newArticle.id, {
            include: [
                { model: User, attributes: ['id', 'username', 'profilePicture'] },
                { model: Category, attributes: ['id', 'name'] }
            ]
        });

        res.status(201).json({
            status: "success",
            message: "Article created successfully.",
            data: articleWithDetails
        });

    } catch (error) {
        console.error("Error creating article:", error);
        res.status(500).json({
            status: "error",
            message: error.message
        });
    }
};

// UPDATE ARTICLE (Hanya Penulis pemilik)
const updateArticle = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const { title, content, categoryId } = req.body;
        const file = req.file;

        const article = await Article.findByPk(id);
        if (!article) {
            return res.status(404).json({
                status: "error",
                message: "Article not found."
            });
        }

        // Cek otorisasi: hanya pemilik artikel
        if (article.userId !== userId) {
            return res.status(403).json({
                status: "error",
                message: "Forbidden: You can only update your own articles."
            });
        }

        if (categoryId !== undefined) {
            const category = await Category.findByPk(categoryId);
            if (!category) {
                return res.status(404).json({
                    status: "error",
                    message: "Category not found."
                });
            }
        }

        let updatedFields = {
            title: title !== undefined ? title : article.title,
            content: content !== undefined ? content : article.content,
            categoryId: categoryId !== undefined ? categoryId : article.categoryId
        };

        if (file) {
            // <<< PERUBAHAN UTAMA DI SINI UNTUK UPDATE GAMBAR DI GCS
            // Hapus gambar lama dari GCS jika ada dan bukan gambar default (optional: jika kamu ingin hapus default juga)
            if (article.imageUrl) {
                // Dapatkan nama blob/path dari URL GCS
                const oldGcsFilename = article.imageUrl.split(`https://storage.googleapis.com/${process.env.GCS_BUCKET_NAME}/`)[1];
                if (oldGcsFilename && oldGcsFilename !== process.env.DEFAULT_PROFILE_PICTURE_URL.split(`https://storage.googleapis.com/${process.env.GCS_BUCKET_NAME}/`)[1]) {
                    await deleteFileFromGCS(oldGcsFilename);
                }
            }

            const fileExtension = file.originalname.split('.').pop();
            const uniqueFileName = `NewsApp/Article_Images/${uuidv4()}.${fileExtension}`; // Nama file unik di GCS
            updatedFields.imageUrl = await uploadFileToGCS(file.buffer, uniqueFileName); // Mengunggah buffer file baru

            // fs.unlink(file.path, (err) => { ... }); // <<< DIHAPUS
        }

        await article.update(updatedFields);

        const updatedArticle = await Article.findByPk(id, {
            include: [
                { model: User, attributes: ['id', 'username', 'profilePicture'] },
                { model: Category, attributes: ['id', 'name'] }
            ]
        });

        res.status(200).json({
            status: "success",
            message: "Article updated successfully.",
            data: updatedArticle
        });

    } catch (error) {
        console.error("Error updating article:", error);
        res.status(500).json({
            status: "error",
            message: error.message
        });
    }
};

// DELETE ARTICLE (Hanya Penulis pemilik atau Admin)
// DELETE ARTICLE (Hanya Penulis pemilik atau Admin)
const deleteArticle = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role; // Ambil role user

        const article = await Article.findByPk(id);
        if (!article) {
            return res.status(404).json({
                status: "error",
                message: "Article not found."
            });
        }

        // Cek otorisasi: hanya pemilik artikel ATAU admin
        if (article.userId !== userId && userRole !== 'admin') {
            return res.status(403).json({
                status: "error",
                message: "You can only delete your own articles or be an admin."
            });
        }

        if (article.imageUrl) {
            // <<< PERUBAHAN UTAMA DI SINI UNTUK HAPUS GAMBAR DARI GCS
            // Dapatkan nama blob/path dari URL GCS
            const gcsFilename = article.imageUrl.split(`https://storage.googleapis.com/${process.env.GCS_BUCKET_NAME}/`)[1];
            if (gcsFilename) { // Pastikan ada nama file untuk dihapus
                await deleteFileFromGCS(gcsFilename);
            }
        }

        await article.destroy();

        res.status(200).json({
            status: "success",
            message: "Article deleted successfully."
        });

    } catch (error) {
        console.error("Error deleting article:", error);
        res.status(500).json({
            status: "error",
            message: error.message
        });
    }
};

// GET ALL ARTICLES (Public)
const getAllArticles = async (req, res) => {
    try {
        const articles = await Article.findAll({
            include: [
                { model: User, attributes: ['id', 'username', 'profilePicture'] },
                { model: Category, attributes: ['id', 'name'] }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({
            status: "success",
            results: articles.length,
            data: articles
        });

    } catch (error) {
        console.error("Error getting all articles:", error);
        res.status(500).json({
            status: "error",
            message: error.message
        });
    }
};

// GET ARTICLES BY USER (Public)
const getArticlesByUser = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({
                status: "error",
                message: "User not found."
            });
        }

        const articles = await Article.findAll({
            where: { userId },
            include: [
                { model: User, attributes: ['id', 'username', 'profilePicture'] },
                { model: Category, attributes: ['id', 'name'] }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({
            status: "success",
            results: articles.length,
            data: articles
        });

    } catch (error) {
        console.error("Error getting articles by user:", error);
        res.status(500).json({
            status: "error",
            message: error.message
        });
    }
};

// GET ARTICLE BY ID (Public)
const getArticleById = async (req, res) => {
    try {
        const { id } = req.params;

        const article = await Article.findByPk(id, {
            include: [
                { model: User, attributes: ['id', 'username', 'profilePicture'] },
                { model: Comment,
                    include: [{ model: User, attributes: ['id', 'username', 'profilePicture'] }],
                    order: [['createdAt', 'DESC']]
                },
                { model: Category, attributes: ['id', 'name'] }
            ]
        });

        if (!article) {
            return res.status(404).json({
                status: "error",
                message: "Article not found."
            });
        }

        res.status(200).json({
            status: "success",
            data: article
        });

    } catch (error) {
        console.error("Error getting article by ID:", error);
        res.status(500).json({
            status: "error",
            message: error.message
        });
    }
};

// GET ARTICLES BY CATEGORY (Public)
const getArticlesByCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;

        const category = await Category.findByPk(categoryId);
        if (!category) {
            return res.status(404).json({
                status: "error",
                message: "Category not found."
            });
        }

        const articles = await Article.findAll({
            where: { categoryId },
            include: [
                { model: User, attributes: ['id', 'username', 'profilePicture'] },
                { model: Category, attributes: ['id', 'name'] }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({
            status: "success",
            results: articles.length,
            data: articles
        });

    } catch (error) {
        console.error("Error getting articles by category:", error);
        res.status(500).json({
            status: "error",
            message: error.message
        });
    }
};


export {
    createArticle,
    updateArticle,
    deleteArticle,
    getAllArticles,
    getArticlesByUser,
    getArticleById,
    getArticlesByCategory
};