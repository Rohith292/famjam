// backend/controllers/familyGroupController.js
import FamilyGroup from '../models/familyGroup.model.js';
import User from '../models/user.model.js';
import asyncHandler from 'express-async-handler';
import crypto from 'crypto';

// 🔑 Helper to always return populated family group
const populateFamilyGroup = async (groupId) => {
  return await FamilyGroup.findById(groupId)
    .populate("createdBy", "fullName email profilePic")
    .populate("members.user", "fullName email profilePic")
    .populate("invitations.invitedBy", "fullName email");
};

// @desc    Create a new family group
// @route   POST /api/family-groups
// @access  Private
const createFamilyGroup = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const createdBy = req.user._id;

  if (!name) {
    return res.status(400).json({ message: 'Group name is required' });
  }

  const familyGroupExists = await FamilyGroup.findOne({ name });
  if (familyGroupExists) {
    return res.status(400).json({ message: 'A group with this name already exists.' });
  }

  const familyGroup = new FamilyGroup({
    name,
    description,
    createdBy,
    members: [{ user: createdBy, role: 'owner' }]
  });

  const createdFamilyGroup = await familyGroup.save();

  req.user.familyGroups.push(createdFamilyGroup._id);
  await req.user.save();

  const populatedGroup = await populateFamilyGroup(createdFamilyGroup._id);
  res.status(201).json(populatedGroup);
});


// @desc    Get all family groups a user belongs to
// @route   GET /api/family-groups/my
// @access  Private
const getMyFamilyGroups = async (req, res) => {
  try {
    const myGroups = await FamilyGroup.find({
      $or: [
        { "members.user": req.user._id },
        { "invitations.email": req.user.email }
      ]
    })
      .populate("createdBy", "fullName email profilePic")
      .populate("members.user", "fullName email profilePic")
      .populate("invitations.invitedBy", "fullName email");

    res.json(myGroups);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch family groups." });
  }
};


// @desc    Get a specific family group by ID
// @route   GET /api/family-groups/:id
// @access  Private
const getFamilyGroupById = asyncHandler(async (req, res) => {
  const familyGroup = await populateFamilyGroup(req.params.id);

  if (!familyGroup) {
    return res.status(404).json({ message: 'Family group not found' });
  }

  const isMember = familyGroup.members.some(
    m => m.user._id.toString() === req.user._id.toString()
  );
  if (!isMember) {
    return res.status(403).json({ message: 'Not authorized to access this family group' });
  }

  res.json(familyGroup);
});


// @desc    Update a family group
// @route   PUT /api/family-groups/:id
// @access  Private (owner/admin)
const updateFamilyGroup = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const familyGroup = await FamilyGroup.findById(req.params.id);

  if (!familyGroup) {
    return res.status(404).json({ message: 'Family group not found' });
  }

  const member = familyGroup.members.find(m => m.user.toString() === req.user._id.toString());
  if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
    return res.status(403).json({ message: 'Only owner/admin can update this group' });
  }

  familyGroup.name = name || familyGroup.name;
  familyGroup.description = description !== undefined ? description : familyGroup.description;

  await familyGroup.save();
  const populatedGroup = await populateFamilyGroup(familyGroup._id);

  res.json(populatedGroup);
});


