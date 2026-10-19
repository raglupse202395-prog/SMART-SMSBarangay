const mongoose = require('mongoose');

const broadcastTemplateSchema = new mongoose.Schema({
    title: { type: String, required: true, unique: true, trim: true },
    message: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('BroadcastTemplate', broadcastTemplateSchema);