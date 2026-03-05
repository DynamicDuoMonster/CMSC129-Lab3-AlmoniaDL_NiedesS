const mongoose = require('mongoose');
const db = require('../config/db');
const Schema = mongoose.Schema;

const cartSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [
        {
            shoe: {
                type: Schema.Types.ObjectId,
                ref: 'Shoe',
                required: true
            },
            quantity: {
                type: Number,
                default: 1
            }
        }
    ]
}, { timestamps: true })

cartSchema.index({ user: 1 }, { unique: true })

const PrimaryCart = db.primaryConn.model('Cart', cartSchema);
const BackupCart = db.backupConn.model('Cart', cartSchema);

module.exports = { PrimaryCart, BackupCart };