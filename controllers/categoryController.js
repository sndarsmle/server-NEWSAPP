// controllers/categoryController.js
import Category from '../models/categoryModel.js';
import Article from '../models/articleModel.js'; // Untuk mengecek relasi saat menghapus kategori
import Sequelize from 'sequelize'; // Diperlukan untuk Sequelize.Op.ne

// CREATE CATEGORY (Hanya Admin)
const createCategory = async (req, res) => {
    try {
        // Otomatis dicek oleh authorizeRoles di router
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({
                status: "error",
                message: "Category name is required."
            });
        }

        // Cek apakah kategori sudah ada (case-insensitive)
        const existingCategory = await Category.findOne({
            where: { name: name.toLowerCase() }
        });
        if (existingCategory) {
            return res.status(409).json({ // 409 Conflict: resource already exists
                status: "error",
                message: "Category with this name already exists."
            });
        }

        const newCategory = await Category.create({ name: name.toLowerCase() });

        res.status(201).json({
            status: "success",
            message: "Category created successfully.",
            data: newCategory
        });

    } catch (error) {
        console.error("Error creating category:", error);
        res.status(500).json({
            status: "error",
            message: error.message
        });
    }
};

// GET ALL CATEGORIES (Public)
const getAllCategories = async (req, res) => {
    try {
        const categories = await Category.findAll({
            order: [['name', 'ASC']] // Urutkan berdasarkan nama kategori
        });

        res.status(200).json({
            status: "success",
            results: categories.length,
            data: categories
        });

    } catch (error) {
        console.error("Error fetching categories:", error);
        res.status(500).json({
            status: "error",
            message: error.message
        });
    }
};

// GET CATEGORY BY ID (Public)
const getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;

        const category = await Category.findByPk(id);

        if (!category) {
            return res.status(404).json({
                status: "error",
                message: "Category not found."
            });
        }

        res.status(200).json({
            status: "success",
            data: category
        });

    } catch (error) {
        console.error("Error fetching category by ID:", error);
        res.status(500).json({
            status: "error",
            message: error.message
        });
    }
};

// UPDATE CATEGORY (Hanya Admin)
const updateCategory = async (req, res) => {
    try {
        // Otomatis dicek oleh authorizeRoles di router
        const { id } = req.params;
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({
                status: "error",
                message: "Category name is required."
            });
        }

        const category = await Category.findByPk(id);
        if (!category) {
            return res.status(404).json({
                status: "error",
                message: "Category not found."
            });
        }

        // Cek apakah nama baru sudah ada untuk kategori lain (kecuali kategori itu sendiri)
        const existingCategory = await Category.findOne({
            where: {
                name: name.toLowerCase(),
                id: { [Sequelize.Op.ne]: id } // Sequelize.Op.ne berarti 'not equal'
            }
        });
        if (existingCategory) {
            return res.status(409).json({
                status: "error",
                message: "Category with this name already exists."
            });
        }

        await category.update({ name: name.toLowerCase() });

        res.status(200).json({
            status: "success",
            message: "Category updated successfully.",
            data: category
        });

    } catch (error) {
        console.error("Error updating category:", error);
        res.status(500).json({
            status: "error",
            message: error.message
        });
    }
};

// DELETE CATEGORY (Hanya Admin)
const deleteCategory = async (req, res) => {
    try {
        // Otomatis dicek oleh authorizeRoles di router
        const { id } = req.params;

        const category = await Category.findByPk(id);
        if (!category) {
            return res.status(404).json({
                status: "error",
                message: "Category not found."
            });
        }

        // Cek apakah ada artikel yang menggunakan kategori ini
        const articlesInCategory = await Article.count({ where: { categoryId: id } });
        if (articlesInCategory > 0) {
            return res.status(400).json({
                status: "error",
                message: "Cannot delete category: There are articles associated with this category. Please reassign or delete those articles first."
            });
        }

        await category.destroy();

        res.status(200).json({
            status: "success",
            message: "Category deleted successfully."
        });

    } catch (error) {
        console.error("Error deleting category:", error);
        res.status(500).json({
            status: "error",
            message: error.message
        });
    }
};

export {
    createCategory,
    getAllCategories,
    getCategoryById,
    updateCategory,
    deleteCategory
};