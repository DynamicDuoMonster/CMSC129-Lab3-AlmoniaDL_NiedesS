const mongoose = require("mongoose");

const primaryConn = mongoose.createConnection(process.env.MONGODB_URI);
const backupConn = mongoose.createConnection(process.env.MONGODB_URI_BACKUP);

const connectDB = async () => {
    console.log("Dual-Database Sync Engine Initialized");
};

module.exports = connectDB;
module.exports.primaryConn = primaryConn;
module.exports.backupConn = backupConn;