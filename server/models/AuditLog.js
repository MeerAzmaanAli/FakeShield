const mongoose = require('mongoose');
    
const auditLogSchema = new mongoose.Schema({
    reportId: { type: mongoose.Schema.Types.ObjectId, ref: 'Report' },
    action: String,
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    blockchainTxHash: String,
    timestamp: Date
});

const AuditLogSchema = mongoose.model("AuditLog", auditLogSchema);
module.exports = AuditLogSchema;