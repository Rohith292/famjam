import mongoose from "mongoose";

const albumSchema=new mongoose.Schema({
    name:{
        type:String,
        required:[true,"Album name is required"],
        trim:true,
        maxlength:[100,"Album name cannot be more than 100 characters"],
    },
    description:{
        type:String,
        trim:true,
        maxlength:[500,"Album description cannot be more than 500 characters"],
        default:""
    },
    owner:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    // NEW FIELD: Array of ObjectIds referencing FamilyGroup documents
    // If an album is shared with a group, all members of that group can access it.
    sharedWithGroups: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FamilyGroup'
    }],
    // Optional: if you want individual collaborators outside of groups
    collaborators: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    isPrivate: {
        type: Boolean,
        default: true // Albums are private by default unless shared
    },
    coverImage: {
    type: String, // URL of the cover image
    default: "" // Or a default placeholder URL if you have one
},
},{
        timestamps:true
    });

// This prevents a single user from having two albums with the exact same name.
albumSchema.index({ name: 1, owner: 1 }, { unique: true });

const Album = mongoose.model('Album', albumSchema);

export default Album;