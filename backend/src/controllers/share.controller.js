
import ShareLink from "../models/shareLink.model.js";
import Collaboration from "../models/collaboration.model.js";
import User from "../models/user.model.js"
import FamilyMember from "../models/family.model.js";
import mongoose from "mongoose";
import crypto from "crypto";


// Helper function to generate a unique share ID
const generateUniqueShareId = async () => {
    let uniqueId;
    let isUnique = false;
    while (!isUnique) {
        // Generate a random string (e.g., 8 characters long, base64url encoded for URL safety)
        uniqueId = crypto.randomBytes(6).toString('base64url').replace(/[-_]/g, '').substring(0, 8); // Ensure fixed length, URL-safe
        const existingLink = await ShareLink.findOne({ uniqueShareId: uniqueId });
        if (!existingLink) {
            isUnique = true;
        }
    }
    return uniqueId;
};

// 1. Generate Public Read-Only Share Link
export const generateShareLink = async (req, res) => {
    console.log("generateShareLink controller hit!"); // Debug log
    console.log("req.user:", req.user); // Debug log: Check if user is attached
    
    try {
        if (!req.user || !req.user._id) {
            console.error("Error: req.user or req.user._id is missing."); // Debug log
            return res.status(401).json({ message: "Unauthorized: User not authenticated." });
        }
        const familyMapOwnerId = req.user._id; // The logged-in user is the owner
        console.log("Family Map Owner ID:", familyMapOwnerId); // Debug log

        // Check if an active public link already exists for this user's map
        const existingLink = await ShareLink.findOne({
            familyMapOwnerId: familyMapOwnerId,
            accessLevel: 'read-only-public'
        });

        if (existingLink) {
            console.log("Existing link found:", existingLink.uniqueShareId); // Debug log
            return res.status(200).json({
                message: "An active public share link already exists for your map.",
                link: `${req.protocol}://${req.get('host')}/share/${existingLink.uniqueShareId}`, // Construct full URL
                shareId: existingLink.uniqueShareId,
                existingLink: existingLink
            });
        }

        console.log("No existing link found. Generating new unique ID..."); // Debug log
        const uniqueShareId = await generateUniqueShareId();
        console.log("Generated Unique Share ID:", uniqueShareId); // Debug log

        // Ensure req.user.username exists before using it in description
        const usernameForDescription = req.user.username || req.user.email || 'a user';
        console.log("Username for description:", usernameForDescription); // Debug log

        const newShareLink = new ShareLink({
            uniqueShareId: uniqueShareId,
            familyMapOwnerId: familyMapOwnerId,
            accessLevel: 'read-only-public',
            description: req.body.description || `Public share link for ${usernameForDescription}'s map`
        });

        console.log("Saving new share link to DB..."); // Debug log
        const savedLink = await newShareLink.save();
        console.log("New share link saved:", savedLink); // Debug log

        res.status(201).json({
            message: "Public share link generated successfully!",
            link: `${req.protocol}://${req.get('host')}/share/${savedLink.uniqueShareId}`, // Construct the full URL for the frontend
            shareId: savedLink.uniqueShareId,
            shareLink: savedLink
        });

    } catch (error) {
        console.error("Error generating share link (caught in try-catch):", error.message); // Debug log
        console.error("Full error object:", error); // Debug log: Log the entire error for more details
        res.status(500).json({ message: "Failed to generate share link. Internal server error." });
    }
};

// 2. Revoke Share Link
export const revokeShareLink = async (req, res) => {
    try {
        // The frontend `shareService.js` calls DELETE /share/revoke-link without an ID in params.
        // It expects to revoke the *current user's* active public link.
        // So, we should look for the link owned by the current user, not by a shareId in params.
        const familyMapOwnerId = req.user._id; // The logged-in user is the owner

        // Find and delete the active public link for this user
        const result = await ShareLink.deleteOne({
            familyMapOwnerId: familyMapOwnerId,
            accessLevel: 'read-only-public'
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: "No active public share link found for your map to revoke." });
        }

        res.status(200).json({ message: "Share link revoked successfully." });

    } catch (error) {
        console.error("Error revoking share link:", error.message);
        res.status(500).json({ message: "Failed to revoke share link. Internal server error." });
    }
};

