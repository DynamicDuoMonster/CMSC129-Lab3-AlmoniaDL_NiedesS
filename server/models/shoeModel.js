const mongoose = require('mongoose');
const db = require('../config/db');
const Schema = mongoose.Schema;

const shoeSchema = new Schema({
    shoe_name: { type: String, required: true, trim: true },
    brand: { type: String, required: true, index: true }, // Index for fast filtering by brand
    color: { type: [String], required: true },
    price: { type: Number, required: true, index: true }, // Index for price sorting/filtering
    imageUrl: { type: [String], required: true, default: [] },
    category: { type: String, index: true },
    gender: { type: String, index: true },
    isDeleted: { type: Boolean, default: false }, 
    deletedAt: { type: Date, default: null }
}, { timestamps: true }) // Adds createdAt/updatedAt automatically

shoeSchema.index({
    shoe_name: 'text',
    brand: 'text',
    category: 'text'
}, {
    weights: { shoe_name: 10, brand: 5, category: 1 }
});

const PrimaryShoe = db.primaryConn.model('Shoe', shoeSchema);
const BackupShoe = db.backupConn.model('Shoe', shoeSchema);

module.exports = { PrimaryShoe, BackupShoe };