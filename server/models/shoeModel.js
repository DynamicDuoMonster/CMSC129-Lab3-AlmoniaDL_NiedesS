const mongoose = require('mongoose')
const Schema = mongoose.Schema

const shoeSchema = new Schema({
    shoe_name: { type: String, required: true, trim: true },
    brand: { type: String, required: true, index: true }, // Index for fast filtering by brand
    color: { type: [String], required: true },
    price: { type: Number, required: true, index: true }, // Index for price sorting/filtering
    imageUrl: { type: String, required: true },
    category: { type: String, index: true },
    gender: { type: String, index: true }
}, { timestamps: true }) // Adds createdAt/updatedAt automatically

// Create a compound text index for the search bar
shoeSchema.index({ 
    shoe_name: 'text', 
    brand: 'text', 
    category: 'text' 
}, {
    weights: { shoe_name: 10, brand: 5, category: 1 } // Priorities: name is most important
});

module.exports = mongoose.model('Shoe', shoeSchema)