// 3. Invite Collaborator
export const inviteCollaborator = async (req, res) => {
    try {
        const familyMapOwnerId = req.user._id; // The logged-in user is the owner
        const { inviteeEmail, role } = req.body; // invitedUserIdentifier can be email or username (frontend sends email)

        if (!inviteeEmail || !role) {
            return res.status(400).json({ message: "Invitee email and role are required." });
        }

        if (!['viewer', 'contributor'].includes(role)) {
            return res.status(400).json({ message: "Invalid role specified. Must be 'viewer' or 'contributor'." });
        }

        // Find the invited user by email
        const invitedUser = await User.findOne({ email: inviteeEmail.toLowerCase() });

        if (!invitedUser) {
            return res.status(404).json({ message: "Invited user not found. Please ensure they are a registered user." });
        }

        // Prevent inviting self
        if (invitedUser._id.toString() === familyMapOwnerId.toString()) {
            return res.status(400).json({ message: "You cannot invite yourself to collaborate on your own map." });
        }

        // Check if an invitation/collaboration already exists
        const existingCollaboration = await Collaboration.findOne({
            familyMapOwnerId: familyMapOwnerId,
            collaboratorId: invitedUser._id
        });

        if (existingCollaboration) {
            if (existingCollaboration.status === 'accepted') {
                return res.status(409).json({ message: `Collaboration with ${inviteeEmail} already active with role: ${existingCollaboration.role}.` });
            } else if (existingCollaboration.status === 'pending') {
                return res.status(409).json({ message: `An invitation to ${inviteeEmail} is already pending.` });
            } else { // rejected or other status, update to pending
                existingCollaboration.role = role;
                existingCollaboration.status = 'pending';
                await existingCollaboration.save();
                return res.status(200).json({
                    message: `Invitation to ${inviteeEmail} updated to pending with role: ${role}.`,
                    collaboration: existingCollaboration
                });
            }
        }

        // Create new invitation
        const newCollaboration = new Collaboration({
            familyMapOwnerId: familyMapOwnerId,
            collaboratorId: invitedUser._id,
            role: role,
            status: 'pending' // Initial status is pending
        });

        const savedCollaboration = await newCollaboration.save();

        res.status(201).json({
            message: `Invitation sent to ${invitedUser.username || invitedUser.email} successfully!`,
            collaboration: savedCollaboration
        });

    } catch (error) {
        console.error("Error inviting collaborator:", error.message);
        res.status(500).json({ message: "Failed to invite collaborator. Internal server error." });
    }
};

// 4. Accept Collaboration Invitation
export const acceptCollaborationInvitation = async (req, res) => {
    try {
        const collaboratorId = req.user._id; // The logged-in user is the one accepting the invitation
        const { invitationId } = req.params; // The ID of the Collaboration document (invitation)

        if (!mongoose.Types.ObjectId.isValid(invitationId)) {
            return res.status(400).json({ message: "Invalid invitation ID format." });
        }

        const invitation = await Collaboration.findOne({
            _id: invitationId,
            collaboratorId: collaboratorId, // Ensure only the invited user can accept their invitation
            status: 'pending' // Can only accept pending invitations
        });

        if (!invitation) {
            return res.status(404).json({ message: "Invitation not found, already accepted, or you do not have permission to accept it." });
        }

        // Update the invitation status to 'accepted'
        invitation.status = 'accepted';
        await invitation.save();

        res.status(200).json({
            message: "Collaboration invitation accepted successfully!",
            collaboration: invitation
        });

    } catch (error) {
        console.error("Error accepting collaboration invitation:", error.message);
        res.status(500).json({ message: "Failed to accept invitation. Internal server error." });
    }
};


