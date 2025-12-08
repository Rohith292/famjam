import mongoose from "mongoose";
import FamilyMember from "../models/family.model.js";
import User from "../models/user.model.js";
import cloudinary from "../lib/cloudinary.js";
import ShareLink from "../models/shareLink.model.js";
import Collaboration from "../models/collaboration.model.js"; // Corrected path if needed, assuming Collaboration model is here
import FamilyGroup from "../models/familyGroup.model.js";
import expressAsyncHandler from "express-async-handler";
import asyncHandler from "express-async-handler";

export const addFamilyMember = async (req, res) => {
    console.log("addFamilyMember controller hit!");
    console.log("Request body:", req.body);
    try {
        const { name, relation, parentId, partners, dateOfBirth, gender, notes,associatedGroup } = req.body;
        const createdBy = req.user._id;

        let photoURL = '';
        let cloudinaryPublicId = '';

        if (req.file) {
            try {
                const result = await cloudinary.uploader.upload(req.file.path || `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`, {
                    folder: `family-mind-map/${createdBy}`,
                    resource_type: "auto"
                });

                photoURL = result.secure_url;
                cloudinaryPublicId = result.public_id;
            } catch (uploadError) {
                console.error("Cloudinary upload error:", uploadError);
                return res.status(500).json({ message: "Failed to upload image to Cloudinary." });
            }
        }

        let resolvedParentId = null;
        if (parentId) {
            if (!mongoose.Types.ObjectId.isValid(parentId)) {
                return res.status(400).json({ message: "Invalid parent ID format." });
            }
            const parentExists = await FamilyMember.findOne({ _id: parentId, createdBy: createdBy });
            if (!parentExists) {
                return res.status(400).json({ message: "Parent not found or does not belong to your family tree." });
            }
            resolvedParentId = parentId;
        }
        // --- REVISED LOGIC FOR associatedGroup START ---
        let associatedGroupObjectId = null;
        if (associatedGroup) {
            if (!mongoose.Types.ObjectId.isValid(associatedGroup)) {
                return res.status(400).json({ message: "Invalid associated group ID format." });
            }
            // You might want to add a check here to ensure the user is a member of this group
            // const groupExists = await FamilyGroup.findById(associatedGroup);
            // if (!groupExists || !groupExists.members.includes(createdBy)) { ... }
            associatedGroupObjectId = new mongoose.Types.ObjectId(associatedGroup);
        }
        // If associatedGroup is not provided, associatedGroupObjectId remains null, which is correct
        // for members of the personal family map.
        // --- REVISED LOGIC FOR associatedGroup END ---
        const resolvedPartners = [];
        if (partners && Array.isArray(partners) && partners.length > 0) {
            for (const partnerId of partners) {
                if (!mongoose.Types.ObjectId.isValid(partnerId)) {
                    return res.status(400).json({ message: `Invalid partner ID format: ${partnerId}` });
                }
                const partnerExists = await FamilyMember.findOne({ _id: partnerId, createdBy: createdBy });
                if (!partnerExists) {
                    return res.status(400).json({ message: `Partner with ID ${partnerId} not found or does not belong to your family tree.` });
                }
                resolvedPartners.push(partnerId);
            }
        }

        const newFamilyMember = new FamilyMember({
            name,
            relation,
            photoURL,
            cloudinaryPublicId,
            parentId: resolvedParentId,
            partners: resolvedPartners,
            createdBy,
            dateOfBirth,
            gender,
            notes,
            associatedGroup:associatedGroupObjectId,
            children:[]
        });

        const savedFamilyMember = await newFamilyMember.save();
        if (resolvedParentId) {
    await FamilyMember.findByIdAndUpdate(
        resolvedParentId,
        { $addToSet: { children: savedFamilyMember._id } }
    );

    const parent = await FamilyMember.findById(resolvedParentId);
    if (parent?.partners?.length) {
        await FamilyMember.updateMany(
            { _id: { $in: parent.partners }, createdBy: createdBy },
            { $addToSet: { children: savedFamilyMember._id } }
        );
        console.log(`[addFamilyMember] Also linked ${savedFamilyMember.name} to ${parent.partners.length} partner(s) of parent ${parent.name}`);
    }
}




        if (resolvedPartners.length > 0) {
            await FamilyMember.updateMany(
                { _id: { $in: resolvedPartners }, createdBy: createdBy },
                { $addToSet: { partners: savedFamilyMember._id } }
            );
        }

        if ( resolvedPartners.length > 0) {
    await FamilyMember.updateMany(
        { _id: { $in: resolvedPartners }, createdBy: createdBy },
        { $addToSet: { children: savedFamilyMember._id } }
    );
}

        res.status(201).json(savedFamilyMember);

    } catch (error) {
        console.error("Error in addFamilyMember controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const getFamilyMap = async (req, res) => {
    console.log("[getFamilyMap] Controller hit!");
    console.log("[getFamilyMap] req.query:", req.query);
    console.log("[getFamilyMap] req.user (currentUser from protectRoute):", req.user ? req.user.username || req.user.email : "undefined");

    try {
        const currentUser = req.user;

        const { shareId, ownerId } = req.query;

        let actualMapOwnerId = null;
        let canEdit = false;
        let permissionGranted = false;

        if (shareId) {
            console.log("[getFamilyMap] Share ID detected:", shareId);
            const shareLink = await ShareLink.findOne({ uniqueShareId: shareId, accessLevel: 'read-only-public' });

            if (!shareLink) {
                console.log("[getFamilyMap] Invalid or expired share link. Sending 404.");
                return res.status(404).json({ message: "Invalid or expired share link." });
            }

            actualMapOwnerId = shareLink.familyMapOwnerId;
            canEdit = false;
            permissionGranted = true;
            console.log(`[getFamilyMap] Public share link found. Map owner: ${actualMapOwnerId.toString()}`);

            if (currentUser) {
                console.log("[getFamilyMap] User is logged in on a public share link. Checking owner/collaborator status.");
                if (currentUser._id.toString() === actualMapOwnerId.toString()) {
                    canEdit = true;
                    console.log("[getFamilyMap] Logged-in user is the owner. canEdit = true.");
                } else {
                    const collaboration = await Collaboration.findOne({
                        familyMapOwnerId: actualMapOwnerId,
                        collaboratorId: currentUser._id,
                        status: 'accepted'
                    });
                    if (collaboration && collaboration.role === 'contributor') {
                        canEdit = true;
                        console.log("[getFamilyMap] Logged-in user is a contributor. canEdit = true.");
                    } else {
                        console.log("[getFamilyMap] Logged-in user is not owner/contributor. canEdit = false.");
                    }
                }
            } else {
                console.log("[getFamilyMap] No user logged in. Public link is read-only. canEdit = false.");
            }
        }
        else if (ownerId) {
            console.log("[getFamilyMap] Owner ID detected:", ownerId);
            if (!currentUser) {
                console.log("[getFamilyMap] Authentication required for ownerId access. Sending 401.");
                return res.status(401).json({ message: "Authentication required to access collaborated maps by owner ID." });
            }
            if (!mongoose.Types.ObjectId.isValid(ownerId)) {
                console.log("[getFamilyMap] Invalid owner ID format. Sending 400.");
                return res.status(400).json({ message: "Invalid owner ID format." });
            }

            const collaboration = await Collaboration.findOne({
                familyMapOwnerId: new mongoose.Types.ObjectId(ownerId),
                collaboratorId: currentUser._id,
                status: 'accepted'
            });

            if (!collaboration) {
                console.log("[getFamilyMap] User does not have permission for this collaborated map. Sending 403.");
                return res.status(403).json({ message: "You do not have permission to access this collaborated map." });
            }

            actualMapOwnerId = new mongoose.Types.ObjectId(ownerId);
            permissionGranted = true;
            if (collaboration.role === 'contributor') {
                canEdit = true;
            } else {
                canEdit = false;
            }
            console.log(`[getFamilyMap] Collaborated map access. Map owner: ${actualMapOwnerId.toString()}, canEdit: ${canEdit}`);
        }
        else {
            console.log("[getFamilyMap] No shareId or ownerId. Attempting to fetch current user's own *personal* map."); // Updated log
            if (!currentUser) {
                console.log("[getFamilyMap] currentUser is undefined. Sending 401.");
                return res.status(401).json({ message: "Authentication required to view your own map." });
            }
            actualMapOwnerId = currentUser._id;
            canEdit = true;
            permissionGranted = true;
            console.log(`[getFamilyMap] Fetching current user's own map. Owner: ${actualMapOwnerId.toString()}, canEdit: ${canEdit}`);
        }

        if (!permissionGranted || !actualMapOwnerId) {
            console.log("[getFamilyMap] Access denied: permission not granted or map owner ID missing. Sending 403.");
            return res.status(403).json({ message: "Access denied. Insufficient permissions or map not found." });
        }

        // --- CORE CHANGE STARTS HERE ---
        console.log(`[getFamilyMap] Fetching family members for owner ID: ${actualMapOwnerId.toString()} (excluding group members).`);

        const familyMap = await FamilyMember.find({
            createdBy: actualMapOwnerId,
            $or: [
                { associatedGroup: { $exists: false } }, // associatedGroup field does not exist
                { associatedGroup: null }                 // associatedGroup field exists but is null
            ]
        });
        // --- CORE CHANGE ENDS HERE ---

        console.log(`[getFamilyMap] Personal family map fetched. Number of members: ${familyMap.length}`);

        res.status(200).json({
            familyMap,
            canEdit: canEdit,
            isOwner: currentUser && currentUser._id.toString() === actualMapOwnerId.toString()
        });

    } catch (error) {
        console.error("[getFamilyMap] Error fetching family map (caught in try-catch):", error.message);
        console.error("[getFamilyMap] Full error object:", error);
        res.status(500).json({ message: "Failed to fetch family map. Internal server error." });
    } finally {
        console.log("[getFamilyMap] END");
    }
};

export const getFamilyMemberById = async (req, res) => {
    try {
        const { id } = req.params;
        const currentUser = req.user; // This will be undefined for anonymous users
        const { shareId } = req.query;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid family member ID format." });
        }

        const familyMember = await FamilyMember.findById(id).lean(); // Use .lean() to get a plain JS object

        if (!familyMember) {
            return res.status(404).json({ message: "Family member not found." });
        }

        const mapOwnerId = familyMember.createdBy;

        let hasPermission = false;
        let canEdit = false;
        let isOwner = false; // Initialize to false

        // --- Permission Logic ---
        if (shareId) {
            const shareLink = await ShareLink.findOne({ uniqueShareId: shareId, accessLevel: 'read-only-public', familyMapOwnerId: mapOwnerId });
            if (shareLink) {
                hasPermission = true;
                canEdit = false; // Public share links are read-only
            }
            if (currentUser) {
                if (currentUser._id.toString() === mapOwnerId.toString()) {
                    hasPermission = true;
                    canEdit = true;
                    isOwner = true; // Set to true if current user is owner
                } else {
                    const collaboration = await Collaboration.findOne({
                        familyMapOwnerId: mapOwnerId,
                        collaboratorId: currentUser._id,
                        status: 'accepted'
                    });
                    if (collaboration) {
                        hasPermission = true;
                        if (collaboration.role === 'contributor') {
                            canEdit = true;
                        }
                    }
                }
            }
        }
        else if (currentUser) { // No shareId, direct access by authenticated user
            if (currentUser._id.toString() === mapOwnerId.toString()) {
                hasPermission = true;
                canEdit = true;
                isOwner = true; // Set to true if current user is owner
            } else {
                const collaboration = await Collaboration.findOne({
                    familyMapOwnerId: mapOwnerId,
                    collaboratorId: currentUser._id,
                    status: 'accepted'
                });
                if (collaboration) {
                    hasPermission = true;
                    if (collaboration.role === 'contributor') {
                        canEdit = true;
                    }
                }
            }
        }

        if (!hasPermission) {
            return res.status(403).json({ message: "You do not have permission to view this family member." });
        }

        // Construct the response object explicitly to ensure properties are set
        const responseData = {
            ...familyMember, // Spread the original member data
            canEdit: canEdit,
            isOwner: isOwner // This should now correctly override any existing/default isOwner on familyMember
        };

        console.log(`[getFamilyMemberById] Sending response - canEdit: ${responseData.canEdit}, isOwner: ${responseData.isOwner}`); // NEW DEBUG LOG
        res.status(200).json(responseData);

    } catch (error) {
        console.error("Error fetching family member by ID:", error.message);
        res.status(500).json({ message: "Failed to fetch family member. Internal server error." });
    }
};

export const updateFamilyMember = async (req, res) => {
    console.log("updateFamilyMember controller hit!"); // NEW DEBUG LOG
    console.log("Request params (id):", req.params.id); // NEW DEBUG LOG
    console.log("Request body:", req.body); // NEW DEBUG LOG
    console.log("Request file (req.file):", req.file); // NEW DEBUG LOG

    try {
        const { id } = req.params;
        const currentUserId = req.user._id;
        const { name, relation, parentId, partners, dateOfBirth, gender, notes } = req.body;
        
        const updatedData = { name, relation, dateOfBirth, gender, notes };

        if (!mongoose.Types.ObjectId.isValid(id)) {
            console.log("Invalid family member ID format."); // NEW DEBUG LOG
            return res.status(400).json({ message: "Invalid family member ID format." });
        }

        const familyMember = await FamilyMember.findById(id);
        console.log("Family member found from DB:", familyMember); // NEW DEBUG LOG

        if (!familyMember) {
            console.log("Family member not found."); // NEW DEBUG LOG
            return res.status(404).json({ message: "Family member not found." });
        }

        const mapOwnerId = familyMember.createdBy;

        const isOwner = mapOwnerId.toString() === currentUserId.toString();
        if (!isOwner) {
            const collaboration = await Collaboration.findOne({
                familyMapOwnerId: mapOwnerId,
                collaboratorId: currentUserId,
                status: 'accepted',
                role: 'contributor'
            });

            if (!collaboration) {
                console.log("Permission denied: Not owner or contributor."); // NEW DEBUG LOG
                return res.status(403).json({ message: "You do not have permission to update this family member." });
            }
        }
        console.log("Permission granted for update."); // NEW DEBUG LOG

        // --- Handle Image Update Logic ---
        if (req.file) {
            console.log("New image detected for upload."); // NEW DEBUG LOG
            // Case 1: A new image file was uploaded
            if (familyMember.cloudinaryPublicId) {
                console.log("Deleting old image from Cloudinary:", familyMember.cloudinaryPublicId); // NEW DEBUG LOG
                await cloudinary.uploader.destroy(familyMember.cloudinaryPublicId);
                console.log("Old image deleted."); // NEW DEBUG LOG
            }
            console.log("Uploading new image to Cloudinary..."); // NEW DEBUG LOG
            const result = await cloudinary.uploader.upload(req.file.path || `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`, {
                folder: `family-mind-map/${mapOwnerId}`,
                resource_type: "auto"
            });
            console.log("New image uploaded. Secure URL:", result.secure_url); // NEW DEBUG LOG
            updatedData.photoURL = result.secure_url;
            updatedData.cloudinaryPublicId = result.public_id;
        } else {
            console.log("No new image file uploaded."); // NEW DEBUG LOG
            // Case 2: No new file uploaded. Check if existing image should be removed or retained.
            if (req.body.photoURL === '') { // Assuming frontend sends empty string to indicate deletion
                console.log("Frontend explicitly requested image deletion."); // NEW DEBUG LOG
                if (familyMember.cloudinaryPublicId) {
                    console.log("Deleting old image from Cloudinary (explicit deletion):", familyMember.cloudinaryPublicId); // NEW DEBUG LOG
                    await cloudinary.uploader.destroy(familyMember.cloudinaryPublicId);
                    console.log("Old image deleted (explicit deletion)."); // NEW DEBUG LOG
                }
                updatedData.photoURL = '';
                updatedData.cloudinaryPublicId = '';
            } else {
                console.log("Retaining existing image data."); // NEW DEBUG LOG
                updatedData.photoURL = familyMember.photoURL;
                updatedData.cloudinaryPublicId = familyMember.cloudinaryPublicId;
            }
        }

        // --- Handle parentId update ---
        let resolvedParentId = null;
        if (parentId) {
            if (!mongoose.Types.ObjectId.isValid(parentId)) {
                console.log("Invalid parent ID format provided."); // NEW DEBUG LOG
                return res.status(400).json({ message: "Invalid parent ID format." });
            }
            const parentExists = await FamilyMember.findOne({ _id: parentId, createdBy: mapOwnerId });
            if (!parentExists) {
                console.log("Parent not found or does not belong to map owner."); // NEW DEBUG LOG
                return res.status(400).json({ message: "Parent not found or does not belong to your family tree." });
            }
            resolvedParentId = parentId;
        }
        updatedData.parentId = resolvedParentId;
        console.log("Resolved parentId:", updatedData.parentId); // NEW DEBUG LOG


        // --- Handle partners update ---
        const resolvedPartners = [];
        const partnersArray = Array.isArray(partners) ? partners : (partners ? [partners] : []);
        console.log("Raw partners array from request:", partnersArray); // NEW DEBUG LOG

        if (partnersArray.length > 0) {
            for (const partnerId of partnersArray) {
                if (!mongoose.Types.ObjectId.isValid(partnerId)) {
                    console.log(`Invalid partner ID format: ${partnerId}`); // NEW DEBUG LOG
                    return res.status(400).json({ message: `Invalid partner ID format: ${partnerId}` });
                }
                const partnerExists = await FamilyMember.findOne({ _id: partnerId, createdBy: mapOwnerId });
                if (!partnerExists) {
                    console.log(`Partner with ID ${partnerId} not found or does not belong to map owner.`); // NEW DEBUG LOG
                    return res.status(400).json({ message: `Partner with ID ${partnerId} not found or does not belong to your family tree.` });
                }
                resolvedPartners.push(partnerId);
            }
        }
        updatedData.partners = resolvedPartners;
        console.log("Resolved partners array:", updatedData.partners); // NEW DEBUG LOG


        console.log("Attempting to findByIdAndUpdate with data:", updatedData); // NEW DEBUG LOG
        const updatedMember = await FamilyMember.findByIdAndUpdate(
            id,
            { $set: updatedData },
            { new: true, runValidators: true }
        );
        console.log("findByIdAndUpdate result:", updatedMember); // NEW DEBUG LOG

        if (!updatedMember) {
            console.log("Failed to update family member (updatedMember is null)."); // NEW DEBUG LOG
            return res.status(500).json({ message: "Failed to update family member." });
        }

        // --- Bidirectional Partner Sync ---
        const oldPartners = familyMember.partners.map(p => p.toString());
        const newPartners = resolvedPartners.map(p => p.toString());

        const addedPartners = newPartners.filter(pId => !oldPartners.includes(pId));
        const removedPartners = oldPartners.filter(pId => !newPartners.includes(pId));
        console.log("Partners to add to others:", addedPartners); // NEW DEBUG LOG
        console.log("Partners to remove from others:", removedPartners); // NEW DEBUG LOG


        if (addedPartners.length > 0) {
            await FamilyMember.updateMany(
                { _id: { $in: addedPartners }, createdBy: mapOwnerId },
                { $addToSet: { partners: updatedMember._id } }
            );
            console.log("Added current member to new partners' lists."); // NEW DEBUG LOG
        }

        if (removedPartners.length > 0) {
            await FamilyMember.updateMany(
                { _id: { $in: removedPartners }, createdBy: mapOwnerId },
                { $pull: { partners: updatedMember._id } }
            );
            console.log("Removed current member from old partners' lists."); // NEW DEBUG LOG
        }

        res.status(200).json({
            message: "Family member updated successfully!",
            familyMember: updatedMember
        });

    } catch (error) {
        console.error("Caught error in updateFamilyMember controller:", error.message); // NEW DEBUG LOG
        // Log the full error object for more details
        console.error("Full error object:", error); // NEW DEBUG LOG
        res.status(500).json({ message: "Failed to update family member. Internal server error." });
    }
};

 export const getCollaborations = async (req, res) => {
            try {
                const userId = req.user._id;

                // Collaborations where the current user is the owner
                const asOwner = await Collaboration.find({ familyMapOwnerId: userId })
                    .populate('collaboratorId', 'fullName email') // Populate collaborator details
                    .populate('familyMapOwnerId', 'fullName email') // Populate owner details (useful for sharedWithMe)
                    .sort({ createdAt: -1 }); // Newest first

                // Collaborations where the current user is the collaborator
                const asCollaborator = await Collaboration.find({ collaboratorId: userId })
                    .populate('familyMapOwnerId', 'fullName email') // Populate owner details
                    .populate('collaboratorId', 'fullName email') // Populate collaborator details (useful for owned)
                    .sort({ createdAt: -1 }); // Newest first

                res.status(200).json({ asOwner, asCollaborator });

            } catch (error) {
                console.error("Error in getCollaborations:", error.message);
                res.status(500).json({ message: "Internal server error." });
            }
        };
// Delete Family Member with Permissions
export const deleteFamilyMember = async (req, res) => {
    try {
        const { id } = req.params;
        const currentUserId = req.user._id;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid family member ID format." });
        }

        const familyMember = await FamilyMember.findById(id);

        if (!familyMember) {
            return res.status(404).json({ message: "Family member not found." });
        }

        const mapOwnerId = familyMember.createdBy;

        const isOwner = mapOwnerId.toString() === currentUserId.toString();
        if (!isOwner) { // Only check collaboration if not the owner
            const collaboration = await Collaboration.findOne({
                familyMapOwnerId: mapOwnerId,
                collaboratorId: currentUserId,
                status: 'accepted',
                role: 'contributor'
            });

            if (!collaboration) {
                return res.status(403).json({ message: "You do not have permission to delete this family member." });
            }
        }

        const hasChildren = await FamilyMember.findOne({ parentId: id });
        if (hasChildren) {
            return res.status(400).json({ message: "Cannot delete a family member that has children. Please delete the children first." });
        }

        // Before deleting the member, remove them from any partners' lists
        if (familyMember.partners && familyMember.partners.length > 0) {
            await FamilyMember.updateMany(
                { _id: { $in: familyMember.partners }, createdBy: mapOwnerId },
                { $pull: { partners: familyMember._id } }
            );
        }

        // Delete image from Cloudinary if it exists
        if (familyMember.cloudinaryPublicId) {
            await cloudinary.uploader.destroy(familyMember.cloudinaryPublicId);
        }

        await FamilyMember.findByIdAndDelete(id);

        res.status(200).json({ message: "Family member deleted successfully!" });

    } catch (error) {
        console.error("Error deleting family member:", error.message);
        res.status(500).json({ message: "Failed to delete family member. Internal server error." });
    }
};

