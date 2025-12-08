// frontend/src/components/albums/AlbumCard.jsx
import React from 'react';
import { MdOutlinePhotoLibrary, MdDelete, MdEdit } from 'react-icons/md';
import toast from 'react-hot-toast';
import albumService from '../../services/albumService';
import Swal from 'sweetalert2';

function AlbumCard({ album, onAlbumClick, onAlbumDeleted, onEditClick }) {
    const createdAt = new Date(album.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    const handleDelete = async (e) => {
        e.stopPropagation();

        Swal.fire({
            title: 'Are you sure?',
            text: `You are about to delete the album "${album.name}" and all its images. This action cannot be undone.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'No, cancel',
            customClass: {
                // Use DaisyUI theme-aware classes for SweetAlert popup
                popup: 'bg-base-200 text-base-content border border-base-300 rounded-lg shadow-xl',
                title: 'text-base-content',
                content: 'text-base-content',
                confirmButton: 'btn btn-error text-error-content',
                cancelButton: 'btn btn-outline',
            },
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await albumService.deleteAlbum(album._id);
                    onAlbumDeleted();
                    toast.success('Album deleted successfully!');
                } catch (error) {
                    console.error("Failed to delete album:", error);
                    toast.error(error.message || "Failed to delete album.");
                }
            }
        });
    };

    const handleEdit = (e) => {
        e.stopPropagation();
        if (onEditClick) {
            onEditClick(album);
        }
    };

    return (
        <div
            // Replaced hardcoded 'bg-gray-700' with DaisyUI's theme-aware 'bg-base-200'
            className="card bg-base-200 shadow-xl image-full cursor-pointer hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
            onClick={() => onAlbumClick(album._id)}
        >
            <figure>
                {album.coverImage ? (
                    <img
                        src={album.coverImage}
                        alt={`Cover for ${album.name}`}
                        className="w-full h-48 object-cover"
                        style={{opacity:0.4}}
                        onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/400x200/334155/cbd5e1?text=No+Cover"; }}
                    />
                ) : (
                    <div className="w-full h-48 bg-base-300 flex items-center justify-center text-base-content text-6xl">
                        <MdOutlinePhotoLibrary />
                    </div>
                )}
            </figure>
            <div className="card-body p-4 justify-between">
                <div>
                    {/* Replaced hardcoded 'text-white' with theme-aware 'text-base-content' */}
                    <h2 className="card-title text-base-content text-xl font-bold mb-1">{album.name}</h2>
                    {/* Replaced hardcoded 'text-gray-300' with theme-aware 'text-base-content' */}
                    <p className="text-base-content text-sm mb-2 line-clamp-2">{album.description || "No description provided."}</p>
                </div>
                <div className="card-actions justify-end items-center mt-auto">
                    {/* Replaced hardcoded 'text-gray-400' with theme-aware 'text-base-content' */}
                    <span className="text-base-content text-xs opacity-70 mr-auto">Created: {createdAt}</span>
                    <button
                        onClick={handleEdit}
                        className="btn btn-ghost btn-circle btn-sm text-base-content opacity-70 hover:opacity-100 hover:text-primary"
                        title="Edit Album"
                    >
                        <MdEdit className="h-5 w-5" />
                    </button>
                    <button
                        onClick={handleDelete}
                        className="btn btn-ghost btn-circle btn-sm text-base-content opacity-70 hover:opacity-100 hover:text-error"
                        title="Delete Album"
                    >
                        <MdDelete className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}

export default AlbumCard;