const { PrimaryShoe, BackupShoe } = require('../models/shoeModel');
const mongoose = require('mongoose');

const dualWrite = async (operation, data, id = null) => {
    if (operation === 'create') {
        return await Promise.all([
            PrimaryShoe.create(data),
            BackupShoe.create(data)
        ]);
    }
    if (operation === 'update') {
        return await Promise.all([
            PrimaryShoe.findByIdAndUpdate(id, data, { new: true }),
            BackupShoe.findByIdAndUpdate(id, data, { new: true })
        ]);
    }
    if (operation === 'delete') {
        return await Promise.all([
            PrimaryShoe.findByIdAndDelete(id),
            BackupShoe.findByIdAndDelete(id)
        ]);
    }
};

const getShoes = async (req, res) => {
    try {
        const shoes = await PrimaryShoe.find({ isDeleted: false }).sort({ createdAt: -1 });
        res.status(200).json(shoes);
    } catch (error) {
        try {
            console.warn("⚠️ Atlas Down. Fetching from Azure...");
            const backupShoes = await BackupShoe.find({ isDeleted: false }).sort({ createdAt: -1 });
            res.status(200).json(backupShoes);
        } catch (backupError) {
            res.status(500).json({ error: backupError.message });
        }
    }
};

const getShoeByName = async (req, res) => {
    const { q, name, category, gender } = req.query;

    let query = { isDeleted: false };

    if (q) query.$text = { $search: q };
    if (name) query.shoe_name = { $regex: name, $options: 'i' };
    if (category) query.category = category;
    if (gender) query.gender = gender;

    try {
        const shoes = await PrimaryShoe.find(query).limit(20).sort({ createdAt: -1 }).lean();
        res.status(200).json(shoes);
    } catch (error) {
        try {
            console.warn("⚠️ Sync Fallback: Fetching from Azure...");
            const backupShoes = await BackupShoe.find(query).limit(20).sort({ createdAt: -1 }).lean();
            res.status(200).json(backupShoes);
        } catch (backupError) {
            res.status(500).json({ error: "Search failed" });
        }
    }
};

const getShoeById = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ error: 'Invalid ID' });
    }

    try {
        const shoe = await PrimaryShoe.findById(id);
        if (!shoe) return res.status(404).json({ error: "Shoe not found" });
        res.status(200).json(shoe);
    } catch (error) {
        try {
            const backupShoe = await BackupShoe.findById(id);
            if (!backupShoe) return res.status(404).json({ error: "Shoe not found" });
            res.status(200).json(backupShoe);
        } catch (backupError) {
            res.status(500).json({ error: "Server error" });
        }
    }
};

const addShoe = async (req, res) => {
    try {
        const _id = new mongoose.Types.ObjectId();
        const imageUrl = req.files ? req.files.map(file => file.path) : [];

        let { color, price, ...rest } = req.body;
        if (typeof color === 'string') {
            color = color.split(',').map(c => c.trim()).filter(c => c !== '');
        }

        const shoeData = { ...rest, _id, color, price: Number(price), imageUrl };

        const [newShoe] = await dualWrite('create', shoeData);
        res.status(201).json(newShoe);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// SOFT DELETE - marks as deleted, recoverable
const softDeleteShoe = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ error: 'No such shoe' });
    }

    try {
        const updateData = { isDeleted: true, deletedAt: new Date() };
        const [shoe] = await dualWrite('update', updateData, id);

        if (!shoe) return res.status(404).json({ error: 'No such shoe' });

        res.status(200).json({ message: 'Shoe moved to trash', shoe });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// HARD DELETE - permanently removes from both clusters
const deleteShoe = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ error: 'No such shoe' });
    }

    try {
        await dualWrite('delete', null, id);
        res.status(200).json({ message: "Shoe permanently deleted from all clusters" });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// RESTORE - undo a soft delete across both clusters
const restoreShoe = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ error: 'No such shoe' });
    }

    try {
        const updateData = { isDeleted: false, deletedAt: null };
        const [shoe] = await dualWrite('update', updateData, id);

        if (!shoe) return res.status(404).json({ error: 'No such shoe' });

        res.status(200).json({ message: 'Shoe restored', shoe });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// GET TRASH - all soft deleted shoes
const getTrashedShoes = async (req, res) => {
    try {
        const shoes = await PrimaryShoe.find({ isDeleted: true }).sort({ deletedAt: -1 });
        res.status(200).json(shoes);
    } catch (error) {
        try {
            console.warn("⚠️ Atlas Down. Fetching trash from Azure...");
            const backupShoes = await BackupShoe.find({ isDeleted: true }).sort({ deletedAt: -1 });
            res.status(200).json(backupShoes);
        } catch (backupError) {
            res.status(500).json({ error: backupError.message });
        }
    }
};

const updateShoe = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ error: 'No such shoe' });
    }

    try {
        // Capture all incoming potential keys
        let { shoe_name, brand, price, color, category, gender, existingImages, imageUrl } = req.body;

        // --- FIX: Normalize the incoming images ---
        // We check for either 'existingImages' (from FormData) or 'imageUrl' (from JSON)
        const imagesToKeep = existingImages || imageUrl;
        
        let keptImages = [];
        if (typeof imagesToKeep === 'string') {
            try { keptImages = JSON.parse(imagesToKeep); } catch { keptImages = []; }
        } else if (Array.isArray(imagesToKeep)) {
            keptImages = imagesToKeep;
        }

        // Merge with new files
        const newImagePaths = req.files ? req.files.map(f => f.path) : [];
        const finalImageArray = [...keptImages, ...newImagePaths];

        const updateData = {
            shoe_name,
            brand,
            price: Number(price),
            color,
            category,
            gender,
            imageUrl: finalImageArray
        };

        const [updated] = await dualWrite('update', updateData, id);
        
        if (!updated) return res.status(404).json({ error: 'No such shoe' });
        res.status(200).json(updated);
        
    } catch (err) {
        console.error('Error updating shoe:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
module.exports = {
    addShoe,
    getShoes,
    getShoeByName,
    getShoeById,
    softDeleteShoe,
    deleteShoe,
    restoreShoe,
    getTrashedShoes,
    updateShoe
};