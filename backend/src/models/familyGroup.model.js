import mongoose from "mongoose";

const familyGroupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Group name is required'],
    trim: true,
    unique: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['owner', 'admin', 'member', 'viewer'],
      default: 'member'
    }
  }],
  invitations: [{
    email: { type: String, required: true },
    invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    token: { type: String }, // ✅ Removed `unique: true`
    expires: { type: Date },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected','declined'],
      default: 'pending'
    }
  }]
}, {
  timestamps: true
});

// ✅ Ensure creator is added as owner on creation
familyGroupSchema.pre('save', function (next) {
  if (this.isNew) {
    const alreadyAdded = this.members.some(m => m.user.equals(this.createdBy));
    if (!alreadyAdded) {
      this.members.push({ user: this.createdBy, role: 'owner' });
    }
  }
  next();
});

// ✅ Partial index to enforce uniqueness only when token is a string
familyGroupSchema.index(
  { 'invitations.token': 1 },
  {
    unique: true,
    partialFilterExpression: { 'invitations.token': { $type: 'string' } }
  }
);

const FamilyGroup = mongoose.model('FamilyGroup', familyGroupSchema);
export default FamilyGroup;
