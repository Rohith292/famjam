    import Collaboration from '../models/collaboration.model.js';
    import User from '../models/user.model.js';
    import mongoose from 'mongoose';
    import FamilMap from "../models/family.model.js";
    // @desc    Send a collaboration invitation
    // @route   POST /api/collaborations/invite
    // @access  Private (Owner only)
   // backend/controllers/collaboration.controller.js
export const sendInvitation = async (req, res) => {
    try {
        const { email, role } = req.body;
        const ownerId = req.user._id; // The authenticated user is the owner

        // ***************************************************************
        // REMOVE OR REFACTOR THIS SECTION IF YOU DON'T HAVE A FamilyMap MODEL
        // If your Collaboration model's familyMapOwnerId directly points to a User's _id
        // then finding a "FamilyMap" document is not necessary here.
        // The ownerId (req.user._id) already identifies the owner whose members are being shared.
        // ***************************************************************

        // 1. Find the user to be invited
        const inviteeUser = await User.findOne({ email });
        if (!inviteeUser) {
            return res.status(404).json({ message: "User with that email does not exist." });
        }

        // 2. Prevent inviting self
        if (inviteeUser._id.toString() === ownerId.toString()) {
            return res.status(400).json({ message: "You cannot invite yourself." });
        }

        // 3. Check for existing ACTIVE collaboration/invitation
        const existingCollaboration = await Collaboration.findOne({
            familyMapOwnerId: ownerId, // This correctly refers to the User ID of the owner
            collaboratorId: inviteeUser._id,
            status: { $in: ['accepted', 'pending'] } // Look for active or pending
        });

        if (existingCollaboration) {
            return res.status(409).json({ message: "An active or pending invitation/collaboration already exists for this user." });
        }

        // 4. Create new invitation
        const newCollaboration = new Collaboration({
            familyMapOwnerId: ownerId, // This is the ID of the user whose FamilyMembers are being shared
            collaboratorId: inviteeUser._id,
            role,
            status: 'pending',
            // Add a token/link for email notification if you implement email invites
        });

        await newCollaboration.save();

        res.status(201).json({ message: "Invitation sent successfully!", collaboration: newCollaboration });

    } catch (error) {
        console.error("Error inviting collaborator:", error.message);
        res.status(500).json({ message: "Internal server error." });
    }
};

    // @desc    Accept a collaboration invitation
    // @route   PUT /api/collaborations/:id/accept
    // @access  Private (Collaborator only)
    export const acceptInvitation = async (req, res) => {
        console.log("[Collaboration Controller] acceptInvitation hit.");
        const { id } = req.params; // Collaboration ID
        const collaboratorId = req.user._id; // Current logged-in user is the collaborator

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid collaboration ID." });
        }

        try {
            const collaboration = await Collaboration.findById(id);

            if (!collaboration) {
                return res.status(404).json({ message: "Collaboration invitation not found." });
            }

            // Ensure the current user is the intended collaborator for this invitation
            if (collaboration.collaboratorId.toString() !== collaboratorId.toString()) {
                return res.status(403).json({ message: "You are not authorized to accept this invitation." });
            }

            // Ensure the invitation is pending and not expired
            if (collaboration.status !== 'pending') {
                return res.status(400).json({ message: `Invitation is already ${collaboration.status}.` });
            }
            if (collaboration.expiresAt && new Date() > collaboration.expiresAt) {
                collaboration.status = 'declined'; // Mark as declined if expired
                await collaboration.save();
                return res.status(400).json({ message: "Invitation has expired." });
            }

            collaboration.status = 'accepted';
            await collaboration.save();
            console.log(`[Collaboration Controller] Invitation ${id} accepted by user ${collaboratorId}.`);
            res.status(200).json({ message: "Invitation accepted successfully!", collaboration });

        } catch (error) {
            console.error("[Collaboration Controller] Error accepting invitation:", error.message);
            res.status(500).json({ message: "Internal server error." });
        }
    };

    // @desc    Decline a collaboration invitation
    // @route   PUT /api/collaborations/:id/decline
    // @access  Private (Collaborator only)
    export const declineInvitation = async (req, res) => {
        console.log("[Collaboration Controller] declineInvitation hit.");
        const { id } = req.params; // Collaboration ID
        const collaboratorId = req.user._id; // Current logged-in user is the collaborator

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid collaboration ID." });
        }

        try {
            const collaboration = await Collaboration.findById(id);

            if (!collaboration) {
                return res.status(404).json({ message: "Collaboration invitation not found." });
            }

            // Ensure the current user is the intended collaborator for this invitation
            if (collaboration.collaboratorId.toString() !== collaboratorId.toString()) {
                return res.status(403).json({ message: "You are not authorized to decline this invitation." });
            }

            if (collaboration.status !== 'pending') {
                return res.status(400).json({ message: `Invitation is already ${collaboration.status}.` });
            }

            collaboration.status = 'declined';
            await collaboration.save();
            console.log(`[Collaboration Controller] Invitation ${id} declined by user ${collaboratorId}.`);
            res.status(200).json({ message: "Invitation declined successfully!", collaboration });

        } catch (error) {
            console.error("[Collaboration Controller] Error declining invitation:", error.message);
            res.status(500).json({ message: "Internal server error." });
        }
    };

    // @desc    Revoke a collaborator's access (owner only)
    // @route   DELETE /api/collaborations/:id/revoke
    // @access  Private (Owner only)
    export const revokeAccess = async (req, res) => {
        console.log("[Collaboration Controller] revokeAccess hit.");
        const { id } = req.params; // Collaboration ID
        const familyMapOwnerId = req.user._id; // Current logged-in user is the owner

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid collaboration ID." });
        }

        try {
            const collaboration = await Collaboration.findById(id);

            if (!collaboration) {
                return res.status(404).json({ message: "Collaboration not found." });
            }

            // Ensure the current user is the owner of the map associated with this collaboration
            if (collaboration.familyMapOwnerId.toString() !== familyMapOwnerId.toString()) {
                return res.status(403).json({ message: "You are not authorized to revoke access for this collaboration." });
            }

            // Update status to revoked instead of deleting, to keep a record
            collaboration.status = 'revoked';
            await collaboration.save();
            console.log(`[Collaboration Controller] Access revoked for collaboration ${id}.`);
            res.status(200).json({ message: "Collaborator access revoked successfully!" });

        } catch (error) {
            console.error("[Collaboration Controller] Error revoking access:", error.message);
            res.status(500).json({ message: "Internal server error." });
        }
    };

    //cancel an invitation route
    export const cancelInvitation = async (req, res) => {
  console.log("[Collaboration Controller] cancelInvitation hit.");
  const { id } = req.params; // Collaboration ID
  const inviterId = req.user._id; // Current logged-in user is the inviter

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid collaboration ID." });
  }

  try {
    const collaboration = await Collaboration.findById(id);

    if (!collaboration) {
      return res.status(404).json({ message: "Collaboration not found." });
    }

    // Ensure the current user is the one who sent the invite
    if (collaboration.familyMapOwnerId.toString() !== inviterId.toString()) {
      return res.status(403).json({ message: "You are not authorized to cancel this invitation." });
    }

    // Only allow cancellation if the invite is still pending
    if (collaboration.status !== 'pending') {
      return res.status(400).json({ message: "Cannot cancel an invitation that has already been accepted or declined." });
    }

    // Update status to cancelled
    collaboration.status = 'cancelled';
    await collaboration.save();

    console.log(`[Collaboration Controller] Invitation ${id} cancelled by inviter.`);
    res.status(200).json({ message: "Invitation cancelled successfully." });

  } catch (error) {
    console.error("[Collaboration Controller] Error cancelling invitation:", error.message);
    res.status(500).json({ message: "Internal server error." });
  }
};


    // @desc    Update a collaborator's role (owner only)
    // @route   PUT /api/collaborations/:id/role
    // @access  Private (Owner only)
    export const updateRole = async (req, res) => {
        console.log("[Collaboration Controller] updateRole hit.");
        const { id } = req.params; // Collaboration ID
        const { role } = req.body;
        const familyMapOwnerId = req.user._id; // Current logged-in user is the owner

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid collaboration ID." });
        }
        if (!role || !['viewer', 'contributor'].includes(role)) {
            return res.status(400).json({ message: "Invalid role specified. Must be 'viewer' or 'contributor'." });
        }

        try {
            const collaboration = await Collaboration.findById(id);

            if (!collaboration) {
                return res.status(404).json({ message: "Collaboration not found." });
            }

            // Ensure the current user is the owner of the map associated with this collaboration
            if (collaboration.familyMapOwnerId.toString() !== familyMapOwnerId.toString()) {
                return res.status(403).json({ message: "You are not authorized to update the role for this collaboration." });
            }

            // Prevent changing role if status is not accepted
            if (collaboration.status !== 'accepted') {
                return res.status(400).json({ message: `Cannot change role for a collaboration that is ${collaboration.status}. Only 'accepted' collaborations can have their role updated.` });
            }

            collaboration.role = role;
            await collaboration.save();
            console.log(`[Collaboration Controller] Role updated for collaboration ${id} to ${role}.`);
            res.status(200).json({ message: "Collaborator role updated successfully!", collaboration });

        } catch (error) {
            console.error("[Collaboration Controller] Error updating role:", error.message);
            res.status(500).json({ message: "Internal server error." });
        }
    };

    export const deleteCollaborationRecord = async (req, res) => {
    try {
        const { id: collaborationId } = req.params; // collaborationId from URL param

        // Find the collaboration record and ensure the requesting user is the owner
        const collaboration = await Collaboration.findOne({ _id: collaborationId, familyMapOwnerId: req.user._id });

        if (!collaboration) {
            return res.status(404).json({ message: "Collaboration record not found or you don't have permission." });
        }

        // Only allow deleting if the status is 'revoked' or 'declined'
        // If you want to allow deleting accepted ones directly, adjust this logic.
        if (!['revoked', 'declined', 'cancelled'].includes(collaboration.status)) {
            return res.status(400).json({ message: "Cannot delete an active or pending collaboration record. Please revoke or cancel it first." });
        }

        await Collaboration.deleteOne({ _id: collaborationId }); // Permanently delete

        res.status(200).json({ message: "Collaboration record removed successfully." });

    } catch (error) {
        console.error("Error deleting collaboration record:", error.message);
        res.status(500).json({ message: "Internal server error." });
    }
};
    