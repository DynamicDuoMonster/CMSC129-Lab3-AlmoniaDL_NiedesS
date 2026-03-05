const mongoose = require('mongoose')
const Schema = mongoose.Schema

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

module.exports = mongoose.model('Cart', cartSchema)