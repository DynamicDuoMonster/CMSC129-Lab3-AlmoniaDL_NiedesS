const mongoose = require('mongoose')

const Schema = mongoose.Schema

const shoeSchema = new Schema({
    shoe_name: {
        type: String,
        required: true
    },
    brand: {
        type: String,
        required: true
    },
    color: {
        type: [String],
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    imageUrl: {
        type: String,
        required: true
    },
    category: {
        type: String
    },
    gender: {
        type: String
    }
})

module.exports = mongoose.model('Shoe', shoeSchema)