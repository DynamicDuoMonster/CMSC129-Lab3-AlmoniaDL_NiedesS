const Cart = require('../models/cartModel')

// GET cart for logged in user
const getCart = async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user._id }).populate('items.shoe')
        if (!cart) return res.status(200).json({ items: [] })
        res.status(200).json(cart)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
}

// ADD item to cart
const addToCart = async (req, res) => {
    const { shoeId } = req.body
    try {
        let cart = await Cart.findOne({ user: req.user._id })

        if (!cart) {
            // create new cart if user has none
            cart = await Cart.create({ user: req.user._id, items: [{ shoe: shoeId }] })
        } else {
            const existingItem = cart.items.find(item => item.shoe.toString() === shoeId)
            if (existingItem) {
                existingItem.quantity += 1   // 👈 increment if already in cart
            } else {
                cart.items.push({ shoe: shoeId })  // 👈 add new item
            }
            await cart.save()
        }

        const populated = await cart.populate('items.shoe')
        res.status(200).json(populated)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
}

// REMOVE item from cart
const removeFromCart = async (req, res) => {
    const { shoeId } = req.params
    try {
        const cart = await Cart.findOne({ user: req.user._id })
        if (!cart) return res.status(404).json({ error: 'Cart not found' })

        cart.items = cart.items.filter(item => item.shoe.toString() !== shoeId)
        await cart.save()

        const populated = await cart.populate('items.shoe')
        res.status(200).json(populated)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
}

module.exports = { getCart, addToCart, removeFromCart }