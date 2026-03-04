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
const getShoeByName = async (req, res) => {
    const { name } = req.query;
    if (!name) return res.status(200).json([]);

    try {
        const shoes = await Shoe.find({
            shoe_name: { 
                $regex: name,   // Look for this string...
                $options: 'i'   // ...and ignore case (A vs a)
            }
        })
        .limit(20) 
        .lean();

        res.status(200).json(shoes);
    } catch (error) {
        res.status(500).json({ error: "Search failed" });
    }
}

// create new shoe
const addShoe = async (req, res) => {
    const { shoe_name, brand, color, price, category, gender } = req.body
    
    // Cloudinary puts the full URL in req.file.path
    const imageUrls = req.files ? req.files.map(file => file.path) : [];

    let colorArray = color;
    if (typeof color === 'string') {
        colorArray = color.split(',').map(c => c.trim()).filter(c => c !== "");
    }

    try {
        const shoe = await Shoe.create({ 
            shoe_name, 
            brand, 
            color: colorArray, 
            price: Number(price), 
            imageUrl: imageUrls,
            category,
            gender
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

    try {
        const shoe = await Shoe.findOneAndDelete({_id: id})

        if (!shoe) {
            return res.status(400).json({error: 'No such shoe'})
        } 

        res.status(200).json({shoe})
    } catch (error) {
        console.error('Delete error:', error)  // 👈 this will show the real error in your backend terminal
        res.status(500).json({error: error.message})
    }
}

// update shoe
const updateShoe = async (req, res) => {
    const { id } = req.params

    if(!mongoose.Types.ObjectId.isValid(id)){
        return res.status(404).json({error: 'No such shoe'})
    }

    const shoe = await Shoe.findOneAndUpdate(
        {_id: id}, 
        {...req.body},
        { new: true }  // Return the updated document
    )

    if (!shoe) {
        return res.status(400).json({error: 'No such shoe'})
    }

    res.status(200).json(shoe)
}

module.exports = {
    addShoe, 
    getShoes, 
    getShoeByName,
    deleteShoe,
    updateShoe
}