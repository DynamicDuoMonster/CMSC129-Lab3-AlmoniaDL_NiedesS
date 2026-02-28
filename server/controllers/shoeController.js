const Shoe = require('../models/shoeModel')
const mongoose = require('mongoose')

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
    const {shoe_name, color, price} = req.body


    // add doc to db
    try{
        const shoe = await Shoe.create({shoe_name, color, price})
        res.status(200).json(shoe)
    } catch (error) {
        res.status(400).json({error: error.message})
    }
}

// delete shoe

// update shoe

module.exports = {
    addShoe, 
    getShoes, 
    getShoe
}