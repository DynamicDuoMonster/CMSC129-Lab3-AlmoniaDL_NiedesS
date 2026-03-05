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
        const shoes = await PrimaryShoe.find({}).sort({ createdAt: -1 });
        res.status(200).json(shoes);
    } catch (error) {
        console.warn("Atlas Down. Fetching from Azure...");
        const backupShoes = await BackupShoe.find({}).sort({ createdAt: -1 });
        res.status(200).json(backupShoes);
    }
};

const getShoeByName = async (req, res) => {
    const { q, category, gender } = req.query;
    
    let query = {};

    if (q) query.$text = { $search: q };
    if (category) query.category = category;
    if (gender) query.gender = gender;

    try {
        // Try Primary (Atlas)
        const shoes = await PrimaryShoe.find(query).sort({ createdAt: -1 });
        res.status(200).json(shoes);
    } catch (error) {
        console.warn("Sync Fallback: Fetching from Azure...");
        // Fallback to Backup (Azure)
        const backupShoes = await BackupShoe.find(query).sort({ createdAt: -1 });
        res.status(200).json(backupShoes);
    }
};

const getShoeById = async (req, res) => {
    const { id } = req.params;
    try {
        const shoe = await PrimaryShoe.findById(id);
        if (!shoe) return res.status(404).json({ error: "Shoe not found" });
        res.status(200).json(shoe);
    } catch (error) {
        const backupShoe = await BackupShoe.findById(id);
        res.status(200).json(backupShoe);
    }
};

const addShoe = async (req, res) => {
    try {
        const _id = new mongoose.Types.ObjectId();
        const imageUrl = req.files ? req.files.map(file => file.path) : [];
        
        const shoeData = { ...req.body, _id, imageUrl };

        const [newShoe] = await dualWrite('create', shoeData);
        res.status(201).json(newShoe);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const deleteShoe = async (req, res) => {
    const { id } = req.params;
    try {
        await dualWrite('delete', null, id);
        res.status(200).json({ message: "Shoe deleted from all clusters" });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const updateShoe = async (req, res) => {
    const { id } = req.params;
    try {
        const [updated] = await dualWrite('update', req.body, id);
        res.status(200).json(updated);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

module.exports = {
    addShoe,
    getShoes,
    getShoeByName,
    getShoeById,
    deleteShoe,
    updateShoe
};