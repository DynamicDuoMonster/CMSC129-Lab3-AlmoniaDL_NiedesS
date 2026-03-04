const express = require('express')
const router = express.Router()
const multer = require('multer')
const cloudinary = require('cloudinary').v2
const { CloudinaryStorage } = require('multer-storage-cloudinary')
const { requireAuth, requireAdmin } = require('../middleware/requireAuth')

const {
    addShoe, 
    getShoes, 
    getShoeByName,
    deleteShoe,
    updateShoe
} = require('../controllers/shoeController')

// Cloudinary config
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

// Cloudinary storage
const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'shoe-locker',
        allowed_formats: ['jpg', 'png', 'webp']
    }
})

const upload = multer({ storage })

// get all shoes
router.get('/', getShoes)
router.get('/search', getShoeByName)
// router.get('/:id', getShoe)


// protected routes
router.post('/', requireAuth, requireAdmin, upload.single('image'), addShoe) 
router.delete('/:id', requireAuth, requireAdmin, deleteShoe)
router.patch('/:id', requireAuth, requireAdmin, updateShoe)

module.exports = router