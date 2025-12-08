import mongoose from "mongoose";

const shareLinkSchema=new mongoose.Schema({
    uniqueShareId:{
        type:String,
        required:true,
        unique:true,
        minlength:6,//a reasonable length for a unique Id
        maxlength:20//keep it concise for urls
    },
    familyMapOwnerId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    accessLevel:{
        //example.,'read-only public'
        type:String,
        enum:['read-only-public'],
        required:true,
        default:'read-only-public'
    },
    
    expiryDate:{
        type:Date,
        default:null//null means no expiry
    },
    description:{
        type:String,
        trim:true
    }
    
    
},{timestamps:true});

const ShareLink=mongoose.model("ShareLink",shareLinkSchema);

export default ShareLink;