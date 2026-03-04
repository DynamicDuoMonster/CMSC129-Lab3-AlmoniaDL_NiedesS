const User = require('../models/userModel')
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const signupUser = async (req, res) => {
    const { username, email, password} = req.body

    try{
        const usernameExists = await User.findOne({ username })
        if (usernameExists) return res.status(400).json({ error: 'Username already exists' })
        
        const emailExists = await User.findOne({ email })
        if (emailExists) return res.status(400).json({ error: 'Email already exists' })

        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        const user = await User.create({
            username,
            email,
            password: hashedPassword,
            role: 'customer'
        })

        const token = jwt.sign({_id: user._id}, process.env.SECRET, { expiresIn: '3d'})

        res.status(200).json({ 
            username: user.username, 
            email: user.email, 
            token, 
            role: user.role 
        })
        
    } catch (error) {
        res.status(400).json({ error: error.message })
    }

}
const loginUser = async (req, res) => {
    const { email, password } = req.body

    try {
        // check if user exists
        const user = await User.findOne({ email })
        if (!user) return res.status(400).json({ error: 'Incorrect email' })

        // check if password matches
        const match = await bcrypt.compare(password, user.password)
        if (!match) return res.status(400).json({ error: 'Incorrect password' })

        // create token
        const token = jwt.sign({ _id: user._id }, process.env.SECRET, { expiresIn: '3d' })

        res.status(200).json({ 
            username: user.username, 
            email, 
            token, 
            role: user.role  // returns role so frontend knows if admin or customer
        })

    } catch (error) {
        res.status(400).json({ error: error.message })
    }
}

module.exports = {signupUser, loginUser}