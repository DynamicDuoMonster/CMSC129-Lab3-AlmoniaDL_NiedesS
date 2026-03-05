const express = require('express')
const router = express.Router()
const { getCart, addToCart, removeFromCart, updateCartItem } = require('../controllers/cartController')
const { requireAuth } = require('../middleware/requireAuth')

// all cart routes require login
router.get('/', requireAuth, getCart)
router.post('/', requireAuth, addToCart)
router.patch('/:shoeId', requireAuth, updateCartItem)
router.delete('/:shoeId', requireAuth, removeFromCart)

module.exports = router