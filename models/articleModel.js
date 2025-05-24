// models/articleModel.js
import Sequelize from 'sequelize';
import sequelize from '../utils/dbConnect.js';
import User from './userModel.js';
import Category from './categoryModel.js'; // Import model Category

const Article = sequelize.define('Article', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
    },
    userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'id',
        },
    },
    categoryId: { // Foreign Key ke Category
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
            model: Category,
            key: 'id',
        },
    },
    title: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    content: {
        type: Sequelize.TEXT,
        allowNull: false,
    },
    imageUrl: {
        type: Sequelize.STRING,
        allowNull: true,
    },
}, {
    timestamps: true,
    tableName: 'Articles'
});

export default Article;