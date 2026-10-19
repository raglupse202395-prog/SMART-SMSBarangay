const mongoose = require('mongoose');

const HouseholdAuditSchema = new mongoose.Schema({
    householdId: { type: mongoose.Schema.Types.ObjectId, ref: 'Household', required: true },
    action: {
        type: String,
        enum: ['created', 'updated', 'member_added', 'member_removed', 'head_changed', 'deleted', 'deleted_with_residents'],
        required: true
    },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
    changes: { type: Object },
    previousData: { type: Object },
    newData: { type: Object },
    memberDetails: {
        memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resident' },
        memberName: { type: String },
        actionType: { type: String }
    },
    timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('HouseholdAudit', HouseholdAuditSchema);