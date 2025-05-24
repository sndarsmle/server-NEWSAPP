// models/categoryModel.js
import Sequelize from 'sequelize';
import sequelize from '../utils/dbConnect.js';

const Category = sequelize.define('Category', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
    },
    name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true, 
    },
}, {
    timestamps: true, 
    tableName: 'Categories' 
});

export default Category;