const mongoose = require('mongoose')

const Schema = mongoose.Schema

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        minlength: 3,
        unique: true

    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true,
        enum: ['admin', 'customer'],
        default: 'customer'
    },
    resetpasswordtoken: String,

})

module.exports = mongoose.model('User', userSchema)