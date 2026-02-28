const jwt = require('jsonwebtoken')
const User = require('../models/userModel')

const requireAuth = async (req, res, next) => {
    const { authorization } = req.headers

    if (!authorization) return res.status(401).json({ error: 'Not authorized' })

    const token = authorization.split(' ')[1]  // Bearer <token>

    try {
        const { _id } = jwt.verify(token, process.env.SECRET)
        req.user = await User.findById(_id).select('-password')
        next()
    } catch (error) {
        res.status(401).json({ error: 'Not authorized' })
    }
}

const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access only' })
    }
    next()
}

module.exports = { requireAuth, requireAdmin }