import mongoose from 'mongoose';

const SOSSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    location: {
        lat: Number,
        lng: Number,
        address: String,
    },
    triggerType: {
        type: String,
        enum: ['Manual', 'Timer', 'Voice', 'Shake'],
        default: 'Manual',
    },
    batteryLevel: {
        type: Number,
    },
    audioUrl: {
        type: String, // Auto-recorded audio during SOS
    },
    active: {
        type: Boolean,
        default: true,
    },
    startedAt: {
        type: Date,
        default: Date.now,
    },
    endedAt: {
        type: Date,
    },
});

export default mongoose.models.SOS || mongoose.model('SOS', SOSSchema);
