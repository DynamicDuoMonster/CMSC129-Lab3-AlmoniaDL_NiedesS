const express = require('express')
const router = express.Router()
const { signupUser, loginUser } = require('../controllers/userController')

// public routes (no auth needed)
router.post('/signup', signupUser)
router.post('/login', loginUser)