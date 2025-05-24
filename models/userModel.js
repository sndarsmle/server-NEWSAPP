// models/userModel.js
import Sequelize from 'sequelize';
import sequelize from '../utils/dbConnect.js';

const User = sequelize.define('User', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
    },
    username: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true 
    },
    email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true 
    },
    password: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    profilePicture: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: process.env.DEFAULT_PROFILE_PICTURE_URL,
    },
    fullName: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    refreshToken: {
        type: Sequelize.TEXT,
        allowNull: true
    },
    role: {
        type: Sequelize.ENUM('reader', 'writer', 'admin'),
        allowNull: false,
        defaultValue: 'reader', 
    },
}, {
    timestamps: true,
    tableName: 'Users' 
});

export default User;