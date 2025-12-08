import mongoose from "mongoose";
import User from "./user.model.js";

const familyMemberSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
        trim:true
    },
    relation:{
        type:String,//ex->father,mother
        required:true
    },
    photoURL:{
        type:String,
        default:''
    },
    cloudinaryPublicId:{
        type:String,
        default:''
    },
    associatedGroup: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FamilyGroup',
         // A family tree must belong to a group for unified access
    },
    parentId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'FamilyMember',//self reference
        default:null//for the root member(s)

    },
    createdBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    dateOfBirth:{
        type:Date,
        default:null
    },
    gender:{
        type:String,
        enum:['Male','Female','Other','Prefer not to say'],
        default:null
    },
    children: [{ // To easily query direct children of this person
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FamilyMember'
}],
    partners:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'FamilyMember'
    }],
    notes:{
        type:String,
        default:''
    },
},{
    timestamps:true
}
);

const FamilyMember=mongoose.model('FamilyMember',familyMemberSchema);

export default FamilyMember;