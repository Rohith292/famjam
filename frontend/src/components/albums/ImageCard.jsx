// frontend/src/components/albums/ImageCard.jsx
import React from 'react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import albumService from '../../services/albumService';
import { MdDelete } from 'react-icons/md';

function ImageCard({ image, albumId, onImageDeleted, onImageClick }) { // <--- Added onImageClick prop
    const uploadedAt = new Date(image.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    const handleDelete = async () => {
        Swal.fire({
            title: 'Are you sure?',
            text: `You are about to delete the image "${image.filename}". This action cannot be undone.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'No, cancel',
            customClass: {
                // Using theme-aware DaisyUI classes for SweetAlert
                popup: 'bg-base-200 text-base-content border border-base-300 rounded-lg shadow-xl',
                title: 'text-base-content',
                content: 'text-base-content',
                confirmButton: 'btn btn-error',
                cancelButton: 'btn btn-outline',
            },
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await albumService.deleteImageFromAlbum(albumId, image._id);
                    onImageDeleted();
                    toast.success('Image deleted successfully!');
                } catch (error) {
                    console.error("Failed to delete image:", error);
                    toast.error(error.message || "Failed to delete image.");
                }
            }
        });
    };

    // NEW: Call the onImageClick prop function
    const handleImageClick = () => {
        if (onImageClick) {
            onImageClick(image); // Pass the entire image object to the parent's lightbox handler
        }
    };

    return (
        // Replaced hardcoded red backgrounds with theme-aware base colors
        <div className="card bg-base-200 shadow-lg group relative overflow-hidden rounded-lg">
            <figure className="relative w-full h-48 sm:h-56 md:h-64 lg:h-72 overflow-hidden cursor-pointer"
                onClick={handleImageClick} // <--- Call the new handler
            >
                <img
                    src={image.url}
                    alt={image.filename}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/400x400/334155/cbd5e1?text=Image+Error"; }} // Fallback for broken images
                />
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                        // Using DaisyUI semantic colors and theme-aware button classes
                        className="btn btn-circle btn-error text-error-content hover:scale-110 transition-transform duration-200"
                        title="Delete Image"
                    >
                        <MdDelete className="h-6 w-6" />
                    </button>
                </div>
            </figure>

            {/* Replaced hardcoded gray text colors with theme-aware text-base-content */}
            <div className="card-body p-4 text-base-content">
                <h2 className="card-title text-lg font-semibold truncate" title={image.filename}>
                    {image.filename}
                </h2>
                <p className="text-sm opacity-70">Uploaded: {uploadedAt}</p>
            </div>
        </div>
    );
}

export default ImageCard;
