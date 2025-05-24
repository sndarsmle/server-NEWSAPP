// controllers/commentController.js
import Comment from '../models/commentModel.js';
import Article from '../models/articleModel.js'; // Pastikan ini mengimpor Article
import User from '../models/userModel.js';
import Sequelize from 'sequelize'; // Diperlukan jika menggunakan operator Sequelize seperti Op.ne

// CREATE COMMENT
const createComment = async (req, res) => {
    try {
        const { articleId } = req.params; // ID artikel dari parameter URL
        const { content } = req.body;     // Konten komentar dari body request
        const userId = req.user.id;       // ID pengguna yang sedang login, dari middleware verifyToken

    
        if (!content) {
            return res.status(400).json({
                status: "error",
                message: "Comment content is required."
            });
        }

        const article = await Article.findByPk(articleId);
        if (!article) {
            return res.status(404).json({
                status: "error",
                message: "Article not found."
            });
        }

        // Buat komentar baru di database menggunakan model Comment
        const newComment = await Comment.create({
            userId,      // ID pengguna yang membuat komentar
            articleId,   // ID artikel tempat komentar dibuat
            content      // Konten komentar
        });

        // Ambil detail komentar yang baru dibuat, sekaligus dengan informasi dasar pengguna yang membuatnya.
        // Ini memastikan respons API menyertakan data relasi yang relevan.
        const commentWithUser = await Comment.findByPk(newComment.id, {
            include: [{
                model: User,
                attributes: ['id', 'username', 'profilePicture'] // Sertakan detail user
            }]
        });

        // Kirim respons sukses dengan status 201 (Created)
        res.status(201).json({
            status: "success",
            message: "Comment created successfully.",
            data: commentWithUser
        });

    } catch (error) {
        // Tangani kesalahan server atau database
        console.error("Error creating comment:", error);
        res.status(500).json({
            status: "error",
            message: error.message
        });
    }
};

// UPDATE COMMENT
// Memungkinkan: Pembaca, Penulis, Admin (Hanya untuk komentar mereka sendiri)
const editComment = async (req, res) => {
    try {
        const { id } = req.params;    // ID komentar yang akan diupdate
        const userId = req.user.id;   // ID pengguna yang sedang login
        const { content } = req.body; // Konten komentar yang baru

        // Validasi: Pastikan konten komentar tidak kosong
        if (!content) {
            return res.status(400).json({
                status: "error",
                message: "Content is required."
            });
        }

        // Cari komentar berdasarkan ID
        const comment = await Comment.findByPk(id);
        if (!comment) {
            return res.status(404).json({
                status: "error",
                message: "Comment not found."
            });
        }

        // Otorisasi: Cek apakah pengguna yang login adalah pemilik komentar
        if (comment.userId !== userId) {
            return res.status(403).json({
                status: "error",
                message: "Forbidden: You can only update your own comments."
            });
        }

        // Lakukan update konten komentar di database
        await comment.update({ content });

        // Ambil komentar yang sudah diupdate dengan detail pengguna
        const updatedComment = await Comment.findByPk(id, {
            include: [{
                model: User,
                attributes: ['id', 'username', 'profilePicture']
            }]
        });

        // Kirim respons sukses dengan status 200 (OK)
        res.status(200).json({
            status: "success",
            message: "Comment updated successfully.",
            data: updatedComment
        });

    } catch (error) {
        console.error("Error updating comment:", error);
        res.status(500).json({
            status: "error",
            message: error.message
        });
    }
};

// DELETE COMMENT
// Memungkinkan: Pembaca, Penulis (Hanya untuk komentar mereka sendiri); Admin (Bisa menghapus semua komentar)
const deleteComment = async (req, res) => {
    try {
        const { id } = req.params;       // ID komentar yang akan dihapus
        const userId = req.user.id;      // ID pengguna yang sedang login
        const userRole = req.user.role;  // Peran pengguna yang sedang login

        // Cari komentar yang akan dihapus
        const comment = await Comment.findByPk(id);
        if (!comment) {
            return res.status(404).json({
                status: "error",
                message: "Comment not found."
            });
        }

        // Otorisasi: Cek apakah pengguna yang login adalah pemilik komentar ATAU pengguna adalah Admin
        if (comment.userId !== userId && userRole !== 'admin') {
            return res.status(403).json({
                status: "error",
                message: "Forbidden: You can only delete your own comments or be an admin to delete other comments."
            });
        }

        // Hapus komentar dari database
        await comment.destroy();

        // Kirim respons sukses dengan status 200 (OK)
        res.status(200).json({
            status: "success",
            message: "Comment deleted successfully."
        });

    } catch (error) {
        console.error("Error deleting comment:", error);
        res.status(500).json({
            status: "error",
            message: error.message
        });
    }
};

// GET COMMENTS BY ARTICLE
// Memungkinkan: Semua Role (Public)
const getCommentsByArticle = async (req, res) => {
    try {
        const { articleId } = req.params; // Ambil ID artikel dari parameter URL

        // Cek apakah artikel yang dicari ada
        const article = await Article.findByPk(articleId);
        if (!article) {
            return res.status(404).json({
                status: "error",
                message: "Article not found."
            });
        }

        // Ambil semua komentar yang terkait dengan artikel tertentu, sertakan detail user pembuat komentar.
        const comments = await Comment.findAll({
            where: { articleId }, // Filter berdasarkan articleId
            include: [{
                model: User,
                attributes: ['id', 'username', 'profilePicture'] // Sertakan detail user
            }],
            order: [['createdAt', 'DESC']] // Urutkan komentar dari yang terbaru
        });

        // Kirim respons sukses dengan status 200 (OK)
        res.status(200).json({
            status: "success",
            results: comments.length, // Jumlah komentar yang ditemukan
            data: comments
        });

    } catch (error) {
        console.error("Error getting comments by article:", error);
        res.status(500).json({
            status: "error",
            message: error.message
        });
    }
};

// GET COMMENT BY ID
// Memungkinkan: Semua Role (Public)
const getCommentById = async (req, res) => {
    try {
        const { id } = req.params; // Ambil ID komentar dari parameter URL

        // Cari komentar berdasarkan ID, sertakan detail user pembuat dan artikel terkait.
        const comment = await Comment.findByPk(id, {
            include: [
                {
                    model: User,
                    attributes: ['id', 'username', 'profilePicture'] // Sertakan detail user
                },
                {
                    model: Article,
                    attributes: ['id', 'title'] // Sertakan detail artikel (hanya ID dan judul)
                }
            ]
        });

        if (!comment) {
            return res.status(404).json({
                status: "error",
                message: "Comment not found."
            });
        }

        // Kirim respons sukses dengan status 200 (OK)
        res.status(200).json({
            status: "success",
            data: comment
        });

    } catch (error) {
        console.error("Error getting comment by ID:", error);
        res.status(500).json({
            status: "error",
            message: error.message
        });
    }
};

export {
    createComment,
    editComment,
    deleteComment,
    getCommentsByArticle,
    getCommentById
};