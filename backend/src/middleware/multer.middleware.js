import multer from 'multer';
import path from 'path'; // Node.js built-in module for path manipulation

// Configure storage for Multer
// For direct Cloudinary upload, MemoryStorage is often simpler.
const storage = multer.memoryStorage(); // Store files in memory as Buffers

// Filter for image files
const fileFilter = (req, file, cb) => {
    // Allowed file extensions
    const filetypes = /jpeg|jpg|png|gif/;
    // Check extension
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    // Check mime type
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Only images (jpeg, jpg, png, gif) are allowed!'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5 MB file size limit
    }
});

// Export the upload middleware for single file upload
// CHANGED: 'profilePic' to 'profileImage' to match frontend
export const uploadSingleImage = upload.single('profileImage');
export {upload};
