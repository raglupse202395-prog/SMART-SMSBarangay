const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
    email: { type: String, trim: true, default: 'N/A' },
    phoneNumber: { type: String, trim: true, default: 'N/A' },
    address: { type: String, trim: true, default: 'N/A' },
    fullName: { type: String, trim: true, default: 'N/A' },
    purpose: { type: String, trim: true, default: 'N/A' },
    documentType: { type: String, trim: true, default: 'N/A' },
    
    // UPDATED STATUSES
    status: { 
        type: String, 
        enum: ['pending_purok', 'pending_barangay', 'approved', 'rejected'], 
        default: 'pending_purok' 
    },
    
    purokApprovedBy: { type: String }, 
    purokApprovedAt: { type: Date },   

    approvalDetails: {
        pickupDate: String,
        pickupTime: String,
        officeHours: String,
        instructions: String
    },
    rejectionReason: { type: String, trim: true },
    createdAt: {
        type: Date,
        default: () => {
            const now = new Date();
            const offset = 8 * 60;
            return new Date(now.getTime() + offset * 60 * 1000);
        },
    },
});

module.exports = mongoose.model('DocumentSchema', DocumentSchema);