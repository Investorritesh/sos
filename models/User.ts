import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a name'],
    },
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        unique: true,
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
    },
    phone: {
        type: String,
        required: [true, 'Please provide a phone number'],
    },
    bloodGroup: {
        type: String,
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'],
        default: 'Unknown',
    },
    medicalConditions: {
        type: String,
        default: '',
    },
    homeAddress: {
        type: String,
        default: '',
    },
    workAddress: {
        type: String,
        default: '',
    },
    profileImage: {
        type: String,
        default: '',
    },
    emergencyContacts: [
        {
            name: String,
            phone: String,
            relationship: String,
        },
    ],
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

export default mongoose.models.User || mongoose.model('User', UserSchema);
