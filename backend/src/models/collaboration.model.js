import mongoose from "mongoose";

const collaborationSchema=new mongoose.Schema({
    familyMapOwnerId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    collaboratorId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    role:{
        //role of the collaborator whether he is a viewer or contributor
        type:String,
        enum:['viewer','contributor'],
        required:true
    },
    status:{
        //current status of the invitation
        type:String,
        enum:['pending','accepted','rejected','revoked','cancelled'],
        required:true,
        default:'pending'//by default let it be pending untill accepted by the collaborator
    }
},{timestamps:true});

//ensure a user can only be invited once to collaborate on a specific map
collaborationSchema.index({familyMapOwnerId:1,collaboratorId:1},{unique:true});


const Collaboration =mongoose.model("Collaboration",collaborationSchema);
export default Collaboration;