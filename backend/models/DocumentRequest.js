const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
    email: { type: String, required: true, trim: true },
    phoneNumber: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    fullName: { type: String, required: true, trim: true },
    purpose: { type: String, required: true, trim: true },
    documentType: { type: String, required: true, trim: true },

    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },

    purokStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },

    purokApprovedBy: { type: String },
    purokApprovedAt: { type: Date },

    approvalDetails: {
        pickupDate: String,
        pickupTime: String,
        officeHours: String,
        instructions: String,
    },
    rejectionReason: { type: String, trim: true },
    createdAt: {
        type: Date,
        default: () => new Date(),
    },
});

module.exports = mongoose.model('DocumentSchema', DocumentSchema);