// backend/controllers/album.controller.js
import Album from '../models/album.model.js';
import Image from '../models/image.model.js'; // Will need this for image operations
import User from '../models/user.model.js'; // For populating user info if needed
import cloudinary from 'cloudinary'; // For interacting with Cloudinary
import FamilyGroup from '../models/familyGroup.model.js';

// Configure Cloudinary (ensure your CLOUDINARY_CLOUD_NAME, API_KEY, API_SECRET are in .env)
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// @desc    Create a new album
// @route   POST /api/albums
// @access  Private
// --- createAlbum ---
// @desc    Create a new album
// @route   POST /api/albums
// @access  Private
export const createAlbum = async (req, res) => {
  try {
    const { name, description, sharedWithGroups } = req.body;
    const owner = req.user._id;

    if (!name) {
      return res.status(400).json({ message: "Album name is required." });
    }

    // Check for an existing album with the same name for this owner
    const existingAlbum = await Album.findOne({ name, owner });
    if (existingAlbum) {
      return res.status(409).json({ message: "You already have an album with this name. Please choose a different name." });
    }

    // ✅ Fix: Verify membership correctly
    if (sharedWithGroups && sharedWithGroups.length > 0) {
      const groups = await FamilyGroup.find({
        _id: { $in: sharedWithGroups },
        "members.user": owner   // ✅ correct membership check
      });
      if (groups.length !== sharedWithGroups.length) {
        return res.status(403).json({ message: "You are not authorized to share with all specified groups." });
      }
    }

    const newAlbum = new Album({
      name,
      description,
      owner,
      sharedWithGroups: sharedWithGroups || []
    });

    const savedAlbum = await newAlbum.save();
    res.status(201).json({ message: "Album created successfully!", album: savedAlbum });

  } catch (error) {
    console.error("Error creating album:", error.message);
    res.status(500).json({ message: "Internal server error." });
  }
};


// --- getAlbumsByFamilyGroup ---
// @desc    Get all albums shared with a specific family group
// @route   GET /api/albums/group/:groupId
// @access  Private
export const getAlbumsByFamilyGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    console.log('Fetching albums for groupId:', groupId);

    // ✅ Fix: Check against members.user
    const familyGroup = await FamilyGroup.findOne({
      _id: groupId,
      "members.user": userId
    });

    if (!familyGroup) {
      return res.status(403).json({ message: "You are not authorized to view this group's albums." });
    }

    const albums = await Album.find({
      sharedWithGroups: { $in: [groupId] }
    }).sort({ createdAt: -1 });

    res.status(200).json({ albums });

  } catch (error) {
    console.error("Error fetching albums for family group:", error.message);
    res.status(500).json({ message: "Internal server error." });
  }
};


// @desc    Get all albums for the authenticated user
// @route   GET /api/albums
// @access  Private
export const getAlbums = async (req, res) => {
    try {
        const owner = req.user._id;
        const albums = await Album.find({
            owner,
            // Use the $or operator to check for albums that are not shared with any groups
            $or: [
                { sharedWithGroups: { $exists: false } }, // Case 1: The field doesn't exist (old albums)
                { sharedWithGroups: { $size: 0 } }       // Case 2: The field exists but is empty (new private albums)
            ]
        }).sort({ createdAt: -1 });

        res.status(200).json({ albums });;
    } catch (error) {
        console.error("Error fetching albums:", error.message);
        res.status(500).json({ message: "Internal server error." });
    }
};

// @desc    Get a specific album by ID
// @route   GET /api/albums/:id
// @access  Private (Owner only)
export const getAlbumById = async (req, res) => {
    try {
        const { id } = req.params;
        const owner = req.user._id;

        const album = await Album.findOne({ _id: id, owner });

        if (!album) {
            return res.status(404).json({ message: "Album not found or you don't have access." });
        }

        res.status(200).json({ album });

    } catch (error) {
        console.error("Error fetching album by ID:", error.message);
        res.status(500).json({ message: "Internal server error." });
    }
};

