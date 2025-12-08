import express from 'express';
import * as shareController from '../controllers/share.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';
// path module is not strictly needed here after removing the file serving route
// import path from 'path';

const router = express.Router();

// API routes for sharing and collaboration
router.get('/', protectRoute, shareController.getShareLink); // Add this route to get the existing link
router.post('/generate-link', protectRoute, shareController.generateShareLink);
router.post('/generate-link', protectRoute, shareController.generateShareLink);
router.delete('/revoke-link', protectRoute, shareController.revokeShareLink);
router.post('/collaborate/invite', protectRoute, shareController.inviteCollaborator);
router.put('/collaborate/accept/:invitationId', protectRoute, shareController.acceptCollaborationInvitation);
router.put('/collaborate/change-role', protectRoute, shareController.changeCollaboratorRole);
router.delete('/collaborate/remove/:collaborationId', protectRoute, shareController.removeCollaborator);

// IMPORTANT: This file should NOT contain a route for serving index.html
// The public share link route (e.g., /share/:uniqueShareId) is handled directly in server.js.
// Do NOT add any route like router.get('/:uniqueShareId', ...) here.

export default router;
