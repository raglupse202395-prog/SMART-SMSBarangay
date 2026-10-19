const mongoose = require('mongoose');

const AdminActionHistorySchema = new mongoose.Schema({
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
    adminUsername: { type: String, required: true },
    action: { type: String, required: true },
    target: { type: String },
    details: { type: Object },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AdminActionHistory', AdminActionHistorySchema);