const jwt = require('jsonwebtoken');
const { PrimaryUser, BackupUser } = require('../models/userModel');

const requireAuth = async (req, res, next) => {
    const { authorization } = req.headers;

    if (!authorization) return res.status(401).json({ error: 'Not authorized' });

    const token = authorization.split(' ')[1];

    try {
        const { _id } = jwt.verify(token, process.env.SECRET);

        let user;
        try {
            // Try fetching user from Primary
            user = await PrimaryUser.findById(_id).select('-password');
        } catch (dbError) {
            console.warn("Middleware: Primary DB down, checking Backup...");
            // Fallback to Backup
            user = await BackupUser.findById(_id).select('-password');
        }

        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error("Auth Error:", error.message);
        res.status(401).json({ error: 'Not authorized' });
    }
};

const requireAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access only' });
    }
    next();
};

module.exports = { requireAuth, requireAdmin };