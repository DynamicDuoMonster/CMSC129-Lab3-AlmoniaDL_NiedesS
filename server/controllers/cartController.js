const { PrimaryCart, BackupCart } = require('../models/cartModel')

// GET cart for logged in user
const getCart = async (req, res) => {
    try {
        const cart = await PrimaryCart.findOne({ user: req.user._id }).populate('items.shoe')
        if (!cart) return res.status(200).json({ items: [] })
        res.status(200).json(cart)
    } catch (err) {
        try {
            console.warn('⚠️ Primary down. Fetching cart from backup...')
            const cart = await BackupCart.findOne({ user: req.user._id }).populate('items.shoe')
            if (!cart) return res.status(200).json({ items: [] })
            res.status(200).json(cart)
        } catch (backupErr) {
            res.status(500).json({ error: backupErr.message })
        }
    }
}

// ADD item to cart
const addToCart = async (req, res) => {
    const { shoeId } = req.body
    try {
        let cart = await PrimaryCart.findOne({ user: req.user._id })

        if (!cart) {
            const newCart = { user: req.user._id, items: [{ shoe: shoeId }] }
            await Promise.all([
                PrimaryCart.create(newCart),
                BackupCart.create(newCart)
            ])
            cart = await PrimaryCart.findOne({ user: req.user._id })
        } else {
            const existingItem = cart.items.find(item => item.shoe.toString() === shoeId)
            if (existingItem) {
                existingItem.quantity += 1
            } else {
                cart.items.push({ shoe: shoeId })
            }
            await Promise.all([
                cart.save(),
                BackupCart.findOneAndUpdate(
                    { user: req.user._id },
                    { items: cart.items },
                    { new: true, upsert: true }
                )
            ])
        }

        const populated = await cart.populate('items.shoe')
        res.status(200).json(populated)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
}

// UPDATE quantity of a cart item
const updateCartItem = async (req, res) => {
    const { shoeId } = req.params
    const { quantity } = req.body

    try {
        const cart = await PrimaryCart.findOne({ user: req.user._id })
        if (!cart) return res.status(404).json({ error: 'Cart not found' })

        const item = cart.items.find(i => i.shoe.toString() === shoeId)
        if (!item) return res.status(404).json({ error: 'Item not found in cart' })

        item.quantity = quantity

        await Promise.all([
            cart.save(),
            BackupCart.findOneAndUpdate(
                { user: req.user._id },
                { items: cart.items },
                { new: true, upsert: true }
            )
        ])

        const populated = await cart.populate('items.shoe')
        res.status(200).json(populated)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
}

// REMOVE single item from cart
const removeFromCart = async (req, res) => {
    const { shoeId } = req.params
    try {
        const cart = await PrimaryCart.findOne({ user: req.user._id })
        if (!cart) return res.status(404).json({ error: 'Cart not found' })

        cart.items = cart.items.filter(item => item.shoe.toString() !== shoeId)

        await Promise.all([
            cart.save(),
            BackupCart.findOneAndUpdate(
                { user: req.user._id },
                { items: cart.items },
                { new: true, upsert: true }
            )
        ])

        const populated = await cart.populate('items.shoe')
        res.status(200).json(populated)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
}

// CLEAR entire cart (checkout)
const clearCart = async (req, res) => {
    try {
        await Promise.all([
            PrimaryCart.findOneAndUpdate(
                { user: req.user._id },
                { items: [] },
                { new: true }
            ),
            BackupCart.findOneAndUpdate(
                { user: req.user._id },
                { items: [] },
                { new: true }
            )
        ])
        res.status(200).json({ message: 'Order placed and cart cleared' })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
}

module.exports = { getCart, addToCart, updateCartItem, removeFromCart, clearCart }