// backend/routes/familyGroupRoutes.js
import express from 'express';
import {
    createFamilyGroup,
    getMyFamilyGroups,
    getFamilyGroupById,
    updateFamilyGroup,
    sendFamilyGroupInvitation, // Updated import
    acceptFamilyGroupInvitation, // New import
    removeMemberFromFamilyGroup,
    deleteFamilyGroup,
    updateMemberRole,
    getMyInvitations,
    declineFamilyGroupInvitation
} from '../controllers/familyGroup.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';

const router = express.Router();

// Routes for Family Group management
router.route('/')
    .post(protectRoute, createFamilyGroup);
router.route('/my')
    .get(protectRoute, getMyFamilyGroups);

router.route('/:id')
    .get(protectRoute, getFamilyGroupById)
    .put(protectRoute, updateFamilyGroup)
    .delete(protectRoute, deleteFamilyGroup);

// New route for sending invitations
router.route('/:id/invite')
    .post(protectRoute, sendFamilyGroupInvitation);

// New route for accepting invitations
router.route('/invite/accept')
    .post(protectRoute, acceptFamilyGroupInvitation);

//new route for declining invitation
router.route('/invite/decline')
    .post(protectRoute,declineFamilyGroupInvitation);

//new route for updating member role
router.route('/:id/update-role')
    .put(protectRoute, updateMemberRole);


router.route('/:id/remove-member')
    .put(protectRoute, removeMemberFromFamilyGroup);

router.route('/invitations/my')
    .get(protectRoute,getMyInvitations);

export default router;
