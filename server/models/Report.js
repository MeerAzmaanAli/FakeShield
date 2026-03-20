const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    platform: { type: String, enum: ['instagram', 'facebook', 'twitter', 'other'] },
    profileURL: String,
    profileData: {
        followerCount: Number,
        followingCount: Number,
        postCount: Number,
        accountAgeDays: Number,
        hasProfilePic: Boolean,
        bioLength: Number,
        isVerified: Boolean
    },
    aiScore: Number,              // 0 to 100 (fake probability)
    aiVerdict: { type: String, enum: ['fake','probably fake','suspicious','probably real','real'] } ,
    status: { type: String, enum: ['pending', 'under_review', 'escalated', 'resolved', 'rejected'] },
    assignedOfficer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    blockchainTxHash: String,     // filled after agency action
    createdAt: Date,
    updatedAt: Date
});

const ReportSchema = mongoose.model("Report", reportSchema);
module.exports = ReportSchema;