const mongoose = require('mongoose');
const db = require('../config/db');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        minlength: 3,
        unique: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true,
        enum: ['admin', 'customer'],
        default: 'customer'
    },
    resetpasswordtoken: String,
}, { timestamps: true });

const PrimaryUser = db.primaryConn.model('User', userSchema);
const BackupUser = db.backupConn.model('User', userSchema);

module.exports = { PrimaryUser, BackupUser };