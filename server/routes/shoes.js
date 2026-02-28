const express = require('express')
const router = express.Router()
const {
    addShoe, getShoes, getShoe
} = require('../controllers/shoeController')

// get all shoes
router.get('/', getShoes)

router.get('/', (req, res) => {
    
})

router.get('/:id', getShoe)

router.post('/', addShoe) 

router.delete('/:id', (req, res) => {
    res.json({mssg: 'DELETE single shoe info'})
})

router.patch('/:id', (req, res) => {
    res.json({mssg: 'UPDATE single shoe info'})
})

module.exports = router