export const searchFamilyMembers=async(req,res)=>{
    try{
        const {name}=req.query;
        const createdBy=req.user._id;

        const searchQuery={createdBy:createdBy};

        if(name){
            searchQuery.name={$regex:new RegExp(name,'i')};
        }else{
            return res.status(400).json({message:"please provide a 'name' query parameter to search"});
        }

        const foundMembers=await FamilyMember.find(searchQuery)
        .populate({
            path:'parentId',
            select:'name relation photoURL _id'
        })
        .populate({
            path:'partners',
            select:'name relation photoURL _id'
        }).lean();

        res.status(200).json(foundMembers);
    }catch(error){
        console.error("error in the searchFamilyMembers controller:",error.message);
        res.status(500).json({message:'internal server error'});
    }
};
// get all the family members associated with a specific group
// GET /api/family/group/:id
// get all the family members associated with a specific group
// GET /api/family/group/:id
export const getFamilyMemberByGroup = asyncHandler(async (req, res) => {
  try {
    const { groupId } = req.params;

    // 1. Check if group exists
    const familyGroup = await FamilyGroup.findById(groupId);
    if (!familyGroup) {
      return res.status(404).json({ message: "Family group not found" });
    }

    // 2. ✅ Corrected membership check
    const isMember = familyGroup.members.some(
      m => m.user.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({ message: "Not authorized to view the family members of this group" });
    }

    // 3. Fetch all members explicitly belonging to this group
    const membersInGroup = await FamilyMember.find({ associatedGroup: groupId })
      .select('_id name parentId partners createdBy');

    if (membersInGroup.length === 0) {
      return res.json([]);
    }

    // 4. Build the tree iteratively
    const allMemberIdsInTree = new Set(membersInGroup.map(m => m._id.toString()));
    let newIdsAdded = true;

    while (newIdsAdded) {
      newIdsAdded = false;
      const currentTreeIds = Array.from(allMemberIdsInTree);

      const newlyFoundMembers = await FamilyMember.find({
        $or: [
          { parentId: { $in: currentTreeIds } },
          { partners: { $in: currentTreeIds } }
        ],
        _id: { $nin: currentTreeIds }
      }).select('_id name parentId partners createdBy');

      if (newlyFoundMembers.length > 0) {
        newlyFoundMembers.forEach(member => {
          if (!allMemberIdsInTree.has(member._id.toString())) {
            allMemberIdsInTree.add(member._id.toString());
            newIdsAdded = true;
          }
        });
      }
    }

    // 5. Fetch full details
    const familyMembers = await FamilyMember.find({
      _id: { $in: Array.from(allMemberIdsInTree) }
    })
      .populate('createdBy', 'fullName email')
      .populate('parentId', 'name')
      .populate('partners', 'name');

    res.json(familyMembers);

  } catch (err) {
    console.error("Error in the getFamilyMemberByGroup controller:", err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

