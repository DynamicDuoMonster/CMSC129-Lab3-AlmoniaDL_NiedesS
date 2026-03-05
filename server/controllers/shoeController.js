const Shoe = require('../models/shoeModel')
const mongoose = require('mongoose')
const multer = require('multer');

// get all shoes
const getShoes = async (req, res) => {
    const shoes = await Shoe.find({ isDeleted: false }).sort({createdAt: -1})  // ← updated
    res.status(200).json(shoes)
}

// get single shoe by name
const getShoeByName = async (req, res) => {
    const { name } = req.query;
    if (!name) return res.status(200).json([]);

    try {
        const shoes = await Shoe.find({
            isDeleted: false,   // ← updated
            shoe_name: { 
                $regex: name,
                $options: 'i'
            }
        })
        .limit(20) 
        .lean();

        res.status(200).json(shoes);
    } catch (error) {
        res.status(500).json({ error: "Search failed" });
    }
}

// get single shoe by id
const getShoeById = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ error: 'Invalid ID' });
    }

    try {
        const shoe = await Shoe.findById(id);
        if (!shoe) return res.status(404).json({ error: 'Shoe not found' });
        
        res.status(200).json(shoe);
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
}

// create new shoe
const addShoe = async (req, res) => {
    const { shoe_name, brand, color, price, category, gender } = req.body
    
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

// SOFT DELETE - marks as deleted, recoverable
const softDeleteShoe = async (req, res) => {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ error: 'No such shoe' })
    }

    try {
        const shoe = await Shoe.findByIdAndUpdate(
            id,
            { isDeleted: true, deletedAt: new Date() },
            { new: true }
        )

        if (!shoe) return res.status(404).json({ error: 'No such shoe' })

        res.status(200).json({ message: 'Shoe moved to trash', shoe })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

// HARD DELETE - permanently removes it
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

        res.status(200).json({ message: 'Shoe permanently deleted', shoe })
    } catch (error) {
        console.error('Delete error:', error)
        res.status(500).json({error: error.message})
    }
}

// RESTORE - undo a soft delete
const restoreShoe = async (req, res) => {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ error: 'No such shoe' })
    }

    try {
        const shoe = await Shoe.findByIdAndUpdate(
            id,
            { isDeleted: false, deletedAt: null },
            { new: true }
        )

        if (!shoe) return res.status(404).json({ error: 'No such shoe' })

        res.status(200).json({ message: 'Shoe restored', shoe })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

// GET TRASH - all soft deleted shoes
const getTrashedShoes = async (req, res) => {
    try {
        const shoes = await Shoe.find({ isDeleted: true }).sort({ deletedAt: -1 })
        res.status(200).json(shoes)
    } catch (error) {
        res.status(500).json({ error: error.message })
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
        { new: true }
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
    getShoeById,
    softDeleteShoe,   // ← new
    deleteShoe,
    restoreShoe,      // ← new
    getTrashedShoes,  // ← new
    updateShoe
}