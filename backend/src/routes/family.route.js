import express from 'express';
import * as familyController from '../controllers/family.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';
import { uploadSingleImage } from '../middleware/multer.middleware.js';


console.log("family.route.js loaded!");
const router= express.Router();


// New Route: Get all collaborations related to the authenticated user
router.get('/collaborations', protectRoute, familyController.getCollaborations);

console.log("Registering POST /add route...");
//route to add a new family member
router.post('/add', protectRoute, uploadSingleImage,familyController.addFamilyMember);

//route to get the entire family map for the authenticated user
router.get('/map',protectRoute,familyController.getFamilyMap);

//route to search for family members
router.get('/search',protectRoute,familyController.searchFamilyMembers);


//route to get a single family member by ID
router.get('/:id',protectRoute,familyController.getFamilyMemberById);

//route to update an existing family member by ID
router.put('/:id',protectRoute,uploadSingleImage,familyController.updateFamilyMember);


//route to delete a family member by ID
// ADD THIS CONSOLE LOG INSIDE THE ROUTE HANDLER
router.delete("/:id", protectRoute, (req, res, next) => { // Added protectRoute back, assuming it's needed
    console.log(`DELETE request received for ID: ${req.params.id}`); // <-- ADD THIS LINE
    familyController.deleteFamilyMember(req, res, next); // Call the actual controller
});

router.get('/group/:groupId',protectRoute,familyController.getFamilyMemberByGroup);

export default router;