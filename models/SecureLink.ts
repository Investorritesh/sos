import mongoose from 'mongoose';

const SecureLinkSchema = new mongoose.Schema({
    token: { type: String, required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    active: { type: Boolean, default: true },
    burnAfterRead: { type: Boolean, default: false },
    expiresAt: { type: Date, required: true },
    viewedAt: { type: Date },
    createdAt: { type: Date, default: Date.now },
    location: {
        lat: Number,
        lng: Number,
        accuracy: Number,
    }
});

export const SecureLink = mongoose.models.SecureLink || mongoose.model('SecureLink', SecureLinkSchema);