// @desc    Update an album
// @route   PUT /api/albums/:id
// @access  Private (Owner only)
export const updateAlbum = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;
        const owner = req.user._id;

        const album = await Album.findOne({ _id: id, owner });

        if (!album) {
            return res.status(404).json({ message: "Album not found or you don't have access." });
        }

        // Check if new name conflicts with another existing album name (excluding current album)
        if (name && name !== album.name) {
            const existingAlbumWithSameName = await Album.findOne({ name, owner, _id: { $ne: id } });
            if (existingAlbumWithSameName) {
                return res.status(409).json({ message: "You already have an album with this name. Please choose a different name." });
            }
        }

        album.name = name || album.name;
        album.description = description !== undefined ? description : album.description; // Allow clearing description

        await album.save();
        res.status(200).json({ message: "Album updated successfully!", album });

    } catch (error) {
        console.error("Error updating album:", error.message);
        res.status(500).json({ message: "Internal server error." });
    }
};

// @desc    Delete an album (and all its associated images from DB and Cloudinary)
// @route   DELETE /api/albums/:id
// @access  Private (Owner only)
export const deleteAlbum = async (req, res) => {
    try {
        const { id } = req.params;
        const owner = req.user._id;

        const album = await Album.findOne({ _id: id, owner });

        if (!album) {
            return res.status(404).json({ message: "Album not found or you don't have access." });
        }

        // Find all images associated with this album
        const imagesToDelete = await Image.find({ album: album._id });

        // Delete images from Cloudinary
        const cloudinaryDeletePromises = imagesToDelete.map(img =>
            cloudinary.uploader.destroy(img.public_id)
        );
        await Promise.all(cloudinaryDeletePromises);

        // Delete images from the database
        await Image.deleteMany({ album: album._id });

        // Delete the album itself
        await Album.deleteOne({ _id: id });

        res.status(200).json({ message: "Album and all its images deleted successfully!" });

    } catch (error) {
        console.error("Error deleting album:", error.message);
        res.status(500).json({ message: "Internal server error." });
    }
};

// --- Image Management Controller Functions (Placeholders for now) ---
// We will implement these in detail after setting up multer middleware.

export const uploadImageToAlbum = async (req, res) => {
    try {
        const { albumId } = req.params;
        const uploaderId = req.user._id;
        const files = req.files;

        if (!files || files.length === 0) {
            return res.status(400).json({ message: "No image files uploaded." });
        }

        const album = await Album.findById(albumId);

        if (!album) {
            return res.status(404).json({ message: "Album not found." });
        }

        // --- Authorization Check for Upload (Contributor/Write Access) ---
        // ... (your existing authorization check remains the same) ...
        let isAuthorized = false;
        if (album.owner.toString() === uploaderId.toString()) {
            isAuthorized = true;
        } else {
            const collaboration = await Collaboration.findOne({
                familyMapOwnerId: album.owner,
                collaboratorId: uploaderId,
                role: 'contributor',
                status: 'accepted'
            });
            if (collaboration) {
                isAuthorized = true;
            }
        }

        if (!isAuthorized) {
            return res.status(403).json({ message: "You are not authorized to upload images to this album." });
        }
        // ----------------------------------------------

        const uploadedImages = [];
        // Determine if this album currently has any images *before* starting uploads.
        // This helps us decide if the first uploaded image should be the cover.
        const hasExistingImages = await Image.exists({ album: album._id }); // Returns a truthy value (like an object) or null

        const uploadPromises = files.map(async (file) => {
            try {
                const folderName = `family-map/users/${album.owner.toString()}/albums/${album.name.toLowerCase().replace(/\s/g, '-')}`;

                const dataUri = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

                const result = await cloudinary.uploader.upload(dataUri, {
                    folder: folderName,
                    resource_type: "image",
                    public_id: `${folderName.replace(/\//g, '_')}_${Date.now()}_${file.originalname.split('.')[0]}`.substring(0, 100)
                });

                const newImage = new Image({
                    public_id: result.public_id,
                    url: result.secure_url,
                    filename: file.originalname,
                    album: album._id,
                    uploadedBy: uploaderId
                });

                await newImage.save();
                uploadedImages.push(newImage);

                // --- NEW LOGIC FOR COVER IMAGE ---
                // If there were no images before this upload, and this is the first image being successfully uploaded
                // to this batch, then set it as the album cover.
                if (!hasExistingImages && uploadedImages.length === 1 && !newImage.error) {
                    album.coverImage = newImage.url; // Set the URL of the first uploaded image as cover
                    await album.save(); // Save the album with the new cover image
                }
                // If the album already had images, or if this isn't the first in this batch,
                // we don't automatically set the cover here. A separate "set as cover" feature
                // could be added later if needed.
                // ----------------------------------

            } catch (uploadError) {
                console.error(`Error uploading file ${file.originalname} to Cloudinary or saving to DB:`, uploadError);
                uploadedImages.push({ filename: file.originalname, error: uploadError.message });
            }
        });

        await Promise.all(uploadPromises);

        if (uploadedImages.some(img => img.error)) {
            return res.status(207).json({
                message: "Some images uploaded successfully, but others failed.",
                uploaded: uploadedImages.filter(img => !img.error),
                failed: uploadedImages.filter(img => img.error)
            });
        }

        res.status(200).json({ message: "Images uploaded successfully!", images: uploadedImages });

    } catch (error) {
        console.error("Error in uploadImageToAlbum:", error.message);
        res.status(500).json({ message: "Internal server error." });
    }
};

