const { PrimaryUser, BackupUser } = require('../models/userModel');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const signupUser = async (req, res) => {
    const { username, email, password } = req.body;

    try {
        let usernameExists, emailExists;
        try {
            usernameExists = await PrimaryUser.findOne({ username });
            emailExists = await PrimaryUser.findOne({ email });
        } catch (dbError) {
            console.warn("⚠️ Signup Check: Primary down, checking Backup...");
            usernameExists = await BackupUser.findOne({ username });
            emailExists = await BackupUser.findOne({ email });
        }

        if (usernameExists) return res.status(400).json({ error: 'Username already exists' });
        if (emailExists) return res.status(400).json({ error: 'Email already exists' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const _id = new mongoose.Types.ObjectId();
        const userData = {
            _id,
            username,
            email,
            password: hashedPassword,
            role: 'customer'
        };

        const [user] = await Promise.all([
            PrimaryUser.create(userData),
            BackupUser.create(userData)
        ]);

        const token = jwt.sign({ _id: user._id }, process.env.SECRET, { expiresIn: '3d' });

        res.status(200).json({ 
            username: user.username, 
            email: user.email, 
            token, 
            role: user.role 
        });
        
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        let user;
        try {
            user = await PrimaryUser.findOne({ email });
        } catch (error) {
            console.warn("⚠️ Login: Primary Failed. Using Backup...");
            user = await BackupUser.findOne({ email });
        }

        if (!user) return res.status(400).json({ error: 'Incorrect email' });

        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(400).json({ error: 'Incorrect password' });

        const token = jwt.sign({ _id: user._id }, process.env.SECRET, { expiresIn: '3d' });

        res.status(200).json({ 
            username: user.username, 
            email, 
            token, 
            role: user.role 
        });

    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        const resetToken = crypto.randomBytes(32).toString('hex');

        // Update both DBs with the reset token
        const results = await Promise.all([
            PrimaryUser.findOneAndUpdate({ email }, { resetpasswordtoken: resetToken }),
            BackupUser.findOneAndUpdate({ email }, { resetpasswordtoken: resetToken })
        ]);

        if (!results[0] && !results[1]) {
            return res.status(404).json({ error: "User not found with that email" });
        }

        res.status(200).json({ 
            message: "Reset token generated and synced across databases", 
            resetToken 
        });

    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;

    try {
        let user;
        try {
            user = await PrimaryUser.findOne({ resetpasswordtoken: token });
        } catch (e) {
            console.warn("⚠️ Reset: Primary down, verifying token on Backup...");
            user = await BackupUser.findOne({ resetpasswordtoken: token });
        }

        if (!user) return res.status(400).json({ error: "Invalid or expired token" });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password and clear token in both databases
        await Promise.all([
            PrimaryUser.findByIdAndUpdate(user._id, { 
                password: hashedPassword, 
                resetpasswordtoken: null 
            }),
            BackupUser.findByIdAndUpdate(user._id, { 
                password: hashedPassword, 
                resetpasswordtoken: null 
            })
        ]);

        res.status(200).json({ message: "Password updated successfully in all clusters" });

    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

module.exports = { 
    signupUser, 
    loginUser, 
    forgotPassword, 
    resetPassword 
};