import mongoose from 'mongoose';

const SafetyReportSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false, // Allow anonymous reports
    },
    location: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
        address: { type: String, default: '' },
    },
    reportType: {
        type: String,
        enum: ['harassment', 'theft', 'assault', 'poor_lighting', 'unsafe_area', 'suspicious_activity', 'safe_zone'],
        required: true,
    },
    severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium',
    },
    description: {
        type: String,
        default: '',
    },
    mediaUrl: {
        type: String,
        default: '',
    },
    isAnonymous: {
        type: Boolean,
        default: false,
    },
    upvotes: {
        type: Number,
        default: 0,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days TTL
    },
});

// Index for geospatial queries
SafetyReportSchema.index({ 'location.lat': 1, 'location.lng': 1 });
SafetyReportSchema.index({ timestamp: -1 });

export default mongoose.models.SafetyReport || mongoose.model('SafetyReport', SafetyReportSchema);