// @desc    Send invitation
// @route   POST /api/family-groups/:id/invite
// @access  Private (owner only)
const sendFamilyGroupInvitation = asyncHandler(async (req, res) => {
  const { email, role = 'member' } = req.body;
  const familyGroup = await FamilyGroup.findById(req.params.id);

  if (!familyGroup) {
    return res.status(404).json({ message: 'Family group not found' });
  }

  const sender = familyGroup.members.find(m => m.user.toString() === req.user._id.toString());
  if (!sender || sender.role !== 'owner') {
    return res.status(403).json({ message: 'Only the group owner can send invitations' });
  }

  const invitedUser = await User.findOne({ email });
  if (!invitedUser) {
    return res.status(404).json({ message: 'User with this email not found' });
  }

  const alreadyMember = familyGroup.members.some(m => m.user.toString() === invitedUser._id.toString());
  if (alreadyMember) {
    return res.status(400).json({ message: 'User is already a member of this group' });
  }

  const existingInvitation = familyGroup.invitations.find(inv => inv.email === email && inv.status === 'pending');
  if (existingInvitation) {
    return res.status(400).json({ message: 'An invitation has already been sent to this user.' });
  }

  const token = crypto.randomBytes(20).toString('hex');
  const expires = new Date(Date.now() + 3600000); // 1h

  familyGroup.invitations.push({
    email,
    invitedBy: req.user._id,
    token,
    expires,
    status: 'pending',
    role
  });

  await familyGroup.save();
  const populatedGroup = await populateFamilyGroup(familyGroup._id);

  res.json({ message: 'Invitation sent successfully', familyGroup: populatedGroup });
});


// @desc    Accept invitation
// @route   POST /api/family-groups/invite/accept
// @access  Private
const acceptFamilyGroupInvitation = asyncHandler(async (req, res) => {
  const { token } = req.body;
  const userId = req.user._id;

  const familyGroup = await FamilyGroup.findOne({
    'invitations.token': token,
    'invitations.status': 'pending',
    'invitations.expires': { $gt: new Date() }
  });

  if (!familyGroup) {
    return res.status(400).json({ message: 'Invalid, expired, or already accepted invitation token.' });
  }

  const invitation = familyGroup.invitations.find(inv => inv.token === token && inv.status === 'pending');
  if (!invitation) {
    return res.status(400).json({ message: 'Invalid, expired, or already accepted invitation token.' });
  }

  const acceptingUser = await User.findOne({ email: invitation.email });
  if (!acceptingUser || acceptingUser._id.toString() !== userId.toString()) {
    return res.status(403).json({ message: 'Not authorized to accept this invitation.' });
  }

  const alreadyMember = familyGroup.members.some(m => m.user.toString() === userId.toString());
  if (!alreadyMember) {
    familyGroup.members.push({ user: userId, role: invitation.role || 'member' });
  }

  invitation.status = 'accepted';
  invitation.token = undefined;
  invitation.expires = undefined;

  await familyGroup.save();

  if (!acceptingUser.familyGroups.includes(familyGroup._id)) {
    acceptingUser.familyGroups.push(familyGroup._id);
    await acceptingUser.save();
  }

  const populatedGroup = await populateFamilyGroup(familyGroup._id);
  res.json({ message: 'Invitation accepted successfully', familyGroup: populatedGroup });
});


// @desc    Remove member
// @route   PUT /api/family-groups/:id/remove-member
// @access  Private (owner/admin)
const removeMemberFromFamilyGroup = asyncHandler(async (req, res) => {
  const { memberId } = req.body;
  const familyGroup = await FamilyGroup.findById(req.params.id);

  if (!familyGroup) {
    return res.status(404).json({ message: 'Family group not found' });
  }

  const requester = familyGroup.members.find(m => m.user.toString() === req.user._id.toString());
  if (!requester || (requester.role !== 'owner' && requester.role !== 'admin')) {
    return res.status(403).json({ message: 'Only owner/admin can remove members' });
  }

  if (familyGroup.createdBy.toString() === memberId.toString()) {
    return res.status(400).json({ message: 'Cannot remove the group creator' });
  }

  const memberExists = familyGroup.members.some(m => m.user.toString() === memberId.toString());
  if (!memberExists) {
    return res.status(404).json({ message: 'Member not found in this group' });
  }

  familyGroup.members = familyGroup.members.filter(m => m.user.toString() !== memberId.toString());
  await familyGroup.save();

  const removedUser = await User.findById(memberId);
  if (removedUser) {
    removedUser.familyGroups = removedUser.familyGroups.filter(groupId => groupId.toString() !== familyGroup._id.toString());
    await removedUser.save();
  }

  const populatedGroup = await populateFamilyGroup(familyGroup._id);
  res.json({ message: 'Member removed successfully', familyGroup: populatedGroup });
});


