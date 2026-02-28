const express = require('express')
const router = express.Router()
const multer = require('multer')       
const path = require('path')   

const {
    addShoe, 
    getShoes, 
    getShoe,
    deleteShoe,
    updateShoe
} = require('../controllers/shoeController')

// Multer config
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/shoes/'),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname)
        cb(null, `shoe-${Date.now()}${ext}`)
    }
})
const upload = multer({ storage })

// get all shoes
router.get('/', getShoes)

router.get('/:id', getShoe)

router.post('/', upload.single('image'), addShoe)  // ← just one post route

router.delete('/:id', deleteShoe)

router.patch('/:id', updateShoe)

module.exports = router