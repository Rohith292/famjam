
import mongoose from 'mongoose';

const imageSchema = new mongoose.Schema({
    public_id: {
        type: String,
        required: true,
        unique: true 
    },
    url: {
        type: String,
        required: true
    },
    filename: {
        type: String,
        trim: true,
        maxlength: [200, "Filename cannot be more than 200 characters."]
    },
    album: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Album', // Reference to the Album model
        required: true
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the User model who uploaded it
        required: true
    }
}, {
    timestamps: true 
});

const Image = mongoose.model('Image', imageSchema);

export default Image;