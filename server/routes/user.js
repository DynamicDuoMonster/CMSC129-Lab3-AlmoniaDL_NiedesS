const express = require('express')
const router = express.Router()
const { signupUser, loginUser, forgotPassword, resetPassword } = require('../controllers/userController')

// public routes (no auth needed)
router.post('/signup', signupUser)
router.post('/login', loginUser)

// forgot password logic    
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;