// @desc    Delete a family group
// @route   DELETE /api/family-groups/:id
// @access  Private (owner only)
const deleteFamilyGroup = asyncHandler(async (req, res) => {
  const familyGroup = await FamilyGroup.findById(req.params.id);

  if (!familyGroup) {
    return res.status(404).json({ message: 'Family group not found' });
  }

  if (familyGroup.createdBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Only owner can delete this family group' });
  }

  const memberIds = familyGroup.members.map(m => m.user);

  await User.updateMany(
    { _id: { $in: memberIds } },
    { $pull: { familyGroups: familyGroup._id } }
  );

  await familyGroup.deleteOne();

  res.json({ message: 'Family group deleted successfully' });
});


// @desc    Update member role
// @route   PUT /api/family-groups/:id/update-role
// @access  Private (owner only)
const updateMemberRole = asyncHandler(async (req, res) => {
  const { memberId, newRole } = req.body;
  const familyGroup = await FamilyGroup.findById(req.params.id);

  if (!familyGroup) {
    return res.status(404).json({ message: 'Family group not found' });
  }

  const requester = familyGroup.members.find(
    (m) => m.user.toString() === req.user._id.toString()
  );
  if (!requester || requester.role !== 'owner') {
    return res.status(403).json({ message: 'Only the group owner can update member roles' });
  }

  const member = familyGroup.members.find(
    (m) => m.user.toString() === memberId.toString()
  );
  if (!member) {
    return res.status(404).json({ message: 'Member not found' });
  }

  if (member.user.toString() === familyGroup.createdBy.toString()) {
    return res.status(400).json({ message: 'Cannot change role of the group creator' });
  }

  member.role = newRole;
  await familyGroup.save();

  const populatedGroup = await populateFamilyGroup(familyGroup._id);
  res.json({ message: "Member role updated successfully", familyGroup: populatedGroup });
});


// @desc    Get all pending invitations for the logged-in user
// @route   GET /api/family-groups/invitations/my
// @access  Private
const getMyInvitations = async (req, res) => {
  try {
    const groups = await FamilyGroup.find({ "invitations.email": req.user.email })
      .populate("invitations.invitedBy", "fullName email")
      .populate("createdBy", "fullName email");

    const invitations = [];
    groups.forEach(group => {
      group.invitations.forEach(inv => {
        if (inv.email === req.user.email && inv.status === "pending") {
          invitations.push({
            _id: inv._id,
            token: inv.token,
            invitedBy: inv.invitedBy,
            familyGroup: {
              _id: group._id,
              name: group.name,
              description: group.description,
              createdBy: group.createdBy
            }
          });
        }
      });
    });

    res.json(invitations);
  } catch (err) {
    console.error("Error fetching invitations:", err);
    res.status(500).json({ message: "Failed to fetch invitations." });
  }
};
  // @desc    Decline invitation
// @route   POST /api/family-groups/invite/decline
// @access  Private
const declineFamilyGroupInvitation = asyncHandler(async (req, res) => {
  const { token } = req.body;

  const familyGroup = await FamilyGroup.findOne({ "invitations.token": token });
  if (!familyGroup) {
    return res.status(404).json({ message: "Invitation not found" });
  }

  const invitation = familyGroup.invitations.find((inv) => inv.token === token);
  if (!invitation) {
    return res.status(404).json({ message: "Invitation not found" });
  }

  // Only the invited user can decline
  if (invitation.email !== req.user.email) {
    return res.status(403).json({ message: "Not authorized to decline this invite" });
  }

  invitation.status = "declined";
  invitation.token = undefined;
  invitation.expires = undefined;
  await familyGroup.save();

  res.json({ message: "Invitation declined successfully" });
});

export {
  createFamilyGroup,
  getMyFamilyGroups,
  getFamilyGroupById,
  updateFamilyGroup,
  sendFamilyGroupInvitation,
  acceptFamilyGroupInvitation,
  removeMemberFromFamilyGroup,
  deleteFamilyGroup,
  updateMemberRole,
  getMyInvitations,
  declineFamilyGroupInvitation
};
