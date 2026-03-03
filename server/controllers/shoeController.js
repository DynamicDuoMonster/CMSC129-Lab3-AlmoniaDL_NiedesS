const Shoe = require('../models/shoeModel')
const mongoose = require('mongoose')

//shoe Image
const multer = require('multer');


// get all shoes
const getShoes = async (req, res) => {
    const shoes = await Shoe.find({}).sort({createdAt: -1})

    res.status(200).json(shoes)
}
// get single shoe
const getShoe = async (req, res) => {
    const { id } = req.params

    if(!mongoose.Types.ObjectId.isValid(id)){
        return res.status(404).json({error: 'No such shoe'})
    }

    const shoe = await Shoe.findById(id)

    if(!shoe) {
        return res.status(404).json({error: 'No such shoe'})
    }

    res.status(200).json(shoe)
}

// create new shoe
const addShoe = async (req, res) => {
    const { shoe_name, brand, color, price } = req.body
    
    // Cloudinary puts the full URL in req.file.path
    const imageUrl = req.file ? req.file.path : null 

    try {
        const shoe = await Shoe.create({ 
            shoe_name, 
            brand, 
            color, 
            price, 
            imageUrl 
        })
        res.status(200).json(shoe)
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
}

// delete shoe
const deleteShoe = async (req, res) => {
    const { id } = req.params

    if(!mongoose.Types.ObjectId.isValid(id)){
        return res.status(404).json({error: 'No such shoe'})
    }

    const shoe = await Shoe.findOneAndDelete({_id: id})

    if (!workout) {
        return res.status(400).json({error: 'No such workout'})
    } 

    res.status(200).json({shoe})
}

// update shoe
const updateShoe = async (req, res) => {
    const { id } = req.params

    if(!mongoose.Types.ObjectId.isValid(id)){
        return res.status(404).json({error: 'No such shoe'})
    }

    const shoe = await Shoe.findOneAndUpdate({_id: id}, {
        ...req.body 
    })

    if (!shoe) {
        return res.status(400).json({error: 'No such shoe'})
    }

    res.status(200).json({shoe})
}

module.exports = {
    addShoe, 
    getShoes, 
    getShoe,
    deleteShoe,
    updateShoe
}