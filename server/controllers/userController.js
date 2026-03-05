const { PrimaryUser, BackupUser } = require('../models/userModel');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const signupUser = async (req, res) => {
    const { username, email, password } = req.body;

    try {
        // If Primary is down, we check Backup instead
        let usernameExists, emailExists;
        try {
            usernameExists = await PrimaryUser.findOne({ username });
            emailExists = await PrimaryUser.findOne({ email });
        } catch (dbError) {
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
            // Try Primary first
            user = await PrimaryUser.findOne({ email });
        } catch (error) {
            // Fallback to Backup
            console.warn("Login Primary Failed. Using Backup...");
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

module.exports = { signupUser, loginUser };