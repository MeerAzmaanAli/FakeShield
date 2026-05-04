const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const connectDB = async () => {
    if (!process.env.MONGO_URI) {
        console.warn('MONGO_URI not set; skipping DB connection.');
        return;
    }

    try {
        if (mongoose.connection.readyState === 1) {
            console.log('MongoDB already connected');
            return;
        }
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connected');
    } catch (err) {
        console.error('MongoDB connection error:', err);
        // Avoid exiting the process in serverless environments; let the caller decide how to handle it.
        throw err;
    }
}

module.exports = connectDB;
