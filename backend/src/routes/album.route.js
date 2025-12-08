// backend/routes/album.routes.js
import express from 'express';
import { protectRoute } from '../middleware/auth.middleware.js'; // Assuming you have a protectRoute middleware
import { upload } from '../middleware/multer.middleware.js';
import {
    createAlbum,
    getAlbums,
    getAlbumById,
    getAlbumsByFamilyGroup,
    updateAlbum,
    deleteAlbum,
    uploadImageToAlbum, // We will define this later in the controller
    getImagesInAlbum, // We will define this later in the controller
    deleteImageFromAlbum // We will define this later in the controller
} from '../controllers/album.controller.js'; // We will create this controller next

const router = express.Router();

// Routes for Album management
router.post('/', protectRoute, createAlbum); // Create a new album
router.get('/', protectRoute, getAlbums);    // Get all albums for the authenticated user
router.get('/:id', protectRoute, getAlbumById); // Get a specific album by ID
router.get('/group/:groupId',protectRoute,getAlbumsByFamilyGroup);
router.put('/:id', protectRoute, updateAlbum); // Update an album by ID
router.delete('/:id', protectRoute, deleteAlbum); // Delete an album by ID (and its images)

// Routes for Image management within an Album
router.post(
    '/:albumId/images',
    protectRoute,
    upload.array('images', 10), 
    uploadImageToAlbum
);
router.get('/:albumId/images', protectRoute, getImagesInAlbum);
router.delete('/:albumId/images/:imageId', protectRoute, deleteImageFromAlbum);


export default router;