// @desc    Get all images in a specific album
// @route   GET /api/albums/:albumId/images
// @access  Private (Owner or authorized viewer/contributor)
export const getImagesInAlbum = async (req, res) => {
    try {
        const { albumId } = req.params;
        const userId = req.user._id;

        const album = await Album.findById(albumId);

        if (!album) {
            return res.status(404).json({ message: "Album not found." });
        }

        // --- Authorization Check for Read Access ---
        let isAuthorized = false;
        if (album.owner.toString() === userId.toString()) {
            isAuthorized = true; // User is the owner of the album
        } else {
            // Check if the user is an accepted 'viewer' or 'contributor' collaborator on the album owner's map
            const collaboration = await Collaboration.findOne({
                familyMapOwnerId: album.owner, // The owner of the album is the owner of the map
                collaboratorId: userId,
                role: { $in: ['viewer', 'contributor'] }, // 'viewer' or 'contributor' role allows read access
                status: 'accepted'
            });
            if (collaboration) {
                isAuthorized = true;
            }
        }

        if (!isAuthorized) {
            return res.status(403).json({ message: "You are not authorized to view images in this album." });
        }
        // ----------------------------------------------

        const images = await Image.find({ album: album._id }).sort({ createdAt: 1 }); // Sort by oldest first
        res.status(200).json({ images, albumName: album.name });

    } catch (error) {
        console.error("Error fetching images in album:", error.message);
        res.status(500).json({ message: "Internal server error." });
    }
};

// @desc    Delete a specific image from an album (from DB and Cloudinary)
// @route   DELETE /api/albums/:albumId/images/:imageId
// @access  Private (Owner or authorized contributor)
export const deleteImageFromAlbum = async (req, res) => {
    try {
        const { albumId, imageId } = req.params;
        const userId = req.user._id;

        const image = await Image.findById(imageId);

        if (!image) {
            return res.status(404).json({ message: "Image not found." });
        }
        if (image.album.toString() !== albumId) {
            return res.status(400).json({ message: "Image does not belong to the specified album." });
        }

        const album = await Album.findById(albumId);
        if (!album) {
            // This case should ideally not happen if image exists and links to a valid album
            return res.status(404).json({ message: "Associated album not found." });
        }

        // --- Authorization Check for Delete (Contributor/Write Access) ---
        let isAuthorized = false;
        if (album.owner.toString() === userId.toString()) {
            isAuthorized = true; // User is the owner of the album
        } else {
            // Check if the user is an accepted 'contributor' collaborator on the album owner's map
            const collaboration = await Collaboration.findOne({
                familyMapOwnerId: album.owner, // The owner of the album is the owner of the map
                collaboratorId: userId,
                role: 'contributor', // Only 'contributor' role can delete (write access)
                status: 'accepted'
            });
            if (collaboration) {
                isAuthorized = true;
            }
        }

        if (!isAuthorized) {
            return res.status(403).json({ message: "You are not authorized to delete images from this album." });
        }
        // ----------------------------------------------

        // Delete from Cloudinary
        await cloudinary.uploader.destroy(image.public_id);

        // Delete from MongoDB
        await Image.deleteOne({ _id: imageId });

        res.status(200).json({ message: "Image deleted successfully!" });

    } catch (error) {
        console.error("Error deleting image from album:", error.message);
        res.status(500).json({ message: "Internal server error." });
    }
};
// @desc    Get all albums shared with a specific family group
// @route   GET /api/albums/group/:groupId
// @access  Private
