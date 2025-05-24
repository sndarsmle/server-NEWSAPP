// utils/dbAssoc.js
import 'dotenv/config';
import sequelize from './dbConnect.js';

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
        await sequelize.sync({ force: false });
        console.log('Database synced & associations established');
    } catch (error) {
        console.error('Association error:', error.message);
        process.exit(1); 
    }
};

export default association;