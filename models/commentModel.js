// models/commentModel.js
import Sequelize from 'sequelize';
import sequelize from '../utils/dbConnect.js';
import User from './userModel.js';
import Article from './articleModel.js'; 

const Comment = sequelize.define('Comment', {
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
    articleId: { 
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
            model: Article, 
            key: 'id',
        },
    },
    content: {
        type: Sequelize.TEXT,
        allowNull: false,
    },
}, {
    timestamps: true,
    tableName: 'Comments' 
});

export default Comment;