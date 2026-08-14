const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    name: {
        type: String,
        trim: true,
        maxlength: [100, 'Name is too long'],
        default: ''
    },
    trusted_contact: {
        type: String,
        trim: true,
        maxlength: [100, 'Contact is too long'],
        default: ''
    },
    calming_phrase: {
        type: String,
        trim: true,
        maxlength: [250, 'Phrase is too long'],
        default: ''
    }
}, { timestamps: true });

// Prevent returning internal metadata when toJSON is called
profileSchema.set('toJSON', {
    transform: (doc, ret) => {
        delete ret._id;
        delete ret.__v;
        delete ret.createdAt;
        delete ret.updatedAt;
        return ret;
    }
});

module.exports = mongoose.model('Profile', profileSchema);
