import mongoose from 'mongoose';

const IncidentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    incidentType: {
        type: String,
        enum: ['Harassment', 'Stalking', 'Physical Abuse', 'Theft', 'Medical Emergency', 'Other'],
        default: 'Other',
    },
    severity: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Critical'],
        default: 'Medium',
    },
    description: {
        type: String,
        required: true,
    },
    mediaUrl: {
        type: String, // URL to cloud storage (e.g. Cloudinary)
    },
    location: {
        lat: Number,
        lng: Number,
        address: String,
    },
    isAnonymous: {
        type: Boolean,
        default: false,
    },
    status: {
        type: String,
        enum: ['pending', 'reviewed', 'resolved'],
        default: 'pending',
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
});

export default mongoose.models.Incident || mongoose.model('Incident', IncidentSchema);