// 5. Change Collaborator Role
export const changeCollaboratorRole = async (req, res) => {
    try {
        const familyMapOwnerId = req.user._id; // The logged-in user (owner) is changing the role
        const { collaborationId, newRole } = req.body; // The collaboration ID and the new role

        if (!collaborationId || !newRole) {
            return res.status(400).json({ message: "Collaboration ID and new role are required." });
        }

        if (!mongoose.Types.ObjectId.isValid(collaborationId)) {
            return res.status(400).json({ message: "Invalid collaboration ID format." });
        }

        if (!['viewer', 'contributor'].includes(newRole)) {
            return res.status(400).json({ message: "Invalid new role specified. Must be 'viewer' or 'contributor'." });
        }

        // Find the collaboration record ensuring the requesting user is the owner
        const collaboration = await Collaboration.findOne({
            _id: collaborationId, // Find by collaboration ID
            familyMapOwnerId: familyMapOwnerId,
            status: 'accepted' // Only change role for active collaborations
        });

        if (!collaboration) {
            return res.status(404).json({ message: "Collaboration not found or not active, or you are not the owner." });
        }

        // Prevent owner from changing their own 'role' if they somehow have a collaboration record for themselves
        if (collaboration.collaboratorId.toString() === familyMapOwnerId.toString()) {
            return res.status(400).json({ message: "You cannot change your own role as the map owner." });
        }

        // Update the role
        collaboration.role = newRole;
        await collaboration.save();

        res.status(200).json({
            message: `Collaborator role updated to '${newRole}' successfully!`,
            collaboration: collaboration
        });

    } catch (error) {
        console.error("Error changing collaborator role:", error.message);
        res.status(500).json({ message: "Failed to change collaborator role. Internal server error." });
    }
};

// 6. Remove Collaborator
export const removeCollaborator = async (req, res) => {
    try {
        const familyMapOwnerId = req.user._id; // The logged-in user (owner) is removing the collaborator
        const { collaborationId } = req.params; // The ID of the collaboration document to remove

        if (!mongoose.Types.ObjectId.isValid(collaborationId)) {
            return res.status(400).json({ message: "Invalid collaboration ID format." });
        }

        // Find and delete the collaboration record ensuring the requesting user is the owner
        const result = await Collaboration.deleteOne({
            _id: collaborationId, // Find by collaboration ID
            familyMapOwnerId: familyMapOwnerId
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: "Collaboration not found, or you are not the owner, or the collaborator has already been removed." });
        }

        res.status(200).json({ message: "Collaborator removed successfully." });

    } catch (error) {
        console.error("Error removing collaborator:", error.message);
        res.status(500).json({ message: "Failed to remove collaborator. Internal server error." });
    }
};

// backend/controllers/share.controller.js
// ... (existing imports and functions like generateShareLink, revokeShareLink)

// NEW: Function to get the current public share link for the user's map
export const getShareLink = async (req, res) => {
    console.log("getShareLink controller hit!");
    try {
        if (!req.user || !req.user._id) {
            return res.status(401).json({ message: "Unauthorized: User not authenticated." });
        }
        const familyMapOwnerId = req.user._id;

        const existingLink = await ShareLink.findOne({
            familyMapOwnerId: familyMapOwnerId,
            accessLevel: 'read-only-public'
        });

        if (existingLink) {
            return res.status(200).json({
                message: "Public share link found.",
                link: `${req.protocol}://${req.get('host')}/share/${existingLink.uniqueShareId}`,
                shareId: existingLink.uniqueShareId,
                shareLink: existingLink
            });
        } else {
            return res.status(200).json({ message: "No active public share link found.", shareLink: null });
        }

    } catch (error) {
        console.error("Error getting share link:", error.message);
        res.status(500).json({ message: "Internal server error." });
    }
};
